import type {
  Prisma,
  PrismaClient,
  RoundDecision,
  Run,
} from '@prisma/client';
import {
  advanceRun,
  CLASSIC_RUN_ROUNDS,
  CONFIDENCE_CONFIG,
  createDailyChallengeRunState,
  createRunState,
  summarizeRun,
} from '@signal-or-noise/game-engine';
import type { CompletedRound, RunState } from '@signal-or-noise/game-engine';
import { ZodError } from 'zod';
import {
  claimCompletedGuestRunSchema,
  createClassicRunSchema,
  createDailyChallengeRunSchema,
  getCurrentRunSchema,
  getRunSummarySchema,
  runOwnerSchema,
  scenarioOrderSchema,
  submitRoundDecisionSchema,
} from './contracts';
import type {
  CurrentRunPayload,
  RevealPayload,
  RunOwner,
  RunSummaryPayload,
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

function parseDailyScenarioOrder(value: unknown): ScenarioOrderEntry[] {
  const result = scenarioOrderSchema.safeParse(value);
  if (!result.success || result.data.length !== 10) {
    throw new DatabaseDomainError('INVALID_STATE', 'Daily Challenge snapshot is invalid');
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

type RunWithSummaryDecisions = Run & {
  roundDecisions: Array<RoundDecision & { scenario: { companyName: string } }>;
  guestSession: { clientSessionId: string } | null;
};

function buildRunSummaryPayload(run: RunWithSummaryDecisions): RunSummaryPayload {
  if (run.status !== 'completed' && run.status !== 'bankrupt') {
    throw new DatabaseDomainError('INVALID_STATE', 'Run is not finished');
  }
  let companiesCalled = 0;
  let bestTrade: RunSummaryPayload['bestTrade'] = null;
  let worstTrade: RunSummaryPayload['worstTrade'] = null;
  for (const decision of run.roundDecisions) {
    if (decision.companyGuessCorrect === true) companiesCalled += 1;
    if (number(decision.stakeAmount) > 0) {
      const trade = {
        companyName: decision.scenario.companyName,
        pnlAmount: number(decision.pnlAmount),
      };
      if (!bestTrade || trade.pnlAmount > bestTrade.pnlAmount) bestTrade = trade;
      if (!worstTrade || trade.pnlAmount < worstTrade.pnlAmount) worstTrade = trade;
    }
  }
  return {
    id: run.id,
    mode: run.mode,
    difficulty: run.difficulty,
    status: run.status,
    isOfficial: run.isOfficial,
    claimed: run.claimedAt !== null,
    claimable:
      run.mode === 'classic_run' &&
      (run.status === 'completed' || run.status === 'bankrupt') &&
      run.userId === null &&
      run.claimedAt === null,
    startingBankroll: number(run.startingBankroll),
    finalBankroll: number(run.finalBankroll ?? run.currentBankroll),
    signalScore: number(run.signalScore),
    totalRounds: run.totalRounds,
    completedRounds: run.completedRounds,
    correctCalls: run.correctCalls,
    wrongCalls: run.wrongCalls,
    passes: run.passes,
    companiesCalled,
    bestStreak: run.bestStreak,
    completionTimeMs: run.completionTimeMs,
    bestTrade,
    worstTrade,
  };
}

async function updatePlayerStats(tx: TransactionClient, userId: string): Promise<void> {
  const [runAggregates, totals] = await Promise.all([
    tx.run.aggregate({
      where: { userId, isOfficial: true, status: { in: ['completed', 'bankrupt'] } },
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
      // Starting a new Classic Run is an explicit choice; any prior unfinished
      // Classic Run for the same owner becomes abandoned rather than lingering.
      await tx.run.updateMany({
        where: {
          ...(owner.userId !== null
            ? { userId: owner.userId }
            : { guestSessionId: owner.guestSessionId }),
          mode: 'classic_run',
          status: 'in_progress',
        },
        data: { status: 'abandoned' },
      });
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

  /**
   * Daily Challenge play is login-gated (D048): guests are rejected here even if
   * a web boundary bug lets a guest request through. Authenticated users may
   * create unlimited terminal attempts (D049). A player has at most one
   * resumable Daily attempt across date rollover, so no in-progress result is
   * stranded when the UTC schedule advances.
   */
  async createDailyChallengeRun(input: unknown): Promise<CurrentRunPayload> {
    const parsed = parseInput(() => createDailyChallengeRunSchema.parse(input));
    if (parsed.owner.kind !== 'user') {
      throw new DatabaseDomainError('FORBIDDEN', 'Daily Challenge requires a signed-in account');
    }
    const existing = await this.getCurrentRun({ owner: parsed.owner, mode: 'daily_challenge' });
    if (existing) return existing;

    for (let retry = 0; retry < 3; retry += 1) {
      try {
        const runId = await this.prisma.$transaction(async (tx) => {
          const owner = await resolveOwner(tx, parsed.owner);
          const active = await tx.run.findFirst({
            where: {
              userId: owner.userId,
              mode: 'daily_challenge',
              status: 'in_progress',
            },
            orderBy: { startedAt: 'desc' },
            select: { id: true },
          });
          if (active) return active.id;
          const challenge = await tx.dailyChallenge.findUnique({
            where: { id: parsed.dailyChallengeId },
            select: {
              id: true,
              startingBankroll: true,
              scenarioOrder: true,
            },
          });
          if (!challenge) throw new DatabaseDomainError('NOT_FOUND', 'Daily Challenge not found');
          const scenarioOrder = parseDailyScenarioOrder(challenge.scenarioOrder);
          const state = createDailyChallengeRunState({
            startingBankroll: number(challenge.startingBankroll),
            totalRounds: scenarioOrder.length,
          });
          const run = await tx.run.create({
            data: {
              ...owner,
              dailyChallengeId: challenge.id,
              mode: 'daily_challenge',
              difficulty: null,
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
      } catch (error) {
        // The partial unique index covers same-date taps; Serializable isolation
        // makes a cross-midnight create race settle on one resumable attempt.
        const code = typeof error === 'object' && error !== null && 'code' in error
          ? error.code
          : null;
        if (code !== 'P2002' && code !== 'P2034') throw error;
        const concurrent = await this.getCurrentRun({ owner: parsed.owner, mode: 'daily_challenge' });
        if (concurrent) return concurrent;
        if (retry === 2) {
          throw new DatabaseDomainError('CONFLICT', 'Daily attempt creation conflicted — try again');
        }
      }
    }
    throw new DatabaseDomainError('CONFLICT', 'Daily attempt creation conflicted — try again');
  }

  async getCurrentRun(input: unknown): Promise<CurrentRunPayload | null> {
    const parsed = parseInput(() => getCurrentRunSchema.parse(input));
    const run = await this.prisma.run.findFirst({
      where: {
        ...ownerWhere(parsed.owner),
        status: 'in_progress',
        ...(parsed.mode ? { mode: parsed.mode } : {}),
        ...(parsed.dailyChallengeId ? { dailyChallengeId: parsed.dailyChallengeId } : {}),
      },
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
          outcomeLabel: true,
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
        },
      };
    }, { isolationLevel: 'Serializable', timeout: 30_000 });
  }

  /**
   * Owner-checked summary of a finished run. Reveal-level fields (company names)
   * are allowed here because every round decision has already been committed.
   */
  async getRunSummary(input: unknown): Promise<RunSummaryPayload> {
    const parsed = parseInput(() => getRunSummarySchema.parse(input));
    const run = await this.prisma.run.findUnique({
      where: { id: parsed.runId },
      include: {
        guestSession: { select: { clientSessionId: true } },
        roundDecisions: {
          orderBy: { roundIndex: 'asc' },
          include: { scenario: { select: { companyName: true } } },
        },
      },
    });
    if (!run) throw new DatabaseDomainError('NOT_FOUND', 'Run not found');
    assertRunOwner(run, parsed.owner);
    if (run.status !== 'completed' && run.status !== 'bankrupt') {
      throw new DatabaseDomainError('INVALID_STATE', 'Run is not finished');
    }
    return buildRunSummaryPayload(run);
  }

  /**
   * One-time explicit claim of a completed guest Classic Run (D047). Both the
   * internal user ID and the guest session ID must be derived server-side (the
   * verified Clerk session and the httpOnly guest cookie); request data never
   * supplies either. The guarded updateMany makes double/concurrent claims fail
   * safely even before Serializable isolation is considered.
   */
  async claimCompletedGuestRun(input: unknown): Promise<RunSummaryPayload> {
    const parsed = parseInput(() => claimCompletedGuestRunSchema.parse(input));
    // Serializable claims that race each other abort with P2034. Retry a few
    // times so the guarded checks settle the truth: exactly one claim wins and
    // every other attempt sees a clean, retry-safe CONFLICT.
    for (let attempt = 0; ; attempt += 1) {
      try {
        return await this.claimCompletedGuestRunOnce(parsed);
      } catch (error) {
        const conflictCode =
          typeof error === 'object' && error !== null && 'code' in error
            ? error.code
            : null;
        if (conflictCode === 'P2034' && attempt < 2) continue;
        if (conflictCode === 'P2034' || conflictCode === 'P2002') {
          throw new DatabaseDomainError('CONFLICT', 'Run claim conflicted — try again');
        }
        throw error;
      }
    }
  }

  private async claimCompletedGuestRunOnce(parsed: {
    userId: string;
    guestSessionId: string;
    runId: string;
  }): Promise<RunSummaryPayload> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: parsed.userId },
        select: { id: true },
      });
      if (!user) throw new DatabaseDomainError('NOT_FOUND', 'User not found');
      const run = await tx.run.findUnique({
        where: { id: parsed.runId },
        include: { guestSession: { select: { clientSessionId: true } } },
      });
      if (!run) throw new DatabaseDomainError('NOT_FOUND', 'Run not found');
      // Claimed runs drop their guest link (the schema enforces exactly one
      // owner), so report "already claimed" before the ownership check to keep
      // duplicate claims from the original device retry-safe and truthful.
      if (run.claimedAt !== null) {
        throw new DatabaseDomainError('CONFLICT', 'Run was already claimed');
      }
      if (
        run.guestSessionId === null ||
        run.guestSession?.clientSessionId !== parsed.guestSessionId
      ) {
        throw new DatabaseDomainError('FORBIDDEN', 'Run does not belong to this guest session');
      }
      if (run.userId !== null) {
        throw new DatabaseDomainError('CONFLICT', 'Run was already claimed');
      }
      if (run.mode !== 'classic_run') {
        throw new DatabaseDomainError('INVALID_STATE', 'Only Classic Runs can be claimed');
      }
      if (run.status !== 'completed' && run.status !== 'bankrupt') {
        throw new DatabaseDomainError('INVALID_STATE', 'Only finished runs can be claimed');
      }

      const claimed = await tx.run.updateMany({
        where: {
          id: run.id,
          userId: null,
          claimedAt: null,
          mode: 'classic_run',
          status: { in: ['completed', 'bankrupt'] },
          guestSessionId: run.guestSessionId,
        },
        // The run transfers fully to the account: the exactly-one-owner schema
        // constraint requires dropping the guest link when userId is set.
        data: {
          userId: user.id,
          guestSessionId: null,
          isOfficial: true,
          claimedAt: new Date(),
        },
      });
      if (claimed.count !== 1) {
        throw new DatabaseDomainError('CONFLICT', 'Run was already claimed');
      }
      await tx.roundDecision.updateMany({
        where: { runId: run.id },
        data: { userId: user.id },
      });
      await updatePlayerStats(tx, user.id);

      const saved = await tx.run.findUniqueOrThrow({
        where: { id: run.id },
        include: {
          guestSession: { select: { clientSessionId: true } },
          roundDecisions: {
            orderBy: { roundIndex: 'asc' },
            include: { scenario: { select: { companyName: true } } },
          },
        },
      });
      return buildRunSummaryPayload(saved);
    }, { isolationLevel: 'Serializable' });
  }

}

export function parseRunOwner(input: unknown): RunOwner {
  return parseInput(() => runOwnerSchema.parse(input));
}
