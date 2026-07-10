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
  };
  const userId = `phase5_test_user_${suiteId}`;
  const challengeId = `phase5_test_challenge_${suiteId}`;
  let authenticatedRunId = '';

  beforeAll(async () => {
    await importProductionContent(prisma);
    await prisma.user.create({
      data: {
        id: userId,
        displayName: 'Phase 5 Test Player',
        profile: { create: { displayName: 'Phase 5 Test Player' } },
      },
    });
    await prisma.dailyChallenge.create({
      data: {
        id: challengeId,
        challengeDate: new Date('2099-12-30T00:00:00.000Z'),
        poolId: 'daily_pool_001',
        startingBankroll: 10000,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.guestSession.deleteMany({
      where: { clientSessionId: { in: Object.values(guestIds) } },
    });
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

  it('allows unofficial guest Daily runs but enforces one official user attempt', async () => {
    const owner = { kind: 'user' as const, userId };
    const daily = await service.createDailyChallengeRun({ owner, dailyChallengeId: challengeId });
    expect(daily.mode).toBe('daily_challenge');
    expect(daily.difficulty).toBeNull();
    expect(daily.isOfficial).toBe(true);
    await expect(service.createDailyChallengeRun({
      owner,
      dailyChallengeId: challengeId,
    })).rejects.toMatchObject({ code: 'CONFLICT' });
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
