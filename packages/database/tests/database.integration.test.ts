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
import { ensureUserForExternalAuth, getPlayerStats } from '../src/identityService';
import { RunService } from '../src/runService';
import { scenarioOrderSchema } from '../src/contracts';

loadDatabaseEnvironment();

const databaseAvailable = Boolean(process.env.DATABASE_URL && process.env.DIRECT_URL);
const describeDatabase = databaseAvailable ? describe : describe.skip;

describeDatabase('PostgreSQL persistence integration', () => {
  const prisma = createDatabaseClient();
  const service = new RunService(prisma, () => 0.42);
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
  const challengeId = `phase5_test_challenge_${suiteId}`;
  const challengeDate = new Date('2099-12-30T00:00:00.000Z');
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
        profile: { create: { displayName: 'Phase 5 Test Player' } },
      },
    });
    await prisma.user.create({ data: { id: claimUserId, displayName: 'Phase 6 Claimant' } });
    await prisma.user.create({ data: { id: rivalUserId, displayName: 'Phase 6 Rival' } });
    await prisma.dailyChallenge.create({
      data: {
        id: challengeId,
        challengeDate,
        poolId: 'daily_pool_001',
        startingBankroll: 10000,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { externalAuthId: `clerk_test_${suiteId}` } });
    await prisma.user.deleteMany({ where: { id: { in: [userId, claimUserId, rivalUserId] } } });
    await prisma.guestSession.deleteMany({
      where: { clientSessionId: { in: Object.values(guestIds) } },
    });
    await prisma.run.deleteMany({ where: { dailyChallengeId: challengeId } });
    await prisma.dailyChallenge.deleteMany({ where: { id: challengeId } });
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

    await expect(service.createLeaderboardEntryForRun({
      owner,
      runId: current.id,
      leaderboardType: 'best_classic_run_bankroll',
    })).rejects.toMatchObject({ code: 'FORBIDDEN' });
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
    expect(finalResult?.run.signalScore).toBe(-2.5);
    expect(finalResult?.run.currentBankroll).toBe(12500);
    expect(await service.getCurrentRun({ owner })).toBeNull();

    const stats = await prisma.playerStats.findUniqueOrThrow({ where: { userId } });
    expect(stats.completedRuns).toBe(1);
    expect(stats.totalRounds).toBe(10);
    expect(stats.passes).toBe(10);

    const entry = await service.createLeaderboardEntryForRun({
      owner,
      runId: authenticatedRunId,
      leaderboardType: 'best_classic_run_bankroll',
      periodKey: 'all_time',
    });
    expect(entry.scoreBankroll?.toNumber()).toBe(12500);
    expect(entry.scoreSignal?.toNumber()).toBe(-2.5);
    expect(entry.correctCalls).toBe(0);
    expect(entry.passes).toBe(10);
    expect(entry.completionTimeMs).not.toBeNull();
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
    const first = await service.createDailyChallengeRun({ owner, dailyChallengeId: challengeId });
    expect(first.mode).toBe('daily_challenge');
    expect(first.difficulty).toBeNull();
    expect(first.isOfficial).toBe(true);

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
    expect((await service.getCurrentRun({ owner, mode: 'daily_challenge' }))?.id).toBe(second.id);
    expect(await service.getCurrentRun({ owner, mode: 'classic_run' })).toBeNull();

    const attempts = await prisma.run.findMany({
      where: { dailyChallengeId: challengeId, userId },
      select: { id: true, status: true },
    });
    expect(attempts).toHaveLength(2);
    const stored = await prisma.run.findUniqueOrThrow({ where: { id: first.id } });
    expect(stored.status).toBe('completed');
    expect(stored.completedRounds).toBe(first.totalRounds);
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
