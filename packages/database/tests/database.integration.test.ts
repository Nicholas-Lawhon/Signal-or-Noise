import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Scenario } from '@signal-or-noise/content';
import { createDatabaseClient } from '../src/client';
import {
  getDefaultContentImportSource,
  importProductionContent,
} from '../src/contentImport';
import { DatabaseDomainError } from '../src/errors';
import { loadDatabaseEnvironment } from '../src/environment';
import {
  ensureUserForExternalAuth,
  getPlayerStats,
  getPublicIdentity,
  updatePublicIdentity,
} from '../src/identityService';
import { materializeDailyChallengeForDate } from '../src/dailyChallengeService';
import { LeaderboardService } from '../src/leaderboardService';
import { RunService } from '../src/runService';
import { scenarioOrderSchema } from '../src/contracts';

loadDatabaseEnvironment();

const databaseAvailable = Boolean(process.env.DATABASE_URL && process.env.DIRECT_URL);
const describeDatabase = databaseAvailable ? describe : describe.skip;

describeDatabase('PostgreSQL persistence integration', () => {
  const prisma = createDatabaseClient();
  const service = new RunService(prisma, () => 0.42);
  const leaderboards = new LeaderboardService(prisma);
  const suiteId = randomUUID();
  const guestIds = {
    reveal: randomUUID(),
    bankrupt: randomUUID(),
    stranger: randomUUID(),
    claimant: randomUUID(),
  };
  const userId = `phase5_test_user_${suiteId}`;
  const claimUserId = `phase6_claim_user_${suiteId}`;
  const rivalUserId = `phase6_rival_user_${suiteId}`;
  const leaderboardUserA = `phase7_leaderboard_a_${suiteId}`;
  const leaderboardUserB = `phase7_leaderboard_b_${suiteId}`;
  const leaderboardUserC = `phase7_leaderboard_c_${suiteId}`;
  const leaderboardAliasA = `Player-${suiteId.slice(14, 18).toUpperCase()}`;
  const leaderboardAliasB = `Player-${suiteId.slice(19, 23).toUpperCase()}`;
  const leaderboardAliasC = `Player-${suiteId.slice(24, 28).toUpperCase()}`;
  const challengeId = `phase5_test_challenge_${suiteId}`;
  const challengeDate = new Date('2099-12-30T00:00:00.000Z');
  const scheduledChallengeDate = new Date('2099-12-29T00:00:00.000Z');
  let scheduledChallengeId = '';
  let authenticatedRunId = '';

  /** Completes every remaining round of an in-progress run with passes. */
  async function completeWithPasses(
    owner: { kind: 'guest'; guestSessionId: string } | { kind: 'user'; userId: string },
    runId: string,
    totalRounds: number,
    startIndex = 0,
  ) {
    let last: Awaited<ReturnType<RunService['submitRoundDecision']>> | null = null;
    for (let roundIndex = startIndex; roundIndex < totalRounds; roundIndex += 1) {
      last = await service.submitRoundDecision({ owner, runId, roundIndex, action: 'pass' });
    }
    return last;
  }

  async function createLeaderboardRun(input: {
    label: string;
    userId: string;
    mode: 'classic_run' | 'daily_challenge';
    difficulty?: 'easy' | 'medium' | 'hard';
    bankroll: number;
    signalScore: number;
    correctCalls: number;
    passes: number;
    completionTimeMs: number;
    isOfficial?: boolean;
    dailyChallengeId?: string;
  }) {
    const completedAt = new Date('2099-12-30T12:00:00.000Z');
    return prisma.run.create({
      data: {
        id: `phase7_${input.label}_${suiteId}`,
        userId: input.userId,
        dailyChallengeId: input.dailyChallengeId,
        mode: input.mode,
        difficulty: input.difficulty,
        status: 'completed',
        isOfficial: input.isOfficial ?? true,
        scenarioOrder: [],
        startingBankroll: 10000,
        finalBankroll: input.bankroll,
        currentBankroll: input.bankroll,
        signalScore: input.signalScore,
        totalRounds: 10,
        completedRounds: 10,
        currentRoundIndex: 10,
        correctCalls: input.correctCalls,
        wrongCalls: Math.max(0, 10 - input.correctCalls - input.passes),
        passes: input.passes,
        startedAt: new Date(completedAt.getTime() - input.completionTimeMs),
        completedAt,
        completionTimeMs: input.completionTimeMs,
      },
    });
  }

  beforeAll(async () => {
    await importProductionContent(prisma);
    // A killed test process cannot run afterAll. Clear only fixtures on the
    // reserved integration-test date so the next run remains crash-resilient.
    const staleChallenges = await prisma.dailyChallenge.findMany({
      where: {
        challengeDate,
        id: { startsWith: 'phase5_test_challenge_' },
      },
      select: { id: true },
    });
    if (staleChallenges.length > 0) {
      const staleIds = staleChallenges.map(({ id }) => id);
      await prisma.run.deleteMany({ where: { dailyChallengeId: { in: staleIds } } });
      await prisma.dailyChallenge.deleteMany({ where: { id: { in: staleIds } } });
    }
    await prisma.user.create({
      data: {
        id: userId,
        displayName: 'Phase 5 Test Player',
        publicAlias: `Player-${suiteId.slice(0, 4).toUpperCase()}`,
        profile: { create: { displayName: 'Phase 5 Test Player' } },
      },
    });
    await prisma.user.create({
      data: {
        id: claimUserId,
        displayName: 'Phase 6 Claimant',
        publicAlias: `Player-${suiteId.slice(4, 8).toUpperCase()}`,
      },
    });
    await prisma.user.createMany({
      data: [
        {
          id: leaderboardUserA,
          displayName: 'PRIVATE Leaderboard A',
          publicAlias: leaderboardAliasA,
        },
        {
          id: leaderboardUserB,
          displayName: 'PRIVATE Leaderboard B',
          publicAlias: leaderboardAliasB,
        },
        {
          id: leaderboardUserC,
          displayName: 'PRIVATE Leaderboard C',
          publicAlias: leaderboardAliasC,
        },
      ],
    });
    await prisma.user.create({
      data: {
        id: rivalUserId,
        displayName: 'Phase 6 Rival',
        publicAlias: `Player-${suiteId.slice(9, 13).toUpperCase()}`,
      },
    });
    const pool = await prisma.dailyChallengePool.findUniqueOrThrow({
      where: { id: 'daily_pool_001' },
      select: {
        entries: {
          orderBy: { ordinal: 'asc' },
          select: { scenarioId: true, difficulty: true },
        },
      },
    });
    await prisma.dailyChallenge.create({
      data: {
        id: challengeId,
        challengeDate,
        poolId: 'daily_pool_001',
        startingBankroll: 10000,
        scenarioOrder: pool.entries,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { externalAuthId: `clerk_test_${suiteId}` } });
    await prisma.user.deleteMany({
      where: {
        id: {
          in: [
            userId,
            claimUserId,
            rivalUserId,
            leaderboardUserA,
            leaderboardUserB,
            leaderboardUserC,
          ],
        },
      },
    });
    await prisma.guestSession.deleteMany({
      where: { clientSessionId: { in: Object.values(guestIds) } },
    });
    await prisma.run.deleteMany({ where: { dailyChallengeId: challengeId } });
    await prisma.dailyChallenge.deleteMany({ where: { id: challengeId } });
    if (scheduledChallengeId) {
      await prisma.run.deleteMany({ where: { dailyChallengeId: scheduledChallengeId } });
      await prisma.dailyChallenge.deleteMany({ where: { id: scheduledChallengeId } });
    }
    await prisma.$disconnect();
  });

  it('imports all content idempotently without duplicates', async () => {
    const first = await importProductionContent(prisma);
    const second = await importProductionContent(prisma);
    expect(second).toEqual(first);
    expect(second).toMatchObject({
      scenarios: 40,
      variants: 120,
      eras: 10,
      dailyChallengePools: 10,
      dailyChallengePoolEntries: 100,
    });
  });

  it('materializes one deterministic immutable UTC challenge under concurrent retries', async () => {
    const attempts = await Promise.all(
      Array.from({ length: 6 }, () => materializeDailyChallengeForDate(prisma, scheduledChallengeDate)),
    );
    expect(new Set(attempts.map((attempt) => attempt.id)).size).toBe(1);
    expect(attempts.every((attempt) => attempt.challengeDate.toISOString() === scheduledChallengeDate.toISOString()))
      .toBe(true);
    expect(attempts[0].scenarioOrder).toHaveLength(10);
    expect(new Set(attempts[0].scenarioOrder.map((entry) => entry.difficulty))).toEqual(
      new Set(['easy', 'medium', 'hard']),
    );
    scheduledChallengeId = attempts[0].id;

    const stored = await prisma.dailyChallenge.findUniqueOrThrow({
      where: { id: scheduledChallengeId },
      select: { scenarioOrder: true, startingBankroll: true },
    });
    expect(scenarioOrderSchema.parse(stored.scenarioOrder)).toEqual(attempts[0].scenarioOrder);
    expect(stored.startingBankroll.toNumber()).toBe(10000);
    await expect(materializeDailyChallengeForDate(prisma, scheduledChallengeDate))
      .resolves.toMatchObject({ id: scheduledChallengeId, scenarioOrder: attempts[0].scenarioOrder });
  });

  it('rejects invalid content before any database mutation', async () => {
    const before = await prisma.scenario.count();
    const source = getDefaultContentImportSource();
    const first = source.scenarios[0] as Scenario;
    const invalid: Scenario = {
      ...first,
      company: { ...first.company, name: '' },
    };
    await expect(importProductionContent(prisma, {
      ...source,
      scenarios: [invalid, ...source.scenarios.slice(1)],
    })).rejects.toThrow('Content import validation failed');
    expect(await prisma.scenario.count()).toBe(before);
  });

  it('keeps pre-decision payloads reveal-safe and releases reveal after persistence', async () => {
    const owner = { kind: 'guest' as const, guestSessionId: guestIds.reveal };
    const current = await service.createClassicRun({ owner, difficulty: 'easy' });
    expect(current.isOfficial).toBe(false);
    expect(current.round).not.toHaveProperty('scenarioId');
    expect(current.round).not.toHaveProperty('companyName');
    expect(current.round).not.toHaveProperty('ticker');
    expect(current.round).not.toHaveProperty('endingPrice');
    expect(current.round).not.toHaveProperty('actualReturnPercent');
    expect(current.round).not.toHaveProperty('shortText');
    expect(current.round).not.toHaveProperty('outcomeChart');
    expect(current.round.lookbackChart.length).toBeGreaterThan(0);

    await expect(service.submitRoundDecision({
      owner,
      runId: current.id,
      roundIndex: 0,
      action: 'pass',
      currentBankroll: 999999,
    })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    expect(await prisma.roundDecision.count({ where: { runId: current.id } })).toBe(0);

    const result = await service.submitRoundDecision({
      owner,
      runId: current.id,
      roundIndex: 0,
      action: 'pass',
    });
    expect(await prisma.roundDecision.count({ where: { runId: current.id } })).toBe(1);
    expect(result.reveal.companyName.length).toBeGreaterThan(0);
    expect(result.reveal.ticker.length).toBeGreaterThan(0);
    expect(result.reveal.outcomeChart.length).toBeGreaterThan(0);

    await expect(service.submitRoundDecision({
      owner,
      runId: current.id,
      roundIndex: 0,
      action: 'pass',
    })).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(service.submitRoundDecision({
      owner: { kind: 'guest', guestSessionId: guestIds.stranger },
      runId: current.id,
      roundIndex: 1,
      action: 'pass',
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  it('uses server-held outcomes and game-engine rules for bankruptcy', async () => {
    const owner = { kind: 'guest' as const, guestSessionId: guestIds.bankrupt };
    const current = await service.createClassicRun({ owner, difficulty: 'easy' });
    const storedRun = await prisma.run.findUniqueOrThrow({
      where: { id: current.id },
      select: { scenarioOrder: true },
    });
    const scenarioOrder = scenarioOrderSchema.parse(storedRun.scenarioOrder);
    const scenario = await prisma.scenario.findUniqueOrThrow({
      where: { id: scenarioOrder[0].scenarioId },
      select: { actualReturnPercent: true },
    });
    const action = scenario.actualReturnPercent.toNumber() > 0 ? 'short' : 'long';
    const result = await service.submitRoundDecision({
      owner,
      runId: current.id,
      roundIndex: 0,
      action,
      confidence: 'all_in',
    });
    expect(result.run.status).toBe('bankrupt');
    expect(result.run.currentBankroll).toBe(0);
    const stored = await prisma.run.findUniqueOrThrow({ where: { id: current.id } });
    expect(stored.finalBankroll?.toNumber()).toBe(0);
    expect(stored.completedAt).not.toBeNull();

    const publicBoard = await leaderboards.list({
      board: 'classic',
      difficulty: 'easy',
    });
    expect(publicBoard.rows.some((row) => row.bankroll === 0)).toBe(false);
  });

  it('persists completion, stats, official eligibility, and locked tiebreaker inputs', async () => {
    const owner = { kind: 'user' as const, userId };
    let current = await service.createClassicRun({ owner, difficulty: 'easy' });
    authenticatedRunId = current.id;
    let finalResult: Awaited<ReturnType<RunService['submitRoundDecision']>> | null = null;
    for (let roundIndex = 0; roundIndex < current.totalRounds; roundIndex += 1) {
      finalResult = await service.submitRoundDecision({
        owner,
        runId: current.id,
        roundIndex,
        action: 'pass',
      });
    }
    expect(finalResult?.run.status).toBe('completed');
    const completedDecisions = await prisma.roundDecision.findMany({
      where: { runId: current.id },
      select: { signalScoreDelta: true },
    });
    const expectedSignalScore = completedDecisions.reduce(
      (sum, decision) => sum + decision.signalScoreDelta.toNumber(),
      0,
    );
    expect(finalResult?.run.signalScore).toBeCloseTo(expectedSignalScore, 6);
    expect(finalResult?.run.currentBankroll).toBe(12500);
    expect(await service.getCurrentRun({ owner })).toBeNull();

    const stats = await prisma.playerStats.findUniqueOrThrow({ where: { userId } });
    expect(stats.completedRuns).toBe(1);
    expect(stats.totalRounds).toBe(10);
    expect(stats.passes).toBe(10);

    const board = await leaderboards.list({
      board: 'classic',
      difficulty: 'easy',
    }, userId);
    const entry = board.currentUserRow;
    expect(entry).not.toBeNull();
    expect(entry?.bankroll).toBe(12500);
    // Smart Pass (Phase 11) makes pass scoring content-dependent; assert
    // against the recorded per-round deltas rather than a fixed constant.
    expect(entry?.signalScore).toBeCloseTo(expectedSignalScore, 6);
    expect(entry?.correctCalls).toBe(0);
    expect(entry?.passes).toBe(10);
    expect(entry?.completionTimeMs).not.toBeNull();
  });

  it('idempotently maps a verified external auth ID to one internal user', async () => {
    const externalAuthId = `clerk_test_${suiteId}`;
    const first = await ensureUserForExternalAuth(prisma, {
      externalAuthId,
      email: `p6_${suiteId}@example.com`,
      displayName: 'Mapped Player',
    });
    const second = await ensureUserForExternalAuth(prisma, { externalAuthId });
    expect(second.id).toBe(first.id);
    expect(await prisma.user.count({ where: { externalAuthId } })).toBe(1);

    // Fresh accounts have no saved stats until a run finishes.
    expect(await getPlayerStats(prisma, { userId: first.id })).toBeNull();
    await expect(ensureUserForExternalAuth(prisma, { externalAuthId: '' }))
      .rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });

  it('rejects guest Daily creation and allows repeated immutable user attempts', async () => {
    // D048: the Daily Challenge is login-gated at the database boundary too.
    await expect(service.createDailyChallengeRun({
      owner: { kind: 'guest', guestSessionId: guestIds.stranger },
      dailyChallengeId: challengeId,
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });

    // D049: unlimited authenticated attempts, each a separate run.
    const owner = { kind: 'user' as const, userId };
    const [first, concurrentStart] = await Promise.all([
      service.createDailyChallengeRun({ owner, dailyChallengeId: challengeId }),
      service.createDailyChallengeRun({ owner, dailyChallengeId: challengeId }),
    ]);
    expect(first.mode).toBe('daily_challenge');
    expect(first.difficulty).toBeNull();
    expect(first.isOfficial).toBe(true);
    expect(concurrentStart.id).toBe(first.id);
    expect(first.round).not.toHaveProperty('scenarioId');
    expect(first.round).not.toHaveProperty('companyName');
    expect(first.round).not.toHaveProperty('actualReturnPercent');
    expect(first.round).not.toHaveProperty('outcomeChart');

    const completed = await completeWithPasses(owner, first.id, first.totalRounds);
    expect(completed?.run.status).toBe('completed');

    // A finished attempt is immutable: no further decisions, no overwrites.
    await expect(service.submitRoundDecision({
      owner,
      runId: first.id,
      roundIndex: first.totalRounds,
      action: 'pass',
    })).rejects.toMatchObject({ code: 'INVALID_STATE' });
    await expect(service.submitRoundDecision({
      owner,
      runId: first.id,
      roundIndex: 0,
      action: 'long',
      confidence: 'all_in',
    })).rejects.toMatchObject({ code: 'INVALID_STATE' });

    const second = await service.createDailyChallengeRun({ owner, dailyChallengeId: challengeId });
    expect(second.id).not.toBe(first.id);
    expect((await service.getCurrentRun({
      owner,
      mode: 'daily_challenge',
      dailyChallengeId: challengeId,
    }))?.id).toBe(second.id);
    expect(await service.getCurrentRun({ owner, mode: 'classic_run' })).toBeNull();

    const storedSecond = await prisma.run.findUniqueOrThrow({
      where: { id: second.id },
      select: { scenarioOrder: true },
    });
    const secondOrder = scenarioOrderSchema.parse(storedSecond.scenarioOrder);
    const secondScenario = await prisma.scenario.findUniqueOrThrow({
      where: { id: secondOrder[0].scenarioId },
      select: { actualReturnPercent: true },
    });
    const losingAction = secondScenario.actualReturnPercent.toNumber() > 0 ? 'short' : 'long';
    const bankrupt = await service.submitRoundDecision({
      owner,
      runId: second.id,
      roundIndex: 0,
      action: losingAction,
      confidence: 'all_in',
    });
    expect(bankrupt.run.status).toBe('bankrupt');
    expect(bankrupt.run.currentBankroll).toBe(0);
    expect((await service.getRunSummary({ owner, runId: second.id })).status).toBe('bankrupt');

    const dailyBoard = await leaderboards.list({ board: 'daily', date: '2099-12-30' }, userId);
    const firstAttemptDecisions = await prisma.roundDecision.findMany({
      where: { runId: first.id },
      select: { signalScoreDelta: true },
    });
    const firstAttemptSignalScore = firstAttemptDecisions.reduce(
      (sum, decision) => sum + decision.signalScoreDelta.toNumber(),
      0,
    );
    expect(dailyBoard.currentUserRow).toMatchObject({
      bankroll: 10000,
      signalScore: firstAttemptSignalScore,
    });

    const attempts = await prisma.run.findMany({
      where: { dailyChallengeId: challengeId, userId },
      select: { id: true, status: true },
    });
    expect(attempts).toHaveLength(2);
    const stored = await prisma.run.findUniqueOrThrow({ where: { id: first.id } });
    expect(stored.status).toBe('completed');
    expect(stored.completedRounds).toBe(first.totalRounds);
  });

  it('resumes the latest Daily attempt across a controlled UTC midnight', async () => {
    const rolloverUserId = `phase8_rollover_user_${suiteId}`;
    const yesterdayId = `phase8_rollover_yesterday_${suiteId}`;
    const todayId = `phase8_rollover_today_${suiteId}`;
    const yesterday = new Date('2098-06-10T00:00:00.000Z');
    const today = new Date('2098-06-11T00:00:00.000Z');
    const pool = await prisma.dailyChallengePool.findUniqueOrThrow({
      where: { id: 'daily_pool_001' },
      select: {
        entries: {
          orderBy: { ordinal: 'asc' },
          select: { scenarioId: true, difficulty: true },
        },
      },
    });

    try {
      await prisma.user.create({
        data: {
          id: rolloverUserId,
          publicAlias: `Player-${suiteId.slice(0, 4).toUpperCase()}R`,
        },
      });
      await prisma.dailyChallenge.createMany({
        data: [
          {
            id: yesterdayId,
            challengeDate: yesterday,
            poolId: 'daily_pool_001',
            startingBankroll: 10000,
            scenarioOrder: pool.entries,
          },
          {
            id: todayId,
            challengeDate: today,
            poolId: 'daily_pool_001',
            startingBankroll: 10000,
            scenarioOrder: pool.entries,
          },
        ],
      });

      const owner = { kind: 'user' as const, userId: rolloverUserId };
      const yesterdayRun = await service.createDailyChallengeRun({
        owner,
        dailyChallengeId: yesterdayId,
      });
      expect((await service.getCurrentRun({ owner, mode: 'daily_challenge' }))?.id)
        .toBe(yesterdayRun.id);

      // The post-midnight start request converges on the still-active prior
      // challenge rather than creating a second attempt that would strand it.
      const resumed = await service.createDailyChallengeRun({
        owner,
        dailyChallengeId: todayId,
      });
      expect(resumed.id).toBe(yesterdayRun.id);
      expect(await service.getCurrentRun({
        owner,
        mode: 'daily_challenge',
        dailyChallengeId: todayId,
      })).toBeNull();
      expect(await prisma.run.count({
        where: { userId: rolloverUserId, mode: 'daily_challenge', status: 'in_progress' },
      })).toBe(1);
    } finally {
      await prisma.run.deleteMany({ where: { dailyChallengeId: { in: [yesterdayId, todayId] } } });
      await prisma.dailyChallenge.deleteMany({ where: { id: { in: [yesterdayId, todayId] } } });
      await prisma.user.deleteMany({ where: { id: rolloverUserId } });
    }
  });

  it('claims a completed guest Classic Run exactly once, transactionally', async () => {
    const guestOwner = { kind: 'guest' as const, guestSessionId: guestIds.claimant };
    const run = await service.createClassicRun({ owner: guestOwner, difficulty: 'easy' });
    expect(run.isOfficial).toBe(false);

    // An in-progress run can never be claimed — signing in alone changes nothing.
    await expect(service.claimCompletedGuestRun({
      userId: claimUserId,
      guestSessionId: guestIds.claimant,
      runId: run.id,
    })).rejects.toMatchObject({ code: 'INVALID_STATE' });

    const finished = await completeWithPasses(guestOwner, run.id, run.totalRounds);
    expect(finished?.run.status).toBe('completed');

    // Cross-owner: a different guest session cookie is rejected.
    await expect(service.claimCompletedGuestRun({
      userId: claimUserId,
      guestSessionId: guestIds.stranger,
      runId: run.id,
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });

    // A failed claim (unknown user) leaves the guest result retryable.
    await expect(service.claimCompletedGuestRun({
      userId: 'no_such_user',
      guestSessionId: guestIds.claimant,
      runId: run.id,
    })).rejects.toMatchObject({ code: 'NOT_FOUND' });

    // Concurrent duplicate claims: exactly one wins, the rest fail safely.
    const results = await Promise.allSettled([
      service.claimCompletedGuestRun({
        userId: claimUserId,
        guestSessionId: guestIds.claimant,
        runId: run.id,
      }),
      service.claimCompletedGuestRun({
        userId: rivalUserId,
        guestSessionId: guestIds.claimant,
        runId: run.id,
      }),
    ]);
    const wins = results.filter((result) => result.status === 'fulfilled');
    expect(wins).toHaveLength(1);

    const stored = await prisma.run.findUniqueOrThrow({
      where: { id: run.id },
      include: { roundDecisions: true },
    });
    expect(stored.userId === claimUserId || stored.userId === rivalUserId).toBe(true);
    // The run transfers fully to the account (exactly-one-owner constraint).
    expect(stored.guestSessionId).toBeNull();
    expect(stored.isOfficial).toBe(true);
    expect(stored.claimedAt).not.toBeNull();
    expect(stored.roundDecisions.every((decision) => decision.userId === stored.userId)).toBe(true);

    // Saved stats refreshed for the winner inside the claim transaction.
    const stats = await prisma.playerStats.findUniqueOrThrow({
      where: { userId: stored.userId as string },
    });
    expect(stats.completedRuns).toBe(1);
    expect(stats.totalRounds).toBe(run.totalRounds);

    // A double claim after the fact fails safely for everyone.
    await expect(service.claimCompletedGuestRun({
      userId: claimUserId,
      guestSessionId: guestIds.claimant,
      runId: run.id,
    })).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(service.claimCompletedGuestRun({
      userId: rivalUserId,
      guestSessionId: guestIds.claimant,
      runId: run.id,
    })).rejects.toMatchObject({ code: 'CONFLICT' });

    // The claimed summary now reads as saved and no longer claimable.
    const summary = await service.getRunSummary({
      owner: { kind: 'user', userId: stored.userId as string },
      runId: run.id,
    });
    expect(summary.claimed).toBe(true);
    expect(summary.claimable).toBe(false);
    expect(summary.isOfficial).toBe(true);
  });

  it('claims bankrupt Classic results and enforces summary ownership', async () => {
    // Bankruptcy ends the run and logs its score, so the finished guest result
    // remains saveable under the same one-time claim rules.
    const bankruptRun = await prisma.run.findFirstOrThrow({
      where: { guestSession: { clientSessionId: guestIds.bankrupt }, status: 'bankrupt' },
      select: { id: true },
    });
    const summary = await service.getRunSummary({
      owner: { kind: 'guest', guestSessionId: guestIds.bankrupt },
      runId: bankruptRun.id,
    });
    expect(summary.status).toBe('bankrupt');
    expect(summary.claimable).toBe(true);
    await expect(service.getRunSummary({
      owner: { kind: 'guest', guestSessionId: guestIds.stranger },
      runId: bankruptRun.id,
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });

    const claimed = await service.claimCompletedGuestRun({
      userId: claimUserId,
      guestSessionId: guestIds.bankrupt,
      runId: bankruptRun.id,
    });
    expect(claimed.status).toBe('bankrupt');
    expect(claimed.claimed).toBe(true);
    expect(claimed.isOfficial).toBe(true);
    await expect(service.getRunSummary({
      owner: { kind: 'user', userId },
      runId: bankruptRun.id,
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    expect((await service.getRunSummary({
      owner: { kind: 'user', userId: claimUserId },
      runId: bankruptRun.id,
    })).claimed).toBe(true);
  });

  it('ranks canonical runs with D050 fairness, privacy, pagination, and public names', async () => {
    const commonBest = {
      bankroll: 15000,
      signalScore: 5,
      correctCalls: 5,
      passes: 1,
      completionTimeMs: 1000,
    };
    await createLeaderboardRun({
      label: 'a_easy_best', userId: leaderboardUserA, mode: 'classic_run',
      difficulty: 'easy', ...commonBest,
    });
    await createLeaderboardRun({
      label: 'a_easy_worse', userId: leaderboardUserA, mode: 'classic_run',
      difficulty: 'easy', ...commonBest, signalScore: 4, correctCalls: 8, passes: 0,
    });
    await createLeaderboardRun({
      label: 'b_easy_tie', userId: leaderboardUserB, mode: 'classic_run',
      difficulty: 'easy', ...commonBest,
    });
    await createLeaderboardRun({
      label: 'c_easy_third', userId: leaderboardUserC, mode: 'classic_run',
      difficulty: 'easy', bankroll: 14000, signalScore: 2, correctCalls: 4,
      passes: 2, completionTimeMs: 900,
    });
    await createLeaderboardRun({
      label: 'a_medium', userId: leaderboardUserA, mode: 'classic_run',
      difficulty: 'medium', bankroll: 99999, signalScore: 1, correctCalls: 1,
      passes: 0, completionTimeMs: 500,
    });
    await createLeaderboardRun({
      label: 'c_unofficial', userId: leaderboardUserC, mode: 'classic_run',
      difficulty: 'easy', bankroll: 99999, signalScore: 99, correctCalls: 10,
      passes: 0, completionTimeMs: 1, isOfficial: false,
    });
    await createLeaderboardRun({
      label: 'a_daily_worse', userId: leaderboardUserA, mode: 'daily_challenge',
      dailyChallengeId: challengeId, bankroll: 10000, signalScore: 1,
      correctCalls: 1, passes: 2, completionTimeMs: 3000,
    });
    await createLeaderboardRun({
      label: 'a_daily_best', userId: leaderboardUserA, mode: 'daily_challenge',
      dailyChallengeId: challengeId, bankroll: 12000, signalScore: 2,
      correctCalls: 3, passes: 1, completionTimeMs: 2500,
    });
    await createLeaderboardRun({
      label: 'b_daily', userId: leaderboardUserB, mode: 'daily_challenge',
      dailyChallengeId: challengeId, bankroll: 11000, signalScore: 3,
      correctCalls: 4, passes: 0, completionTimeMs: 2000,
    });

    const [classicA, classicB, classicC] = await Promise.all([
      leaderboards.list({
        board: 'classic', difficulty: 'easy', page: 999, pageSize: 1,
      }, leaderboardUserA),
      leaderboards.list({
        board: 'classic', difficulty: 'easy', page: 999, pageSize: 1,
      }, leaderboardUserB),
      leaderboards.list({
        board: 'classic', difficulty: 'easy', page: 999, pageSize: 1,
      }, leaderboardUserC),
    ]);
    expect(classicA.rows).toEqual([]);
    expect(classicB.rows).toEqual([]);
    expect(classicC.rows).toEqual([]);
    expect(classicA.currentUserRow).toMatchObject({ publicName: leaderboardAliasA, bankroll: 15000 });
    expect(classicB.currentUserRow).toMatchObject({ publicName: leaderboardAliasB, bankroll: 15000 });
    expect(classicC.currentUserRow).toMatchObject({ publicName: leaderboardAliasC, bankroll: 14000 });
    expect(classicA.currentUserRow?.rank).toBe(classicB.currentUserRow?.rank);
    expect(classicC.currentUserRow?.rank).toBeGreaterThan(classicA.currentUserRow?.rank ?? 0);
    expect(JSON.stringify([classicA, classicB, classicC])).not.toContain('PRIVATE Leaderboard');
    expect(JSON.stringify([classicA, classicB, classicC])).not.toContain(leaderboardUserA);
    expect(JSON.stringify([classicA, classicB, classicC])).not.toContain('externalAuthId');

    const medium = await leaderboards.list({
      board: 'classic', difficulty: 'medium', page: 1, pageSize: 25,
    });
    expect(medium.currentUserRow).toBeNull();
    const mediumA = await leaderboards.list({
      board: 'classic', difficulty: 'medium', page: 999, pageSize: 1,
    }, leaderboardUserA);
    expect(mediumA.currentUserRow).toMatchObject({ publicName: leaderboardAliasA, bankroll: 99999 });

    const daily = await leaderboards.list({
      board: 'daily', date: '2099-12-30', page: 1, pageSize: 25,
    });
    const dailyRows = daily.rows.filter((row) =>
      row.publicName === leaderboardAliasA || row.publicName === leaderboardAliasB);
    expect(dailyRows.map(({ bankroll }) => bankroll)).toEqual([12000, 11000]);
    const emptyDaily = await leaderboards.list({
      board: 'daily', date: '2099-12-29', page: 1, pageSize: 25,
    });
    expect(emptyDaily.rows).toEqual([]);

    const signalForA = await leaderboards.list({ board: 'signal', page: 999, pageSize: 1 }, leaderboardUserA);
    expect(signalForA.currentUserRow).toMatchObject({
      publicName: leaderboardAliasA,
      signalScore: 13,
      correctCalls: 18,
      passes: 4,
    });

    const named = await updatePublicIdentity(prisma, {
      userId: leaderboardUserA,
      displayName: 'Signal Star',
    });
    expect(named.publicName).toBe('Signal Star');
    await expect(updatePublicIdentity(prisma, {
      userId: leaderboardUserB,
      displayName: 'signal star',
    })).rejects.toMatchObject({ code: 'CONFLICT' });
    await expect(updatePublicIdentity(prisma, {
      userId: leaderboardUserB,
      displayName: 'Player-1A2B',
    })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    const cleared = await updatePublicIdentity(prisma, {
      userId: leaderboardUserA,
      displayName: null,
    });
    expect(cleared.publicName).toBe(cleared.alias);
    expect(await getPublicIdentity(prisma, { userId: leaderboardUserA })).toEqual(cleared);

    await expect(leaderboards.list({
      board: 'classic', difficulty: 'easy', userId: leaderboardUserA,
    })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
  });
});

describe('database test environment', () => {
  it('documents when integration tests are skipped', () => {
    if (!databaseAvailable) {
      expect(process.env.DATABASE_URL).toBeUndefined();
    } else {
      expect(databaseAvailable).toBe(true);
    }
  });
});
