import { randomUUID } from 'node:crypto';
import type { Prisma, PrismaClient } from '@prisma/client';
import {
  BANKRUPTCY_FLOOR,
  BATTLE_EXPIRY_HOURS,
  CLASSIC_RUN_ROUNDS,
  STARTING_BANKROLL,
  decideBattleVerdict,
  scoreRound,
} from '@signal-or-noise/game-engine';
import {
  battleInviteSchema,
  battleReadySchema,
  createBattleSchema,
  getBattleStateSchema,
  listBattlesSchema,
  scenarioOrderSchema,
  submitBattleDecisionSchema,
} from './contracts';
import type {
  BattleDecisionPayload,
  BattleInvitePreviewPayload,
  BattleListEntryPayload,
  BattleOpponentLastCallPayload,
  BattleStatePayload,
  BattleStatusValue,
  BattleSummaryRoundPayload,
  ScenarioOrderEntry,
} from './contracts';
import { guessIsCorrect } from './companyGuess';
import { DatabaseDomainError } from './errors';
import {
  decimalToNumber as number,
  parseInput,
  prismaErrorCode,
  shuffled,
  withSerializableRetry,
} from './serviceUtils';
import type { TransactionClient } from './serviceUtils';

const PLAYER_INCLUDE = {
  players: {
    include: {
      user: { select: { publicAlias: true, publicDisplayName: true } },
    },
  },
} as const;

type BattleWithPlayers = Prisma.FriendBattleGetPayload<{
  include: typeof PLAYER_INCLUDE;
}>;

type BattlePlayerRow = BattleWithPlayers['players'][number];

type DecisionRow = Prisma.FriendBattleDecisionGetPayload<Record<string, never>>;

function publicName(user: { publicAlias: string; publicDisplayName: string | null }): string {
  return user.publicDisplayName ?? user.publicAlias;
}

function parseBattleOrder(battle: { scenarioOrder: unknown; totalRounds: number }): ScenarioOrderEntry[] {
  const result = scenarioOrderSchema.safeParse(battle.scenarioOrder);
  if (!result.success || result.data.length !== battle.totalRounds) {
    throw new DatabaseDomainError('INVALID_STATE', 'Battle scenario snapshot is invalid');
  }
  return result.data;
}

function isUnfinished(status: BattleStatusValue): boolean {
  return status === 'awaiting_opponent' || status === 'awaiting_ready' || status === 'in_progress';
}

/**
 * Highest round index whose decisions are jointly settled and safe to expose.
 * During `deciding`, only earlier rounds are settled; during `reveal` (and at
 * completion, which never advances the index) the current round is settled.
 */
function settledThroughRound(battle: {
  status: BattleStatusValue;
  roundPhase: 'deciding' | 'reveal';
  currentRoundIndex: number;
}): number {
  if (battle.status === 'awaiting_opponent' || battle.status === 'awaiting_ready') return -1;
  return battle.roundPhase === 'reveal'
    ? battle.currentRoundIndex
    : battle.currentRoundIndex - 1;
}

function decisionPayload(decision: DecisionRow): BattleDecisionPayload {
  return {
    roundIndex: decision.roundIndex,
    action: decision.action,
    confidence: decision.confidence,
    companyGuess: decision.companyGuess,
    companyGuessCorrect: decision.companyGuessCorrect,
    stakeAmount: number(decision.stakeAmount),
    bankrollBefore: number(decision.bankrollBefore),
    bankrollAfter: number(decision.bankrollAfter),
    pnlAmount: number(decision.pnlAmount),
    signalScoreDelta: number(decision.signalScoreDelta),
    wasCorrect: decision.wasCorrect,
    wasAutoPass: decision.wasAutoPass,
  };
}

export class FriendBattleService {
  private readonly random: () => number;
  private readonly now: () => Date;

  constructor(
    private readonly prisma: PrismaClient,
    options?: { random?: () => number; now?: () => Date },
  ) {
    this.random = options?.random ?? Math.random;
    this.now = options?.now ?? (() => new Date());
  }

