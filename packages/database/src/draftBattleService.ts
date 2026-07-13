import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import {
  DRAFT_BUDGET,
  computeDraftResult,
  findDraftWindows,
  getDraftFormatConfig,
} from '@signal-or-noise/game-engine';
import type { DraftFormat, DraftPoolEntry } from '@signal-or-noise/game-engine';
import {
  createDraftBattleSchema,
  getDraftBattleInviteSchema,
  getDraftBattleStateSchema,
  joinDraftBattleSchema,
  submitDraftBattleSchema,
} from './contracts';
import type {
  DraftBattleInvitePreviewPayload,
  DraftBattleRevealCompanyPayload,
  DraftBattleStatePayload,
  DraftCardPayload,
} from './contracts';
import { DatabaseDomainError } from './errors';
import { decimalToNumber as number, parseInput, prismaErrorCode, shuffled, withSerializableRetry } from './serviceUtils';
import type { TransactionClient } from './serviceUtils';
import { captureDraftSnapshot, parseDraftSnapshot } from './draftSnapshot';

const BATTLE_EXPIRY_MS = 24 * 3_600_000;

const PLAYER_INCLUDE = {
  players: { include: { user: { select: { publicAlias: true, publicDisplayName: true } } } },
} as const;

type DraftBattleWithPlayers = Prisma.DraftBattleGetPayload<{ include: typeof PLAYER_INCLUDE }>;
type DraftBattlePlayerRow = DraftBattleWithPlayers['players'][number];
type DraftFormatValue = 'classic' | 'quick' | 'era';

function publicName(user: { publicAlias: string; publicDisplayName: string | null }): string {
  return user.publicDisplayName ?? user.publicAlias;
}

function parseIds(value: unknown, expected: number, label: string): string[] {
  if (!Array.isArray(value) || value.length !== expected || value.some((id) => typeof id !== 'string' || id.length === 0)) {
    throw new DatabaseDomainError('INVALID_STATE', `${label} scenario snapshot is invalid`);
  }
  return value as string[];
}

function parseNumbers(value: unknown, expected: number, label: string): number[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value) || value.length !== expected || value.some((entry) => typeof entry !== 'number')) {
    throw new DatabaseDomainError('INVALID_STATE', `${label} submission is invalid`);
  }
  return value as number[];
}

function roleOf(battle: DraftBattleWithPlayers, userId: string): 'creator' | 'opponent' {
  const player = battle.players.find((candidate) => candidate.userId === userId);
  if (!player) throw new DatabaseDomainError('FORBIDDEN', 'You are not part of this Draft Battle');
  return player.role;
}

function isUnfinished(status: DraftBattleWithPlayers['status']): boolean {
  return status === 'awaiting_opponent' || status === 'awaiting_submissions';
}

export class DraftBattleService {
  private readonly random: () => number;
  private readonly now: () => Date;

  constructor(
    private readonly prisma: PrismaClient,
    options?: { random?: () => number; now?: () => Date },
  ) {
    this.random = options?.random ?? Math.random;
    this.now = options?.now ?? (() => new Date());
  }

