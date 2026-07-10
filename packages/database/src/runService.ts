import type {
  Prisma,
  PrismaClient,
  RoundDecision,
  Run,
} from '@prisma/client';
import {
  advanceRun,
  calculateLeaderboardTiebreakers,
  CLASSIC_RUN_ROUNDS,
  CONFIDENCE_CONFIG,
  createDailyChallengeRunState,
  createRunState,
  summarizeRun,
} from '@signal-or-noise/game-engine';
import type { CompletedRound, RunState } from '@signal-or-noise/game-engine';
import { ZodError } from 'zod';
import {
  createClassicRunSchema,
  createDailyChallengeRunSchema,
  createLeaderboardEntrySchema,
  getCurrentRunSchema,
  runOwnerSchema,
  scenarioOrderSchema,
  submitRoundDecisionSchema,
} from './contracts';
import type {
  CurrentRunPayload,
  RevealPayload,
  RunOwner,
  ScenarioOrderEntry,
} from './contracts';
import { DatabaseDomainError } from './errors';

type TransactionClient = Prisma.TransactionClient;

type RunWithDecisions = Run & {
  roundDecisions: RoundDecision[];
  guestSession: { clientSessionId: string } | null;
};

function parseInput<T>(parse: () => T): T {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new DatabaseDomainError(
        'INVALID_INPUT',
        error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
      );
    }
    throw error;
  }
}