  /**
   * Creates one immutable battle per invite (D052): the ordered scenario
   * snapshot, difficulty, and timer are fixed here and never change.
   */
  async createBattle(input: unknown): Promise<BattleStatePayload> {
    const parsed = parseInput(() => createBattleSchema.parse(input));
    const battleId = await withSerializableRetry(
      () => this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: parsed.userId },
          select: { id: true },
        });
        if (!user) throw new DatabaseDomainError('NOT_FOUND', 'User not found');

        const totalRounds = CLASSIC_RUN_ROUNDS[parsed.difficulty];
        const startingBankroll = STARTING_BANKROLL[parsed.difficulty];
        const candidates = await tx.scenario.findMany({
          where: {
            status: 'active',
            variants: { some: { difficulty: parsed.difficulty } },
          },
          select: { id: true },
        });
        if (candidates.length < totalRounds) {
          throw new DatabaseDomainError('INVALID_STATE', 'Not enough active scenarios for this battle');
        }
        const scenarioOrder = shuffled(candidates, this.random)
          .slice(0, totalRounds)
          .map(({ id }) => ({ scenarioId: id, difficulty: parsed.difficulty }));
        const createdAt = this.now();
        const battle = await tx.friendBattle.create({
          data: {
            inviteCode: randomUUID().replace(/-/g, ''),
            creatorId: user.id,
            difficulty: parsed.difficulty,
            timerSeconds: parsed.timerSeconds,
            scenarioOrder,
            startingBankroll,
            totalRounds,
            createdAt,
            expiresAt: new Date(createdAt.getTime() + BATTLE_EXPIRY_HOURS * 3_600_000),
            players: {
              create: {
                userId: user.id,
                role: 'creator',
                currentBankroll: startingBankroll,
              },
            },
          },
          select: { id: true },
        });
        return battle.id;
      }, { isolationLevel: 'Serializable' }),
      'Battle creation conflicted — try again',
    );
    return this.getBattleState({ userId: parsed.userId, battleId });
  }

  /** Signed-in-only preview of an invite; never exposes scenario content. */
  async getInvitePreview(input: unknown): Promise<BattleInvitePreviewPayload> {
    const parsed = parseInput(() => battleInviteSchema.parse(input));
    const battle = await this.prisma.friendBattle.findUnique({
      where: { inviteCode: parsed.inviteCode },
      include: {
        creator: { select: { publicAlias: true, publicDisplayName: true } },
      },
    });
    if (!battle) throw new DatabaseDomainError('NOT_FOUND', 'Battle invite not found');
    const expired = isUnfinished(battle.status) && this.now() >= battle.expiresAt;
    const status: BattleStatusValue = expired ? 'expired' : battle.status;
    return {
      battleId: battle.id,
      creatorName: publicName(battle.creator),
      difficulty: battle.difficulty,
      timerSeconds: (battle.timerSeconds ?? null) as BattleInvitePreviewPayload['timerSeconds'],
      totalRounds: battle.totalRounds,
      startingBankroll: number(battle.startingBankroll),
      joinable: status === 'awaiting_opponent' && battle.creatorId !== parsed.userId,
      status,
      expiresAt: battle.expiresAt.toISOString(),
    };
  }

  /**
   * Exactly one other signed-in player may join, once. The guarded update
   * settles concurrent joins: one wins, the rest see CONFLICT.
   */
  async joinBattle(input: unknown): Promise<BattleStatePayload> {
    const parsed = parseInput(() => battleInviteSchema.parse(input));
    const battleId = await withSerializableRetry(
      () => this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: parsed.userId },
          select: { id: true },
        });
        if (!user) throw new DatabaseDomainError('NOT_FOUND', 'User not found');
        const battle = await tx.friendBattle.findUnique({
          where: { inviteCode: parsed.inviteCode },
          select: {
            id: true,
            creatorId: true,
            opponentId: true,
            status: true,
            startingBankroll: true,
            expiresAt: true,
          },
        });
        if (!battle) throw new DatabaseDomainError('NOT_FOUND', 'Battle invite not found');
        if (battle.opponentId === user.id) return battle.id;
        if (battle.creatorId === user.id) {
          throw new DatabaseDomainError('FORBIDDEN', 'You created this battle — share the invite instead');
        }
        if (battle.status === 'expired'
          || (isUnfinished(battle.status) && this.now() >= battle.expiresAt)) {
          await this.expireBattle(tx, battle.id);
          throw new DatabaseDomainError('INVALID_STATE', 'This battle invite has expired');
        }
        if (battle.status !== 'awaiting_opponent') {
          throw new DatabaseDomainError('CONFLICT', 'This battle already has two players');
        }
        const joined = await tx.friendBattle.updateMany({
          where: { id: battle.id, status: 'awaiting_opponent', opponentId: null },
          data: { opponentId: user.id, status: 'awaiting_ready' },
        });
        if (joined.count !== 1) {
          throw new DatabaseDomainError('CONFLICT', 'This battle already has two players');
        }
        await tx.friendBattlePlayer.create({
          data: {
            battleId: battle.id,
            userId: user.id,
            role: 'opponent',
            currentBankroll: battle.startingBankroll,
          },
        });
        return battle.id;
      }, { isolationLevel: 'Serializable' }),
      'This battle already has two players',
    );
    return this.getBattleState({ userId: parsed.userId, battleId });
  }

  async listBattles(input: unknown): Promise<BattleListEntryPayload[]> {
    const parsed = parseInput(() => listBattlesSchema.parse(input));
    const battles = await this.prisma.friendBattle.findMany({
      where: { OR: [{ creatorId: parsed.userId }, { opponentId: parsed.userId }] },
      include: PLAYER_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 25,
    });
    const now = this.now();
    return battles.map((battle) => {
      const expired = isUnfinished(battle.status) && now >= battle.expiresAt;
      const status: BattleStatusValue = expired ? 'expired' : battle.status;
      const isCreator = battle.creatorId === parsed.userId;
      const opponentPlayer = battle.players.find(
        (player) => player.role === (isCreator ? 'opponent' : 'creator'),
      );
      return {
        id: battle.id,
        status,
        difficulty: battle.difficulty,
        timerSeconds: (battle.timerSeconds ?? null) as BattleListEntryPayload['timerSeconds'],
        totalRounds: battle.totalRounds,
        currentRoundIndex: battle.currentRoundIndex,
        opponentName: opponentPlayer ? publicName(opponentPlayer.user) : null,
        outcome: this.viewerOutcome(battle.outcome, isCreator),
        createdAt: battle.createdAt.toISOString(),
        expiresAt: battle.expiresAt.toISOString(),
      };
    });
  }

  private viewerOutcome(
    outcome: 'creator_win' | 'opponent_win' | 'draw' | null,
    isCreator: boolean,
  ): 'you_won' | 'you_lost' | 'draw' | null {
    if (outcome === null) return null;
    if (outcome === 'draw') return 'draw';
    const creatorWon = outcome === 'creator_win';
    return creatorWon === isCreator ? 'you_won' : 'you_lost';
  }

  /**
   * Authoritative, viewer-scoped battle state. Reading first enforces server
   * time: expiry after 24 hours, and the round deadline, where a missing
   * decision becomes a normal Pass (D052). Reconnects therefore always resume
   * the same absolute deadline and the same settled truth.
   */
  async getBattleState(input: unknown): Promise<BattleStatePayload> {
    const parsed = parseInput(() => getBattleStateSchema.parse(input));
    let battle = await this.loadBattle(parsed.battleId, parsed.userId);
    if (this.needsSync(battle)) {
      await this.syncBattle(battle.id);
      battle = await this.loadBattle(parsed.battleId, parsed.userId);
    }
    return this.buildStatePayload(battle, parsed.userId);
  }

  /**
   * Readiness gate (D052): round 0 opens after both players ready up, and
   * round N+1 opens only after both players leave round N's reveal.
   */
  async setReady(input: unknown): Promise<BattleStatePayload> {
    const parsed = parseInput(() => battleReadySchema.parse(input));
    await withSerializableRetry(
      () => this.prisma.$transaction(async (tx) => {
        const battle = await this.loadBattleTx(tx, parsed.battleId, parsed.userId);
        const synced = await this.syncBattleTx(tx, battle);
        const player = this.playerOf(synced, parsed.userId);
        if (parsed.round <= player.readyRound) return;
        if (synced.status === 'awaiting_ready') {
          if (parsed.round !== 0) {
            throw new DatabaseDomainError('CONFLICT', 'The battle starts at round 1');
          }
        } else if (synced.status === 'in_progress' && synced.roundPhase === 'reveal') {
          if (parsed.round !== synced.currentRoundIndex + 1) {
            throw new DatabaseDomainError('CONFLICT', 'That round is not up next');
          }
        } else {
          throw new DatabaseDomainError('INVALID_STATE', 'The battle is not waiting on ready');
        }
        await tx.friendBattlePlayer.update({
          where: { id: player.id },
          data: { readyRound: parsed.round },
        });
        const other = this.otherPlayerOf(synced, parsed.userId);
        if (other.readyRound >= parsed.round) {
          await tx.friendBattle.update({
            where: { id: synced.id },
            data: {
              status: 'in_progress',
              currentRoundIndex: parsed.round,
              roundPhase: 'deciding',
              roundDeadlineAt: synced.timerSeconds
                ? new Date(this.now().getTime() + synced.timerSeconds * 1000)
                : null,
            },
          });
        }
      }, { isolationLevel: 'Serializable' }),
      'Ready-up conflicted — try again',
    );
    return this.getBattleState({ userId: parsed.userId, battleId: parsed.battleId });
  }

  /**
   * Locks one player's decision for the current round. Results are computed
   * and stored immediately but never leave the server until both decisions
   * settle; player aggregates also only move at settlement, so the opponent
   * progress card cannot leak a live round.
   */
  async submitDecision(input: unknown): Promise<BattleStatePayload> {
    const parsed = parseInput(() => submitBattleDecisionSchema.parse(input));
    await withSerializableRetry(
      () => this.prisma.$transaction(async (tx) => {
        const battle = await this.loadBattleTx(tx, parsed.battleId, parsed.userId);
        const synced = await this.syncBattleTx(tx, battle);
        if (synced.status !== 'in_progress' || synced.roundPhase !== 'deciding') {
          // Missing the deadline settles the round as Pass, so a late
          // submission is a resyncable conflict rather than a hard error.
          if (synced.status === 'in_progress' && synced.roundPhase === 'reveal') {
            throw new DatabaseDomainError('CONFLICT', 'Round was already settled or is not current');
          }
          throw new DatabaseDomainError('INVALID_STATE', 'This battle is not accepting decisions');
        }
        if (parsed.roundIndex !== synced.currentRoundIndex) {
          throw new DatabaseDomainError('CONFLICT', 'Round was already settled or is not current');
        }
        const player = this.playerOf(synced, parsed.userId);
        const existing = await tx.friendBattleDecision.findUnique({
          where: {
            battleId_userId_roundIndex: {
              battleId: synced.id,
              userId: parsed.userId,
              roundIndex: parsed.roundIndex,
            },
          },
          select: { id: true },
        });
        if (existing) {
          throw new DatabaseDomainError('CONFLICT', 'Your call for this round is already locked');
        }
        const entry = parseBattleOrder(synced)[synced.currentRoundIndex];
        if (!entry) throw new DatabaseDomainError('INVALID_STATE', 'Current scenario is missing');
        const scenario = await tx.scenario.findUnique({
          where: { id: entry.scenarioId },
          select: {
            id: true,
            companyName: true,
            ticker: true,
            acceptedNames: true,
            actualReturnPercent: true,
          },
        });
        if (!scenario) throw new DatabaseDomainError('INVALID_STATE', 'Current scenario is missing');
        const companyGuessCorrect = guessIsCorrect(parsed.companyGuess, scenario);
        const bankrollBefore = number(player.currentBankroll);
        const outcome = scoreRound({
          action: parsed.action,
          confidence: parsed.confidence,
          currentBankroll: bankrollBefore,
          actualReturnPercent: number(scenario.actualReturnPercent),
          companyGuessCorrect,
        });
        await tx.friendBattleDecision.create({
          data: {
            battleId: synced.id,
            userId: parsed.userId,
            scenarioId: scenario.id,
            roundIndex: parsed.roundIndex,
            action: parsed.action,
            confidence: parsed.confidence ?? null,
            companyGuess: parsed.companyGuess ?? null,
            companyGuessCorrect,
            stakeAmount: outcome.stakeAmount,
            bankrollBefore,
            bankrollAfter: outcome.newBankroll,
            pnlAmount: outcome.pnlAmount,
            signalScoreDelta: outcome.signalScoreDelta,
            wasCorrect: outcome.wasCorrect,
          },
        });
        const roundDecisions = await tx.friendBattleDecision.findMany({
          where: { battleId: synced.id, roundIndex: synced.currentRoundIndex },
        });
        if (roundDecisions.length === 2) {
          await this.settleRound(tx, synced, roundDecisions);
        }
      }, { isolationLevel: 'Serializable' }),
      'Your call for this round is already locked',
    );
    return this.getBattleState({ userId: parsed.userId, battleId: parsed.battleId });
  }

  // -------------------------------------------------------------------------
  // Internals
  // -------------------------------------------------------------------------

  private async loadBattle(battleId: string, userId: string): Promise<BattleWithPlayers> {
    const battle = await this.prisma.friendBattle.findUnique({
      where: { id: battleId },
      include: PLAYER_INCLUDE,
    });
    if (!battle) throw new DatabaseDomainError('NOT_FOUND', 'Battle not found');
    if (battle.creatorId !== userId && battle.opponentId !== userId) {
      throw new DatabaseDomainError('FORBIDDEN', 'You are not part of this battle');
    }
    return battle;
  }

  private async loadBattleTx(
    tx: TransactionClient,
    battleId: string,
    userId: string,
  ): Promise<BattleWithPlayers> {
    const battle = await tx.friendBattle.findUnique({
      where: { id: battleId },
      include: PLAYER_INCLUDE,
    });
    if (!battle) throw new DatabaseDomainError('NOT_FOUND', 'Battle not found');
    if (battle.creatorId !== userId && battle.opponentId !== userId) {
      throw new DatabaseDomainError('FORBIDDEN', 'You are not part of this battle');
    }
    return battle;
  }

  private needsSync(battle: BattleWithPlayers): boolean {
    const now = this.now();
    if (isUnfinished(battle.status) && now >= battle.expiresAt) return true;
    return (
      battle.status === 'in_progress' &&
      battle.roundPhase === 'deciding' &&
      battle.roundDeadlineAt !== null &&
      now >= battle.roundDeadlineAt
    );
  }

  /** Runs expiry/deadline enforcement in its own Serializable transaction. */
  private async syncBattle(battleId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const battle = await tx.friendBattle.findUnique({
          where: { id: battleId },
          include: PLAYER_INCLUDE,
        });
        if (battle) await this.syncBattleTx(tx, battle);
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      // A concurrent poll may have enforced the same deadline; the re-read
      // after this call sees the settled truth either way.
      const code = prismaErrorCode(error);
      if (code !== 'P2034' && code !== 'P2002') throw error;
    }
  }

  /**
   * Server-time enforcement: expire unfinished battles 24h after creation,
   * and settle a deciding round whose deadline passed by recording a normal
   * Pass for each missing decision. Returns the battle reflecting any change.
   */
  private async syncBattleTx(
    tx: TransactionClient,
    battle: BattleWithPlayers,
  ): Promise<BattleWithPlayers> {
    const now = this.now();
    if (isUnfinished(battle.status) && now >= battle.expiresAt) {
      await this.expireBattle(tx, battle.id);
      return this.reloadBattleTx(tx, battle.id);
    }
    if (
      battle.status !== 'in_progress' ||
      battle.roundPhase !== 'deciding' ||
      battle.roundDeadlineAt === null ||
      now < battle.roundDeadlineAt
    ) {
      return battle;
    }

    const entry = parseBattleOrder(battle)[battle.currentRoundIndex];
    if (!entry) throw new DatabaseDomainError('INVALID_STATE', 'Current scenario is missing');
    const scenario = await tx.scenario.findUnique({
      where: { id: entry.scenarioId },
      select: { id: true, actualReturnPercent: true },
    });
    if (!scenario) throw new DatabaseDomainError('INVALID_STATE', 'Current scenario is missing');
    const existing = await tx.friendBattleDecision.findMany({
      where: { battleId: battle.id, roundIndex: battle.currentRoundIndex },
    });
    const decidedUserIds = new Set(existing.map((decision) => decision.userId));
    for (const player of battle.players) {
      if (decidedUserIds.has(player.userId)) continue;
      const bankrollBefore = number(player.currentBankroll);
      const outcome = scoreRound({
        action: 'pass',
        currentBankroll: bankrollBefore,
        actualReturnPercent: number(scenario.actualReturnPercent),
        companyGuessCorrect: null,
      });
      await tx.friendBattleDecision.create({
        data: {
          battleId: battle.id,
          userId: player.userId,
          scenarioId: scenario.id,
          roundIndex: battle.currentRoundIndex,
          action: 'pass',
          confidence: null,
          companyGuess: null,
          companyGuessCorrect: null,
          stakeAmount: outcome.stakeAmount,
          bankrollBefore,
          bankrollAfter: outcome.newBankroll,
          pnlAmount: outcome.pnlAmount,
          signalScoreDelta: outcome.signalScoreDelta,
          wasCorrect: outcome.wasCorrect,
          wasAutoPass: true,
        },
      });
    }
    const roundDecisions = await tx.friendBattleDecision.findMany({
      where: { battleId: battle.id, roundIndex: battle.currentRoundIndex },
    });
    if (roundDecisions.length === 2) {
      await this.settleRound(tx, battle, roundDecisions);
    }
    return this.reloadBattleTx(tx, battle.id);
  }

  private async reloadBattleTx(
    tx: TransactionClient,
    battleId: string,
  ): Promise<BattleWithPlayers> {
    const battle = await tx.friendBattle.findUnique({
      where: { id: battleId },
      include: PLAYER_INCLUDE,
    });
    if (!battle) throw new DatabaseDomainError('NOT_FOUND', 'Battle not found');
    return battle;
  }

  private async expireBattle(tx: TransactionClient, battleId: string): Promise<void> {
    await tx.friendBattle.updateMany({
      where: {
        id: battleId,
        status: { in: ['awaiting_opponent', 'awaiting_ready', 'in_progress'] },
      },
      // A deadline belongs only to an actively deciding round. Clear it when
      // the 24-hour battle lifetime wins the race so expired reconnects never
      // carry a stale actionable timestamp.
      data: { status: 'expired', roundDeadlineAt: null },
    });
  }

  /**
   * Joint settlement: both decisions exist, so player aggregates move, the
   * reveal opens, and terminal conditions resolve. A single bankruptcy ends
   * the battle immediately for the other player; simultaneous bankruptcy and
   * final-round completion both use bankroll-then-Signal-Score (D052).
   */
  private async settleRound(
    tx: TransactionClient,
    battle: BattleWithPlayers,
    roundDecisions: DecisionRow[],
  ): Promise<void> {
    const byUser = new Map(roundDecisions.map((decision) => [decision.userId, decision]));
    const settled = battle.players.map((player) => {
      const decision = byUser.get(player.userId);
      if (!decision) throw new DatabaseDomainError('INVALID_STATE', 'Round decision is missing');
      const bankrollAfter = number(decision.bankrollAfter);
      return {
        player,
        decision,
        bankrollAfter,
        signalScoreAfter: number(player.signalScore) + number(decision.signalScoreDelta),
        isBankrupt: bankrollAfter < BANKRUPTCY_FLOOR,
      };
    });
    for (const state of settled) {
      await tx.friendBattlePlayer.update({
        where: { id: state.player.id },
        data: {
          currentBankroll: state.bankrollAfter,
          signalScore: state.signalScoreAfter,
          isBankrupt: state.isBankrupt,
        },
      });
    }

    const creator = settled.find((state) => state.player.role === 'creator');
    const opponent = settled.find((state) => state.player.role === 'opponent');
    if (!creator || !opponent) {
      throw new DatabaseDomainError('INVALID_STATE', 'Battle players are missing');
    }
    const anyBankrupt = creator.isBankrupt || opponent.isBankrupt;
    const isFinalRound = battle.currentRoundIndex === battle.totalRounds - 1;
    if (anyBankrupt || isFinalRound) {
      const verdict = decideBattleVerdict(
        {
          finalBankroll: creator.bankrollAfter,
          signalScore: creator.signalScoreAfter,
          isBankrupt: creator.isBankrupt,
        },
        {
          finalBankroll: opponent.bankrollAfter,
          signalScore: opponent.signalScoreAfter,
          isBankrupt: opponent.isBankrupt,
        },
      );
      await tx.friendBattle.update({
        where: { id: battle.id },
        data: {
          status: 'completed',
          roundPhase: 'reveal',
          roundDeadlineAt: null,
          completedAt: this.now(),
          outcome: verdict === 'a' ? 'creator_win' : verdict === 'b' ? 'opponent_win' : 'draw',
        },
      });
      return;
    }
    await tx.friendBattle.update({
      where: { id: battle.id },
      data: { roundPhase: 'reveal', roundDeadlineAt: null },
    });
  }

  private playerOf(battle: BattleWithPlayers, userId: string): BattlePlayerRow {
    const player = battle.players.find((candidate) => candidate.userId === userId);
    if (!player) throw new DatabaseDomainError('FORBIDDEN', 'You are not part of this battle');
    return player;
  }

  private otherPlayerOf(battle: BattleWithPlayers, userId: string): BattlePlayerRow {
    const player = battle.players.find((candidate) => candidate.userId !== userId);
    if (!player) throw new DatabaseDomainError('INVALID_STATE', 'Battle opponent is missing');
    return player;
  }

  /**
   * Builds the viewer payload. Leakage rules: pre-decision scenario content
   * only while deciding; reveal data only for jointly settled rounds; the
   * opponent's current-round choice never appears — only a boolean that they
   * have locked in (D052).
   */
  private async buildStatePayload(
    battle: BattleWithPlayers,
    userId: string,
  ): Promise<BattleStatePayload> {
    const you = this.playerOf(battle, userId);
    const opponentPlayer = battle.players.find((player) => player.userId !== userId) ?? null;
    const settledThrough = settledThroughRound(battle);
    const decisions = await this.prisma.friendBattleDecision.findMany({
      where: { battleId: battle.id },
      orderBy: { roundIndex: 'asc' },
    });
    const currentRound = battle.currentRoundIndex;
    const yourCurrent = decisions.find(
      (decision) => decision.userId === userId && decision.roundIndex === currentRound,
    ) ?? null;
    const opponentCurrent = opponentPlayer
      ? decisions.find(
        (decision) =>
          decision.userId === opponentPlayer.userId && decision.roundIndex === currentRound,
      ) ?? null
      : null;

    const isDeciding = battle.status === 'in_progress' && battle.roundPhase === 'deciding';
    const showReveal =
      (battle.status === 'in_progress' || battle.status === 'completed') &&
      battle.roundPhase === 'reveal';

    const opponentLastCall = ((): BattleOpponentLastCallPayload | null => {
      if (!opponentPlayer || settledThrough < 0) return null;
      const last = [...decisions]
        .reverse()
        .find(
          (decision) =>
            decision.userId === opponentPlayer.userId && decision.roundIndex <= settledThrough,
        );
      if (!last) return null;
      return {
        roundIndex: last.roundIndex,
        action: last.action,
        confidence: last.confidence,
        companyGuess: last.companyGuess,
      };
    })();

    const scenarioOrder = parseBattleOrder(battle);

    return {
      id: battle.id,
      status: battle.status,
      difficulty: battle.difficulty,
      timerSeconds: (battle.timerSeconds ?? null) as BattleStatePayload['timerSeconds'],
      totalRounds: battle.totalRounds,
      startingBankroll: number(battle.startingBankroll),
      currentRoundIndex: battle.currentRoundIndex,
      roundPhase: battle.roundPhase,
      roundDeadlineAt: battle.roundDeadlineAt?.toISOString() ?? null,
      expiresAt: battle.expiresAt.toISOString(),
      serverNow: this.now().toISOString(),
      ...(battle.status === 'awaiting_opponent' && battle.creatorId === userId
        ? { inviteCode: battle.inviteCode }
        : {}),
      you: {
        name: publicName(you.user),
        bankroll: number(you.currentBankroll),
        signalScore: number(you.signalScore),
        isBankrupt: you.isBankrupt,
        readyRound: you.readyRound,
        hasDecidedCurrentRound: isDeciding && yourCurrent !== null,
        ...(isDeciding && yourCurrent
          ? {
            currentCall: {
              action: yourCurrent.action,
              confidence: yourCurrent.confidence,
              companyGuess: yourCurrent.companyGuess,
            },
          }
          : {}),
      },
      opponent: opponentPlayer
        ? {
          name: publicName(opponentPlayer.user),
          bankroll: number(opponentPlayer.currentBankroll),
          signalScore: number(opponentPlayer.signalScore),
          isBankrupt: opponentPlayer.isBankrupt,
          readyRound: opponentPlayer.readyRound,
          hasDecidedCurrentRound: isDeciding && opponentCurrent !== null,
          lastCall: opponentLastCall,
        }
        : null,
      round: isDeciding ? await this.buildRoundPayload(battle, scenarioOrder) : null,
      reveal: showReveal
        ? await this.buildRevealPayload(battle, decisions, userId)
        : null,
      summary:
        battle.status === 'completed' || battle.status === 'expired'
          ? await this.buildSummaryPayload(battle, decisions, userId, settledThrough)
          : null,
    };
  }

  private async buildRoundPayload(
    battle: BattleWithPlayers,
    scenarioOrder: ScenarioOrderEntry[],
  ) {
    const entry = scenarioOrder[battle.currentRoundIndex];
    if (!entry) throw new DatabaseDomainError('INVALID_STATE', 'Current round is missing');
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: entry.scenarioId },
      select: {
        title: true,
        decisionDateLabel: true,
        holdingPeriodLabel: true,
        variants: {
          where: { difficulty: entry.difficulty },
          select: {
            companyDescription: true,
            macroContext: true,
            situation: true,
            longCase: true,
            shortCase: true,
            setupHints: true,
          },
        },
        marketPoints: {
          where: { phase: 'pre_decision' },
          orderBy: { ordinal: 'asc' },
          select: { pointDate: true, price: true },
        },
      },
    });
    const variant = scenario?.variants[0];
    if (!scenario || !variant) {
      throw new DatabaseDomainError('INVALID_STATE', 'Current scenario content is missing');
    }
    return {
      roundIndex: battle.currentRoundIndex,
      difficulty: entry.difficulty,
      title: scenario.title,
      decisionDateLabel: scenario.decisionDateLabel,
      holdingPeriodLabel: scenario.holdingPeriodLabel,
      ...variant,
      lookbackChart: scenario.marketPoints.map((point) => ({
        date: point.pointDate.toISOString().slice(0, 10),
        price: number(point.price),
      })),
    };
  }

  private async buildRevealPayload(
    battle: BattleWithPlayers,
    decisions: DecisionRow[],
    userId: string,
  ) {
    const roundIndex = battle.currentRoundIndex;
    const yours = decisions.find(
      (decision) => decision.userId === userId && decision.roundIndex === roundIndex,
    );
    const theirs = decisions.find(
      (decision) => decision.userId !== userId && decision.roundIndex === roundIndex,
    );
    if (!yours || !theirs) {
      throw new DatabaseDomainError('INVALID_STATE', 'Reveal round is not settled');
    }
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: yours.scenarioId },
      select: {
        id: true,
        companyName: true,
        ticker: true,
        outcomeLabel: true,
        endingPrice: true,
        actualReturnPercent: true,
        revealShortText: true,
        revealFunFact: true,
        revealWhyItMoved: true,
        marketPoints: {
          where: { phase: 'outcome' },
          orderBy: { ordinal: 'asc' },
          select: { pointDate: true, price: true },
        },
      },
    });
    if (!scenario) throw new DatabaseDomainError('INVALID_STATE', 'Reveal scenario is missing');
    return {
      roundIndex,
      scenarioId: scenario.id,
      companyName: scenario.companyName,
      ticker: scenario.ticker,
      outcomeLabel: scenario.outcomeLabel,
      endingPrice: number(scenario.endingPrice),
      actualReturnPercent: number(scenario.actualReturnPercent),
      shortText: scenario.revealShortText,
      funFact: scenario.revealFunFact,
      whyItMoved: scenario.revealWhyItMoved,
      outcomeChart: scenario.marketPoints.map((point) => ({
        date: point.pointDate.toISOString().slice(0, 10),
        price: number(point.price),
      })),
      you: decisionPayload(yours),
      opponent: decisionPayload(theirs),
    };
  }

  private async buildSummaryPayload(
    battle: BattleWithPlayers,
    decisions: DecisionRow[],
    userId: string,
    settledThrough: number,
  ) {
    const you = this.playerOf(battle, userId);
    const opponentPlayer = battle.players.find((player) => player.userId !== userId) ?? null;
    const isCreator = battle.creatorId === userId;
    const settledDecisions = decisions.filter(
      (decision) => decision.roundIndex <= settledThrough,
    );
    const scenarioIds = [...new Set(settledDecisions.map((decision) => decision.scenarioId))];
    const scenarios = await this.prisma.scenario.findMany({
      where: { id: { in: scenarioIds } },
      select: { id: true, companyName: true, ticker: true, actualReturnPercent: true },
    });
    const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));

    const rounds: BattleSummaryRoundPayload[] = [];
    for (let roundIndex = 0; roundIndex <= settledThrough; roundIndex += 1) {
      const yours = settledDecisions.find(
        (decision) => decision.userId === userId && decision.roundIndex === roundIndex,
      );
      const theirs = settledDecisions.find(
        (decision) => decision.userId !== userId && decision.roundIndex === roundIndex,
      );
      if (!yours || !theirs) continue;
      const scenario = scenarioById.get(yours.scenarioId);
      if (!scenario) continue;
      rounds.push({
        roundIndex,
        companyName: scenario.companyName,
        ticker: scenario.ticker,
        actualReturnPercent: number(scenario.actualReturnPercent),
        you: decisionPayload(yours),
        opponent: decisionPayload(theirs),
      });
    }

    return {
      outcome:
        battle.status === 'expired'
          ? ('expired' as const)
          : this.viewerOutcome(battle.outcome, isCreator) ?? ('draw' as const),
      you: {
        finalBankroll: number(you.currentBankroll),
        signalScore: number(you.signalScore),
        isBankrupt: you.isBankrupt,
      },
      opponent: opponentPlayer
        ? {
          finalBankroll: number(opponentPlayer.currentBankroll),
          signalScore: number(opponentPlayer.signalScore),
          isBankrupt: opponentPlayer.isBankrupt,
        }
        : null,
      rounds,
    };
  }
}