  async createBattle(input: unknown): Promise<DraftBattleStatePayload> {
    const parsed = parseInput(() => createDraftBattleSchema.parse(input));
    const battleId = await withSerializableRetry(
      () => this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: parsed.userId }, select: { id: true } });
        if (!user) throw new DatabaseDomainError('NOT_FOUND', 'User not found');
        const pool = await this.pickPool(tx, parsed.format, parsed.eraId);
        const scenarioSnapshot = await captureDraftSnapshot(tx, pool);
        const createdAt = this.now();
        const battle = await tx.draftBattle.create({
          data: {
            inviteCode: randomBytes(16).toString('hex'),
            creatorId: user.id,
            format: parsed.format,
            eraId: parsed.eraId ?? null,
            timerSeconds: parsed.timerSeconds,
            scenarioIds: pool,
            scenarioSnapshot,
            budget: DRAFT_BUDGET,
            createdAt,
            expiresAt: new Date(createdAt.getTime() + BATTLE_EXPIRY_MS),
            players: { create: { userId: user.id, role: 'creator' } },
          },
          select: { id: true },
        });
        return battle.id;
      }, { isolationLevel: 'Serializable' }),
      'Draft Battle creation conflicted – try again',
    );
    return this.getBattleState({ userId: parsed.userId, battleId });
  }

  async getInvitePreview(input: unknown): Promise<DraftBattleInvitePreviewPayload> {
    const parsed = parseInput(() => getDraftBattleInviteSchema.parse(input));
    const battle = await this.loadByInvite(parsed.inviteCode);
    if (isUnfinished(battle.status)
      && (this.now() >= battle.expiresAt
        || (battle.submissionDeadlineAt !== null && this.now() >= battle.submissionDeadlineAt))) {
      await this.syncBattle(battle.id);
    }
    const current = await this.loadByInvite(parsed.inviteCode);
    return {
      format: current.format,
      eraId: current.eraId,
      timerSeconds: (current.timerSeconds ?? null) as DraftBattleInvitePreviewPayload['timerSeconds'],
      status: current.status,
      joinable: current.status === 'awaiting_opponent' && current.creatorId !== parsed.userId,
    };
  }

  async joinBattle(input: unknown): Promise<DraftBattleStatePayload> {
    const parsed = parseInput(() => joinDraftBattleSchema.parse(input));
    const battleId = await withSerializableRetry(
      () => this.prisma.$transaction(async (tx) => {
        const battle = await tx.draftBattle.findUnique({ where: { inviteCode: parsed.inviteCode }, select: { id: true, creatorId: true, status: true, opponentId: true, timerSeconds: true } });
        if (!battle) throw new DatabaseDomainError('NOT_FOUND', 'Draft Battle invite not found');
        if (battle.creatorId === parsed.userId) throw new DatabaseDomainError('FORBIDDEN', 'The creator cannot join their own invite');
        if (battle.status !== 'awaiting_opponent' || battle.opponentId) throw new DatabaseDomainError('CONFLICT', 'This Draft Battle invite is already claimed');
        const existing = await tx.draftBattle.findUnique({ where: { id: battle.id }, select: { expiresAt: true } });
        if (existing && this.now() >= existing.expiresAt) {
          await tx.draftBattle.update({ where: { id: battle.id }, data: { status: 'expired', outcome: 'no_winner' } });
          throw new DatabaseDomainError('INVALID_STATE', 'This Draft Battle invite has expired');
        }
        const user = await tx.user.findUnique({ where: { id: parsed.userId }, select: { id: true } });
        if (!user) throw new DatabaseDomainError('NOT_FOUND', 'User not found');
        const now = this.now();
        const deadline = battle.timerSeconds === null
          ? null
          : new Date(now.getTime() + battle.timerSeconds * 1000);
        const claimed = await tx.draftBattle.updateMany({
          where: { id: battle.id, status: 'awaiting_opponent', opponentId: null },
          data: { opponentId: user.id, status: 'awaiting_submissions', submissionDeadlineAt: deadline },
        });
        if (claimed.count !== 1) throw new DatabaseDomainError('CONFLICT', 'This Draft Battle invite is already claimed');
        await tx.draftBattlePlayer.create({ data: { battleId: battle.id, userId: user.id, role: 'opponent' } });
        return battle.id;
      }, { isolationLevel: 'Serializable' }),
      'This Draft Battle invite is already claimed',
    );
    return this.getBattleState({ userId: parsed.userId, battleId });
  }

  async getBattleState(input: unknown): Promise<DraftBattleStatePayload> {
    const parsed = parseInput(() => getDraftBattleStateSchema.parse(input));
    const battle = await this.loadBattle(parsed.battleId, parsed.userId);
    if (isUnfinished(battle.status)
      && (this.now() >= battle.expiresAt
        || (battle.submissionDeadlineAt !== null && this.now() >= battle.submissionDeadlineAt))) {
      await this.syncBattle(battle.id);
    }
    return this.buildState(await this.loadBattle(parsed.battleId, parsed.userId), parsed.userId);
  }

  async submit(input: unknown): Promise<DraftBattleStatePayload> {
    const parsed = parseInput(() => submitDraftBattleSchema.parse(input));
    await withSerializableRetry(
      () => this.prisma.$transaction(async (tx) => {
        let battle = await this.loadBattleTx(tx, parsed.battleId, parsed.userId);
        battle = await this.syncBattleTx(tx, battle);
        if (battle.status !== 'awaiting_submissions') throw new DatabaseDomainError('CONFLICT', 'Draft Battle is already settled');
        if (battle.submissionDeadlineAt && this.now() >= battle.submissionDeadlineAt) {
          throw new DatabaseDomainError('CONFLICT', 'Draft Battle deadline has passed');
        }
        const config = getDraftFormatConfig(battle.format as DraftFormat);
        if (parsed.slots.length !== config.picks) throw new DatabaseDomainError('INVALID_INPUT', `Choose exactly ${config.picks} companies`);
        const scenarioIds = parseIds(battle.scenarioIds, config.poolSize, 'Battle');
        const selectedIds = parsed.slots.map((slot) => scenarioIds[slot]);
        if (selectedIds.some((id) => !id)) throw new DatabaseDomainError('INVALID_INPUT', 'A selected card is outside this battle');
        const snapshot = parseDraftSnapshot(battle.scenarioSnapshot, config.poolSize);
        const result = computeDraftResult(
          snapshot.map((scenario): DraftPoolEntry => ({ scenarioId: scenario.scenarioId, actualReturnPercent: scenario.actualReturnPercent })),
          selectedIds,
          { allocations: parsed.allocations, format: battle.format as DraftFormat },
        );
        const player = battle.players.find((candidate) => candidate.userId === parsed.userId);
        if (!player) throw new DatabaseDomainError('FORBIDDEN', 'You are not part of this Draft Battle');
        if (player.submittedAt !== null) throw new DatabaseDomainError('CONFLICT', 'Your Draft Battle submission is already locked');
        await tx.draftBattlePlayer.update({
          where: { id: player.id },
          data: {
            selectedScenarioIds: result.selectedScenarioIds,
            allocations: result.selectedAllocations,
            finalValue: result.finalValue,
            gapFromOptimal: result.gapFromOptimal,
            submittedAt: this.now(),
          },
        });
        const refreshed = await this.reloadBattleTx(tx, battle.id);
        if (refreshed.players.every((candidate) => candidate.submittedAt !== null)) {
          await this.settleSubmitted(tx, refreshed);
        }
      }, { isolationLevel: 'Serializable' }),
      'Draft Battle submission was already locked',
    );
    return this.getBattleState({ userId: parsed.userId, battleId: parsed.battleId });
  }

  private async pickPool(tx: TransactionClient, format: DraftFormatValue, eraId?: string): Promise<string[]> {
    const config = getDraftFormatConfig(format);
    const candidates = await tx.scenario.findMany({
      where: { status: 'active', variants: { some: { difficulty: 'medium' } }, ...(format === 'era' ? { eraId } : {}) },
      select: { id: true, companyName: true, decisionDate: true, endDate: true },
    });
    const windows = findDraftWindows(candidates.map((candidate) => ({
      scenarioId: candidate.id,
      decisionDate: candidate.decisionDate.toISOString().slice(0, 10),
      endDate: candidate.endDate.toISOString().slice(0, 10),
    })), config.poolSize);
    for (const window of shuffled(windows, this.random)) {
      const result: string[] = [];
      const companies = new Set<string>();
      for (const id of shuffled(window.scenarioIds, this.random)) {
        const candidate = candidates.find((item) => item.id === id);
        if (!candidate || companies.has(candidate.companyName)) continue;
        companies.add(candidate.companyName);
        result.push(id);
        if (result.length === config.poolSize) return result;
      }
    }
    throw new DatabaseDomainError('INVALID_STATE', `Not enough compatible scenarios for a ${format} Draft Battle`);
  }

  private async loadByInvite(inviteCode: string): Promise<DraftBattleWithPlayers> {
    const battle = await this.prisma.draftBattle.findUnique({ where: { inviteCode }, include: PLAYER_INCLUDE });
    if (!battle) throw new DatabaseDomainError('NOT_FOUND', 'Draft Battle invite not found');
    return battle;
  }

  private async loadBattle(battleId: string, userId: string): Promise<DraftBattleWithPlayers> {
    const battle = await this.prisma.draftBattle.findUnique({ where: { id: battleId }, include: PLAYER_INCLUDE });
    if (!battle) throw new DatabaseDomainError('NOT_FOUND', 'Draft Battle not found');
    roleOf(battle, userId);
    return battle;
  }

  private async loadBattleTx(tx: TransactionClient, battleId: string, userId: string): Promise<DraftBattleWithPlayers> {
    const battle = await tx.draftBattle.findUnique({ where: { id: battleId }, include: PLAYER_INCLUDE });
    if (!battle) throw new DatabaseDomainError('NOT_FOUND', 'Draft Battle not found');
    roleOf(battle, userId);
    return battle;
  }

  private async reloadBattleTx(tx: TransactionClient, battleId: string): Promise<DraftBattleWithPlayers> {
    const battle = await tx.draftBattle.findUnique({ where: { id: battleId }, include: PLAYER_INCLUDE });
    if (!battle) throw new DatabaseDomainError('NOT_FOUND', 'Draft Battle not found');
    return battle;
  }

  private async syncBattle(battleId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        const battle = await tx.draftBattle.findUnique({ where: { id: battleId }, include: PLAYER_INCLUDE });
        if (battle) await this.syncBattleTx(tx, battle);
      }, { isolationLevel: 'Serializable' });
    } catch (error) {
      const code = prismaErrorCode(error);
      if (code !== 'P2034' && code !== 'P2002') throw error;
    }
  }

  private async syncBattleTx(tx: TransactionClient, battle: DraftBattleWithPlayers): Promise<DraftBattleWithPlayers> {
    const now = this.now();
    if (isUnfinished(battle.status) && now >= battle.expiresAt) {
      await tx.draftBattle.updateMany({
        where: { id: battle.id, status: { in: ['awaiting_opponent', 'awaiting_submissions'] } },
        data: { status: 'expired', outcome: 'no_winner', submissionDeadlineAt: null },
      });
      return this.reloadBattleTx(tx, battle.id);
    }
    if (battle.status === 'awaiting_submissions'
      && battle.submissionDeadlineAt !== null
      && now >= battle.submissionDeadlineAt) {
      const players = await tx.draftBattlePlayer.findMany({ where: { battleId: battle.id } });
      const submitted = players.filter((player) => player.submittedAt !== null);
      for (const player of players) {
        if (player.submittedAt === null) {
          await tx.draftBattlePlayer.update({ where: { id: player.id }, data: { forfeited: true } });
        }
      }
      const outcome = submitted.length === 1
        ? (players.find((player) => player.id === submitted[0].id)?.role === 'creator' ? 'creator_win' : 'opponent_win')
        : 'no_winner';
      await tx.draftBattle.update({ where: { id: battle.id }, data: { status: 'completed', outcome, completedAt: now, submissionDeadlineAt: null } });
      return this.reloadBattleTx(tx, battle.id);
    }
    return battle;
  }

  private async settleSubmitted(tx: TransactionClient, battle: DraftBattleWithPlayers): Promise<void> {
    const [creator, opponent] = [
      battle.players.find((player) => player.role === 'creator'),
      battle.players.find((player) => player.role === 'opponent'),
    ];
    if (!creator || !opponent || creator.finalValue === null || opponent.finalValue === null) {
      throw new DatabaseDomainError('INVALID_STATE', 'Draft Battle submissions are incomplete');
    }
    const left = number(creator.finalValue);
    const right = number(opponent.finalValue);
    const outcome = Math.abs(left - right) <= 1e-9
      ? 'draw'
      : left > right ? 'creator_win' : 'opponent_win';
    await tx.draftBattle.update({ where: { id: battle.id }, data: { status: 'completed', outcome, completedAt: this.now(), submissionDeadlineAt: null } });
  }

  private async buildCards(battle: DraftBattleWithPlayers): Promise<DraftCardPayload[]> {
    const config = getDraftFormatConfig(battle.format as DraftFormat);
    const ids = parseIds(battle.scenarioIds, config.poolSize, 'Battle');
    const snapshot = parseDraftSnapshot(battle.scenarioSnapshot, config.poolSize);
    return snapshot.map((scenario, slot) => {
      return {
        slot,
        title: scenario.title,
        decisionDateLabel: scenario.decisionDateLabel,
        holdingPeriodLabel: scenario.holdingPeriodLabel,
        companyDescription: scenario.companyDescription, macroContext: scenario.macroContext,
        situation: scenario.situation, longCase: scenario.longCase, shortCase: scenario.shortCase,
        setupHints: scenario.setupHints, lookbackChart: scenario.lookbackChart,
      };
    });
  }

  private async buildReveal(
    battle: DraftBattleWithPlayers,
    userId: string,
  ): Promise<DraftBattleStatePayload['reveal']> {
    if (battle.status !== 'completed') return null;
    const config = getDraftFormatConfig(battle.format as DraftFormat);
    const ids = parseIds(battle.scenarioIds, config.poolSize, 'Battle');
    const snapshot = parseDraftSnapshot(battle.scenarioSnapshot, config.poolSize);
    const byId = new Map(snapshot.map((scenario) => [scenario.scenarioId, scenario]));
    const creator = battle.players.find((player) => player.role === 'creator');
    const opponent = battle.players.find((player) => player.role === 'opponent') ?? null;
    if (!creator) throw new DatabaseDomainError('INVALID_STATE', 'Battle creator is missing');
    const creatorIds = creator.selectedScenarioIds === null ? [] : parseIds(creator.selectedScenarioIds, config.picks, 'Creator');
    const opponentIds = opponent?.selectedScenarioIds === null || !opponent ? [] : parseIds(opponent.selectedScenarioIds, config.picks, 'Opponent');
    const creatorAllocations = parseNumbers(creator.allocations, config.picks, 'Creator');
    const opponentAllocations = opponent ? parseNumbers(opponent.allocations, config.picks, 'Opponent') : null;
    const self = userId === creator.userId ? creator : opponent;
    const other = userId === creator.userId ? opponent : creator;
    if (!self) throw new DatabaseDomainError('FORBIDDEN', 'You are not part of this Draft Battle');
    const companies: DraftBattleRevealCompanyPayload[] = ids.map((id, slot) => {
      const scenario = byId.get(id);
      if (!scenario) throw new DatabaseDomainError('INVALID_STATE', 'Battle reveal scenario is missing');
      const creatorIndex = creatorIds.indexOf(id);
      const opponentIndex = opponentIds.indexOf(id);
      return {
        slot,
        title: scenario.title,
        companyName: scenario.companyName,
        ticker: scenario.ticker,
        actualReturnPercent: number(scenario.actualReturnPercent),
        youSelected: userId === creator.userId ? creatorIndex >= 0 : opponentIndex >= 0,
        opponentSelected: userId === creator.userId ? opponentIndex >= 0 : creatorIndex >= 0,
        youAllocationPercent: userId === creator.userId
          ? (creatorIndex >= 0 && creatorAllocations ? creatorAllocations[creatorIndex] : null)
          : (opponentIndex >= 0 && opponentAllocations ? opponentAllocations[opponentIndex] : null),
        opponentAllocationPercent: userId === creator.userId
          ? (opponentIndex >= 0 && opponentAllocations ? opponentAllocations[opponentIndex] : null)
          : (creatorIndex >= 0 && creatorAllocations ? creatorAllocations[creatorIndex] : null),
      };
    });
    return {
      companies,
      you: { finalValue: self.finalValue === null ? null : number(self.finalValue), gapFromOptimal: self.gapFromOptimal === null ? null : number(self.gapFromOptimal), forfeited: self.forfeited },
      opponent: other
        ? { finalValue: other.finalValue === null ? null : number(other.finalValue), gapFromOptimal: other.gapFromOptimal === null ? null : number(other.gapFromOptimal), forfeited: other.forfeited }
        : null,
    };
  }

  private async buildState(battle: DraftBattleWithPlayers, userId: string): Promise<DraftBattleStatePayload> {
    const you = battle.players.find((player) => player.userId === userId);
    if (!you) throw new DatabaseDomainError('FORBIDDEN', 'You are not part of this Draft Battle');
    const opponent = battle.players.find((player) => player.userId !== userId) ?? null;
    const config = getDraftFormatConfig(battle.format as DraftFormat);
    const ids = parseIds(battle.scenarioIds, config.poolSize, 'Battle');
    const selectedIds = you.selectedScenarioIds === null
      ? null
      : parseIds(you.selectedScenarioIds, config.picks, 'Your selection');
    const selectedSlots = selectedIds?.map((id) => ids.indexOf(id)) ?? null;
    const outcome = battle.status === 'expired'
      ? 'expired'
      : battle.status !== 'completed' || !battle.outcome
        ? null
        : battle.outcome === 'no_winner'
          ? 'no_winner'
          : (battle.outcome === 'draw' ? 'draw' : (battle.outcome === `${roleOf(battle, userId)}_win` ? 'you_won' : 'you_lost'));
    return {
      id: battle.id,
      status: battle.status,
      format: battle.format,
      eraId: battle.eraId,
      timerSeconds: (battle.timerSeconds ?? null) as DraftBattleStatePayload['timerSeconds'],
      budget: number(battle.budget),
      ...(battle.status === 'awaiting_opponent' && battle.creatorId === userId ? { inviteCode: battle.inviteCode } : {}),
      submissionDeadlineAt: battle.submissionDeadlineAt?.toISOString() ?? null,
      expiresAt: battle.expiresAt.toISOString(),
      serverNow: this.now().toISOString(),
      // The creator must not get an untimed preview before the opponent joins.
      // Both players receive the immutable cards only once the shared submission
      // phase (and its optional deadline) begins.
      cards: battle.status === 'awaiting_opponent' || battle.status === 'expired'
        ? null
        : await this.buildCards(battle),
      you: {
        name: publicName(you.user),
        hasSubmitted: you.submittedAt !== null,
        selectedSlots,
        allocations: parseNumbers(you.allocations, config.picks, 'Your'),
      },
      opponent: opponent
        ? { name: publicName(opponent.user), hasSubmitted: opponent.submittedAt !== null }
        : null,
      outcome,
      reveal: battle.status === 'completed' ? await this.buildReveal(battle, userId) : null,
    };
  }
}