function number(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function ownerWhere(owner: RunOwner): Prisma.RunWhereInput {
  return owner.kind === 'user'
    ? { userId: owner.userId }
    : { guestSession: { clientSessionId: owner.guestSessionId } };
}

async function resolveOwner(
  tx: TransactionClient,
  owner: RunOwner,
): Promise<{ userId: string | null; guestSessionId: string | null; isOfficial: boolean }> {
  if (owner.kind === 'user') {
    const user = await tx.user.findUnique({ where: { id: owner.userId }, select: { id: true } });
    if (!user) throw new DatabaseDomainError('NOT_FOUND', 'User not found');
    return { userId: user.id, guestSessionId: null, isOfficial: true };
  }

  const guest = await tx.guestSession.upsert({
    where: { clientSessionId: owner.guestSessionId },
    create: { clientSessionId: owner.guestSessionId },
    update: {},
    select: { id: true },
  });
  return { userId: null, guestSessionId: guest.id, isOfficial: false };
}

function assertRunOwner(run: RunWithDecisions, owner: RunOwner): void {
  const ownsRun = owner.kind === 'user'
    ? run.userId === owner.userId
    : run.guestSession?.clientSessionId === owner.guestSessionId;
  if (!ownsRun) throw new DatabaseDomainError('FORBIDDEN', 'Run does not belong to this owner');
}

function parseScenarioOrder(run: Run): ScenarioOrderEntry[] {
  const result = scenarioOrderSchema.safeParse(run.scenarioOrder);
  if (!result.success || result.data.length !== run.totalRounds) {
    throw new DatabaseDomainError('INVALID_STATE', 'Run scenario order is invalid');
  }
  return result.data;
}

function hydrateRunState(run: RunWithDecisions): RunState {
  if (run.status !== 'in_progress') {
    throw new DatabaseDomainError('INVALID_STATE', 'Only in-progress runs can accept decisions');
  }
  const rounds: CompletedRound[] = run.roundDecisions.map((round) => ({
    roundIndex: round.roundIndex,
    scenarioId: round.scenarioId,
    action: round.action,
    confidence: round.confidence,
    stakeAmount: number(round.stakeAmount),
    pnlAmount: number(round.pnlAmount),
    bankrollBefore: number(round.bankrollBefore),
    bankrollAfter: number(round.bankrollAfter),
    signalScoreDelta: number(round.signalScoreDelta),
    wasCorrect: round.wasCorrect,
    companyGuess: round.companyGuess,
    companyGuessCorrect: round.companyGuessCorrect,
  }));
  return {
    mode: run.mode,
    difficulty: run.difficulty,
    startingBankroll: number(run.startingBankroll),
    currentBankroll: number(run.currentBankroll),
    signalScore: number(run.signalScore),
    totalRounds: run.totalRounds,
    currentRoundIndex: run.currentRoundIndex,
    status: 'in_progress',
    rounds,
    currentStreak: run.currentStreak,
    bestStreak: run.bestStreak,
  };
}

function guessIsCorrect(
  guess: string | undefined,
  company: { companyName: string; ticker: string; acceptedNames: string[] },
): boolean | null {
  if (!guess) return null;
  const accepted = [company.companyName, company.ticker, ...company.acceptedNames]
    .map(normalizeCompanyGuess);
  return accepted.includes(normalizeCompanyGuess(guess));
}

function normalizeCompanyGuess(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function completionTimeMs(startedAt: Date, completedAt: Date): number {
  return Math.min(2_147_483_647, Math.max(0, completedAt.getTime() - startedAt.getTime()));
}

async function updatePlayerStats(tx: TransactionClient, userId: string): Promise<void> {
  const [runAggregates, totals] = await Promise.all([
    tx.run.aggregate({
      where: { userId, status: { in: ['completed', 'bankrupt'] } },
      _count: { _all: true },
      _sum: {
        completedRounds: true,
        correctCalls: true,
        wrongCalls: true,
        passes: true,
        signalScore: true,
      },
      _max: { finalBankroll: true, bestStreak: true },
      _avg: { finalBankroll: true },
    }),
    tx.run.count({ where: { userId } }),
  ]);

  await tx.playerStats.upsert({
    where: { userId },
    create: {
      userId,
      totalRuns: totals,
      completedRuns: runAggregates._count._all,
      totalRounds: runAggregates._sum.completedRounds ?? 0,
      correctCalls: runAggregates._sum.correctCalls ?? 0,
      wrongCalls: runAggregates._sum.wrongCalls ?? 0,
      passes: runAggregates._sum.passes ?? 0,
      totalSignalScore: runAggregates._sum.signalScore ?? 0,
      bestRunBankroll: runAggregates._max.finalBankroll,
      averageFinalBankroll: runAggregates._avg.finalBankroll,
      bestStreak: runAggregates._max.bestStreak ?? 0,
      currentStreak: 0,
    },
    update: {
      totalRuns: totals,
      completedRuns: runAggregates._count._all,
      totalRounds: runAggregates._sum.completedRounds ?? 0,
      correctCalls: runAggregates._sum.correctCalls ?? 0,
      wrongCalls: runAggregates._sum.wrongCalls ?? 0,
      passes: runAggregates._sum.passes ?? 0,
      totalSignalScore: runAggregates._sum.signalScore ?? 0,
      bestRunBankroll: runAggregates._max.finalBankroll,
      averageFinalBankroll: runAggregates._avg.finalBankroll,
      bestStreak: runAggregates._max.bestStreak ?? 0,
      currentStreak: 0,
    },
  });
}

export class RunService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly random: () => number = Math.random,
  ) {}

  async createClassicRun(input: unknown): Promise<CurrentRunPayload> {
    const parsed = parseInput(() => createClassicRunSchema.parse(input));
    const runId = await this.prisma.$transaction(async (tx) => {
      const owner = await resolveOwner(tx, parsed.owner);
      const scenarioCount = CLASSIC_RUN_ROUNDS[parsed.difficulty];
      const candidates = await tx.scenario.findMany({
        where: { status: 'active' },
        select: { id: true },
      });
      if (candidates.length < scenarioCount) {
        throw new DatabaseDomainError('INVALID_STATE', 'Not enough active scenarios for this run');
      }
      const scenarioOrder = shuffled(candidates, this.random)
        .slice(0, scenarioCount)
        .map(({ id }) => ({ scenarioId: id, difficulty: parsed.difficulty }));
      const state = createRunState({ difficulty: parsed.difficulty });
      const run = await tx.run.create({
        data: {
          ...owner,
          mode: 'classic_run',
          difficulty: parsed.difficulty,
          status: state.status,
          scenarioOrder,
          startingBankroll: state.startingBankroll,
          currentBankroll: state.currentBankroll,
          signalScore: state.signalScore,
          totalRounds: state.totalRounds,
        },
        select: { id: true },
      });
      return run.id;
    }, { isolationLevel: 'Serializable' });

    return this.getInProgressRunById(runId, parsed.owner);
  }

  async createDailyChallengeRun(input: unknown): Promise<CurrentRunPayload> {
    const parsed = parseInput(() => createDailyChallengeRunSchema.parse(input));
    try {
      const runId = await this.prisma.$transaction(async (tx) => {
        const owner = await resolveOwner(tx, parsed.owner);
        const challenge = await tx.dailyChallenge.findUnique({
          where: { id: parsed.dailyChallengeId },
          include: { pool: { include: { entries: { orderBy: { ordinal: 'asc' } } } } },
        });
        if (!challenge) throw new DatabaseDomainError('NOT_FOUND', 'Daily Challenge not found');
        if (parsed.owner.kind === 'user') {
          const existing = await tx.run.findFirst({
            where: { dailyChallengeId: challenge.id, userId: parsed.owner.userId },
            select: { id: true },
          });
          if (existing) {
            throw new DatabaseDomainError('CONFLICT', 'Official Daily Challenge attempt already exists');
          }
        }
        const state = createDailyChallengeRunState({
          startingBankroll: number(challenge.startingBankroll),
          totalRounds: challenge.pool.entries.length,
        });
        const run = await tx.run.create({
          data: {
            ...owner,
            dailyChallengeId: challenge.id,
            mode: 'daily_challenge',
            difficulty: null,
            status: state.status,
            scenarioOrder: challenge.pool.entries.map((entry) => ({
              scenarioId: entry.scenarioId,
              difficulty: entry.difficulty,
            })),
            startingBankroll: state.startingBankroll,
            currentBankroll: state.currentBankroll,
            signalScore: state.signalScore,
            totalRounds: state.totalRounds,
          },
          select: { id: true },
        });
        return run.id;
      }, { isolationLevel: 'Serializable' });
      return this.getInProgressRunById(runId, parsed.owner);
    } catch (error) {
      if (
        typeof error === 'object' && error !== null &&
        'code' in error && error.code === 'P2002'
      ) {
        throw new DatabaseDomainError('CONFLICT', 'Official Daily Challenge attempt already exists');
      }
      throw error;
    }
  }

  async getCurrentRun(input: unknown): Promise<CurrentRunPayload | null> {
    const parsed = parseInput(() => getCurrentRunSchema.parse(input));
    const run = await this.prisma.run.findFirst({
      where: { ...ownerWhere(parsed.owner), status: 'in_progress' },
      orderBy: { startedAt: 'desc' },
      select: { id: true },
    });
    return run ? this.getInProgressRunById(run.id, parsed.owner) : null;
  }

  private async getInProgressRunById(runId: string, owner: RunOwner): Promise<CurrentRunPayload> {
    const run = await this.prisma.run.findFirst({
      where: { id: runId, ...ownerWhere(owner), status: 'in_progress' },
    });
    if (!run) throw new DatabaseDomainError('NOT_FOUND', 'Current run not found');
    const scenarioOrder = parseScenarioOrder(run);
    const entry = scenarioOrder[run.currentRoundIndex];
    if (!entry) throw new DatabaseDomainError('INVALID_STATE', 'Current round is missing');
    const scenario = await this.prisma.scenario.findUnique({
      where: { id: entry.scenarioId },
      select: {
        id: true,
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
      id: run.id,
      mode: run.mode,
      difficulty: run.difficulty,
      status: 'in_progress',
      isOfficial: run.isOfficial,
      startingBankroll: number(run.startingBankroll),
      currentBankroll: number(run.currentBankroll),
      signalScore: number(run.signalScore),
      totalRounds: run.totalRounds,
      completedRounds: run.completedRounds,
      currentRoundIndex: run.currentRoundIndex,
      currentStreak: run.currentStreak,
      bestStreak: run.bestStreak,
      round: {
        roundIndex: run.currentRoundIndex,
        difficulty: entry.difficulty,
        title: scenario.title,
        decisionDateLabel: scenario.decisionDateLabel,
        holdingPeriodLabel: scenario.holdingPeriodLabel,
        ...variant,
        lookbackChart: scenario.marketPoints.map((point) => ({
          date: point.pointDate.toISOString().slice(0, 10),
          price: number(point.price),
        })),
      },
    };
  }

  async submitRoundDecision(input: unknown): Promise<{
    run: {
      id: string;
      status: 'in_progress' | 'completed' | 'bankrupt';
      currentBankroll: number;
      signalScore: number;
      completedRounds: number;
      totalRounds: number;
      currentStreak: number;
      bestStreak: number;
    };
    round: CompletedRound;
    reveal: RevealPayload;
  }> {
    const parsed = parseInput(() => submitRoundDecisionSchema.parse(input));
    return this.prisma.$transaction(async (tx) => {
      const run = await tx.run.findUnique({
        where: { id: parsed.runId },
        include: {
          roundDecisions: { orderBy: { roundIndex: 'asc' } },
          guestSession: { select: { clientSessionId: true } },
        },
      });
      if (!run) throw new DatabaseDomainError('NOT_FOUND', 'Run not found');
      assertRunOwner(run, parsed.owner);
      if (run.status !== 'in_progress') {
        throw new DatabaseDomainError('INVALID_STATE', 'Run is already finished');
      }
      if (parsed.roundIndex !== run.currentRoundIndex) {
        throw new DatabaseDomainError('CONFLICT', 'Round was already submitted or is not current');
      }
      const scenarioOrder = parseScenarioOrder(run);
      const entry = scenarioOrder[run.currentRoundIndex];
      if (!entry) throw new DatabaseDomainError('INVALID_STATE', 'Current scenario is missing');
      const scenario = await tx.scenario.findUnique({
        where: { id: entry.scenarioId },
        select: {
          id: true,
          companyName: true,
          ticker: true,
          acceptedNames: true,
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
      if (!scenario) throw new DatabaseDomainError('INVALID_STATE', 'Current scenario is missing');

      const companyGuessCorrect = guessIsCorrect(parsed.companyGuess, scenario);
      const advanced = advanceRun(hydrateRunState(run), {
        scenarioId: scenario.id,
        action: parsed.action,
        confidence: parsed.confidence,
        actualReturnPercent: number(scenario.actualReturnPercent),
        companyGuess: parsed.companyGuess ?? null,
        companyGuessCorrect,
      });
      const summary = summarizeRun(advanced.run);
      const now = new Date();
      const terminal = advanced.run.status !== 'in_progress';
      const completedMs = terminal ? completionTimeMs(run.startedAt, now) : null;
      const confidencePercent = parsed.confidence
        ? CONFIDENCE_CONFIG[parsed.confidence].bankrollPercent
        : null;

      await tx.roundDecision.create({
        data: {
          runId: run.id,
          userId: run.userId,
          scenarioId: scenario.id,
          roundIndex: advanced.round.roundIndex,
          action: advanced.round.action,
          confidence: advanced.round.confidence,
          companyGuess: advanced.round.companyGuess,
          companyGuessCorrect: advanced.round.companyGuessCorrect,
          confidencePercent,
          stakeAmount: advanced.round.stakeAmount,
          bankrollBefore: advanced.round.bankrollBefore,
          bankrollAfter: advanced.round.bankrollAfter,
          actualReturnPercent: scenario.actualReturnPercent,
          pnlAmount: advanced.round.pnlAmount,
          signalScoreDelta: advanced.round.signalScoreDelta,
          wasCorrect: advanced.round.wasCorrect,
        },
      });
      await tx.run.update({
        where: { id: run.id },
        data: {
          status: advanced.run.status,
          currentRoundIndex: advanced.run.currentRoundIndex,
          completedRounds: advanced.run.rounds.length,
          currentBankroll: advanced.run.currentBankroll,
          finalBankroll: terminal ? advanced.run.currentBankroll : null,
          signalScore: advanced.run.signalScore,
          correctCalls: summary.correctCalls,
          wrongCalls: summary.wrongCalls,
          passes: summary.passes,
          currentStreak: advanced.run.currentStreak,
          bestStreak: advanced.run.bestStreak,
          completedAt: terminal ? now : null,
          completionTimeMs: completedMs,
        },
      });
      if (terminal && run.userId) await updatePlayerStats(tx, run.userId);

      return {
        run: {
          id: run.id,
          status: advanced.run.status,
          currentBankroll: advanced.run.currentBankroll,
          signalScore: advanced.run.signalScore,
          completedRounds: advanced.run.rounds.length,
          totalRounds: advanced.run.totalRounds,
          currentStreak: advanced.run.currentStreak,
          bestStreak: advanced.run.bestStreak,
        },
        round: advanced.round,
        reveal: {
          scenarioId: scenario.id,
          companyName: scenario.companyName,
          ticker: scenario.ticker,
          endingPrice: number(scenario.endingPrice),
          actualReturnPercent: number(scenario.actualReturnPercent),
          shortText: scenario.revealShortText,
          funFact: scenario.revealFunFact,
          whyItMoved: scenario.revealWhyItMoved,
          outcomeChart: scenario.marketPoints.map((point) => ({
            date: point.pointDate.toISOString().slice(0, 10),
            price: number(point.price),
          })),
        },
      };
    }, { isolationLevel: 'Serializable', timeout: 30_000 });
  }

  async createLeaderboardEntryForRun(input: unknown) {
    const parsed = parseInput(() => createLeaderboardEntrySchema.parse(input));
    if (parsed.owner.kind !== 'user') {
      throw new DatabaseDomainError('FORBIDDEN', 'Guest runs are unofficial');
    }
    const run = await this.prisma.run.findFirst({
      where: { id: parsed.runId, userId: parsed.owner.userId },
    });
    if (!run) throw new DatabaseDomainError('NOT_FOUND', 'Run not found');
    if (!run.isOfficial || !run.completedAt || run.finalBankroll === null) {
      throw new DatabaseDomainError('INVALID_STATE', 'Only completed authenticated runs are eligible');
    }
    const completionMs = run.completionTimeMs ?? completionTimeMs(run.startedAt, run.completedAt);
    const tiebreakers = calculateLeaderboardTiebreakers({
      finalBankroll: number(run.finalBankroll),
      signalScore: number(run.signalScore),
      correctCalls: run.correctCalls,
      passes: run.passes,
      completionTimeMs: completionMs,
    });
    return this.prisma.leaderboardEntry.create({
      data: {
        userId: parsed.owner.userId,
        runId: run.id,
        leaderboardType: parsed.leaderboardType,
        periodKey: parsed.periodKey,
        scoreBankroll: tiebreakers.finalBankroll,
        scoreSignal: tiebreakers.signalScore,
        correctCalls: tiebreakers.correctCalls,
        passes: run.passes,
        completionTimeMs: completionMs,
        completedAt: run.completedAt,
        metadata: { sortKey: [...tiebreakers.sortKey] },
      },
    });
  }
}

export function parseRunOwner(input: unknown): RunOwner {
  return parseInput(() => runOwnerSchema.parse(input));
}
