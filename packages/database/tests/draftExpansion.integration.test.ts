import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabaseClient } from '../src/client';
import { importProductionContent } from '../src/contentImport';
import { loadDatabaseEnvironment } from '../src/environment';
import { DraftBattleService } from '../src/draftBattleService';
import { PortfolioDraftService } from '../src/draftService';
import { LeaderboardService } from '../src/leaderboardService';

loadDatabaseEnvironment();
const databaseAvailable = Boolean(process.env.DATABASE_URL && process.env.DIRECT_URL);

async function phase11TablesExist(): Promise<boolean> {
  if (!databaseAvailable) return false;
  const prisma = createDatabaseClient();
  try {
    const rows = await prisma.$queryRaw<Array<{ leaderboard: string | null; battle: string | null; player: string | null }>>`
      SELECT to_regclass('"DraftLeaderboardEntry"')::text AS leaderboard,
             to_regclass('"DraftBattle"')::text AS battle,
             to_regclass('"DraftBattlePlayer"')::text AS player
    `;
    return Boolean(rows[0]?.leaderboard && rows[0]?.battle && rows[0]?.player);
  } finally {
    await prisma.$disconnect();
  }
}

const describePhase11 = (await phase11TablesExist()) ? describe : describe.skip;

describePhase11('Phase 11 weighted Draft and Draft Battle integration', () => {
  const prisma = createDatabaseClient();
  const suiteId = randomUUID();
  let timeOffsetMs = 0;
  const now = () => new Date(Date.now() + timeOffsetMs);
  const drafts = new PortfolioDraftService(prisma, () => 0.25);
  const battles = new DraftBattleService(prisma, { random: () => 0.25, now });
  const leaderboards = new LeaderboardService(prisma);
  const userA = `p11_draft_a_${suiteId}`;
  const userB = `p11_draft_b_${suiteId}`;
  const userC = `p11_draft_c_${suiteId}`;
  const ownerA = { kind: 'user' as const, userId: userA };

  beforeAll(async () => {
    await importProductionContent(prisma);
    await prisma.user.createMany({ data: [
      { id: userA, publicAlias: `Player-${suiteId.slice(0, 4).toUpperCase()}A` },
      { id: userB, publicAlias: `Player-${suiteId.slice(0, 4).toUpperCase()}B` },
      { id: userC, publicAlias: `Player-${suiteId.slice(0, 4).toUpperCase()}C` },
    ] });
  }, 120_000);

  afterAll(async () => {
    await prisma.draftBattle.deleteMany({ where: { creatorId: { in: [userA, userB, userC] } } });
    await prisma.portfolioDraft.deleteMany({ where: { userId: { in: [userA, userB, userC] } } });
    await prisma.draftLeaderboardEntry.deleteMany({ where: { userId: { in: [userA, userB, userC] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userA, userB, userC] } } });
    await prisma.$disconnect();
  }, 120_000);

  it('creates leakage-safe Quick and Era Drafts, locks weighted results, and keeps each format board separate', async () => {
    const quick = await drafts.createDraft({ owner: ownerA, format: 'quick' });
    expect(quick.format).toBe('quick');
    expect(quick.cards).toHaveLength(4);
    expect(JSON.stringify(quick)).not.toContain('actualReturnPercent');
    expect(JSON.stringify(quick)).not.toContain('companyName');
    const storedQuick = await prisma.portfolioDraft.findUniqueOrThrow({ where: { id: quick.id }, select: { scenarioSnapshot: true } });
    const quickSnapshot = storedQuick.scenarioSnapshot as Array<{ scenarioId: string; companyName: string; actualReturnPercent: number }>;
    const mutated = quickSnapshot[0];
    const original = await prisma.scenario.findUniqueOrThrow({ where: { id: mutated.scenarioId }, select: { companyName: true, actualReturnPercent: true } });
    let completed;
    try {
      await prisma.scenario.update({ where: { id: mutated.scenarioId }, data: { companyName: 'MUTATED AFTER SNAPSHOT', actualReturnPercent: 9 } });
      completed = await drafts.submitSelections({ owner: ownerA, draftId: quick.id, slots: [0, 1], allocations: [60, 40] });
      expect(completed.companies[0].companyName).toBe(mutated.companyName);
      expect(completed.companies[0].actualReturnPercent).toBe(mutated.actualReturnPercent);
    } finally {
      await prisma.scenario.update({ where: { id: mutated.scenarioId }, data: original });
    }
    expect(completed.status).toBe('completed');
    expect(completed.format).toBe('quick');
    expect(completed.companies.filter((company) => company.selected)).toHaveLength(2);
    expect(completed.companies.filter((company) => company.selected).map((company) => company.allocationPercent)).toEqual([60, 40]);

    const eligibleEras = await drafts.listEras();
    expect(eligibleEras.length).toBeGreaterThan(0);
    const era = eligibleEras[0];
    const eraDraft = await drafts.createDraft({ owner: { kind: 'user', userId: userB }, format: 'era', eraId: era.id });
    expect(eraDraft.format).toBe('era');
    expect(eraDraft.eraId).toBe(era.id);
    expect(eraDraft.cards).toHaveLength(6);
    const eraCompleted = await drafts.submitSelections({ owner: { kind: 'user', userId: userB }, draftId: eraDraft.id, slots: [0, 1, 2], allocations: [60, 30, 10] });
    expect(eraCompleted.companies.filter((company) => company.selected).map((company) => company.allocationPercent)).toEqual([60, 30, 10]);

    const board = await leaderboards.listDraft({ format: 'quick', page: 1, pageSize: 10 }, userA);
    expect(board.rows).toHaveLength(1);
    expect(board.rows[0].isCurrentUser).toBe(true);
    expect((await leaderboards.listDraft({ format: 'era', page: 1, pageSize: 10 }, userB)).rows).toHaveLength(1);
  }, 120_000);

  it('keeps Draft Battle choices private, settles once, and rejects duplicates', async () => {
    const soloEntriesBefore = await prisma.draftLeaderboardEntry.count({ where: { userId: { in: [userA, userB] } } });
    const created = await battles.createBattle({ userId: userA, format: 'quick', timerSeconds: null });
    expect(created.inviteCode).toMatch(/^[a-f0-9]{32}$/);
    expect(created.cards).toBeNull();
    const joined = await battles.joinBattle({ userId: userB, inviteCode: created.inviteCode! });
    expect(joined.status).toBe('awaiting_submissions');
    expect(joined.cards).toHaveLength(4);
    const submitted = await battles.submit({ userId: userA, battleId: created.id, slots: [0, 1], allocations: [60, 40] });
    expect(submitted.you.hasSubmitted).toBe(true);
    expect(submitted.opponent?.hasSubmitted).toBe(false);
    expect(JSON.stringify(submitted.opponent)).not.toContain('selectedSlots');
    await expect(battles.getBattleState({ userId: userC, battleId: created.id })).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const storedBattle = await prisma.draftBattle.findUniqueOrThrow({ where: { id: created.id }, select: { scenarioSnapshot: true } });
    const battleSnapshot = storedBattle.scenarioSnapshot as Array<{ scenarioId: string; companyName: string; actualReturnPercent: number }>;
    const changed = battleSnapshot[2];
    const prior = await prisma.scenario.findUniqueOrThrow({ where: { id: changed.scenarioId }, select: { companyName: true, actualReturnPercent: true } });
    let settled;
    try {
      await prisma.scenario.update({ where: { id: changed.scenarioId }, data: { companyName: 'MUTATED BETWEEN SUBMISSIONS', actualReturnPercent: -0.99 } });
      settled = await battles.submit({ userId: userB, battleId: created.id, slots: [2, 3], allocations: [50, 50] });
      expect(settled.reveal?.companies[2].companyName).toBe(changed.companyName);
      expect(settled.reveal?.companies[2].actualReturnPercent).toBe(changed.actualReturnPercent);
    } finally {
      await prisma.scenario.update({ where: { id: changed.scenarioId }, data: prior });
    }
    expect(settled.status).toBe('completed');
    expect(settled.reveal).not.toBeNull();
    expect(settled.reveal?.companies).toHaveLength(4);
    await expect(battles.submit({ userId: userA, battleId: created.id, slots: [0, 1], allocations: [60, 40] })).rejects.toMatchObject({ code: 'CONFLICT' });
    // Battle results never touch the solo Draft leaderboards (charter: out of scope).
    expect(await prisma.draftLeaderboardEntry.count({ where: { userId: { in: [userA, userB] } } })).toBe(soloEntriesBefore);
  }, 120_000);

  it('forfeits missing deadline submissions, draws double no-submit, and expires at 24 hours', async () => {
    const one = await battles.createBattle({ userId: userA, format: 'quick', timerSeconds: 120 });
    await battles.joinBattle({ userId: userB, inviteCode: one.inviteCode! });
    await battles.submit({ userId: userA, battleId: one.id, slots: [0, 1], allocations: [60, 40] });
    timeOffsetMs = 121_000;
    try {
      const forfeited = await battles.getBattleState({ userId: userB, battleId: one.id });
      expect(forfeited.status).toBe('completed');
      expect(forfeited.outcome).toBe('you_lost');
      expect(forfeited.reveal?.you.forfeited).toBe(true);
    } finally { timeOffsetMs = 0; }

    const none = await battles.createBattle({ userId: userA, format: 'quick', timerSeconds: 120 });
    await battles.joinBattle({ userId: userC, inviteCode: none.inviteCode! });
    timeOffsetMs = 121_000;
    try {
      const noWinner = await battles.getBattleState({ userId: userA, battleId: none.id });
      expect(noWinner.status).toBe('completed');
      expect(noWinner.outcome).toBe('no_winner');
    } finally { timeOffsetMs = 0; }

    const expired = await battles.createBattle({ userId: userA, format: 'quick', timerSeconds: null });
    timeOffsetMs = 24 * 3_600_000 + 1_000;
    try {
      const state = await battles.getBattleState({ userId: userA, battleId: expired.id });
      expect(state.status).toBe('expired');
      expect(state.outcome).toBe('expired');
    } finally { timeOffsetMs = 0; }
  }, 120_000);

  it('serializes invite claims and duplicate submissions and rejects tampered payloads', async () => {
    const claim = await battles.createBattle({ userId: userA, format: 'quick', timerSeconds: null });
    const claims = await Promise.allSettled([
      battles.joinBattle({ userId: userB, inviteCode: claim.inviteCode! }),
      battles.joinBattle({ userId: userC, inviteCode: claim.inviteCode! }),
    ]);
    expect(claims.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(claims.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const state = await battles.getBattleState({ userId: userA, battleId: claim.id });
    const opponentId = state.opponent?.name === (await prisma.user.findUniqueOrThrow({ where: { id: userB } })).publicAlias ? userB : userC;
    await expect(battles.submit({ userId: userA, battleId: claim.id, slots: [0, 0], allocations: [50, 50] })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    await expect(battles.submit({ userId: userA, battleId: claim.id, slots: [0, 1], allocations: [70, 30] })).rejects.toMatchObject({ code: 'INVALID_INPUT' });
    const duplicates = await Promise.allSettled([
      battles.submit({ userId: userA, battleId: claim.id, slots: [0, 1], allocations: [60, 40] }),
      battles.submit({ userId: userA, battleId: claim.id, slots: [0, 1], allocations: [60, 40] }),
    ]);
    expect(duplicates.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(duplicates.filter((result) => result.status === 'rejected')).toHaveLength(1);
    await battles.submit({ userId: opponentId, battleId: claim.id, slots: [2, 3], allocations: [50, 50] });
  }, 120_000);

  it('retains the best solo replay and keeps ties on the earliest completion', async () => {
    // The one-in-progress-per-user index (D052) makes truly simultaneous solo
    // completions impossible, so replay the identical snapshot sequentially.
    const first = await drafts.createDraft({ owner: { kind: 'user', userId: userC }, format: 'quick' });
    const source = await prisma.portfolioDraft.findUniqueOrThrow({ where: { id: first.id } });
    const firstCompleted = await drafts.submitSelections({ owner: { kind: 'user', userId: userC }, draftId: first.id, slots: [0, 1], allocations: [50, 50] });
    const replay = await prisma.portfolioDraft.create({
      data: {
        userId: userC,
        guestSessionId: null,
        status: 'in_progress',
        isOfficial: true,
        format: source.format,
        eraId: source.eraId,
        windowStart: source.windowStart,
        windowEnd: source.windowEnd,
        scenarioIds: source.scenarioIds as Prisma.InputJsonValue,
        scenarioSnapshot: source.scenarioSnapshot as Prisma.InputJsonValue,
        budget: source.budget,
      },
    });
    const replayCompleted = await drafts.submitSelections({ owner: { kind: 'user', userId: userC }, draftId: replay.id, slots: [0, 1], allocations: [50, 50] });
    expect(replayCompleted.finalValue).toBe(firstCompleted.finalValue);
    const retained = await prisma.draftLeaderboardEntry.findUniqueOrThrow({
      where: { userId_format: { userId: userC, format: 'quick' } },
    });
    expect(retained.draftId).toBe(first.id);

    const later = await drafts.createDraft({ owner: { kind: 'user', userId: userC }, format: 'quick' });
    await drafts.submitSelections({ owner: { kind: 'user', userId: userC }, draftId: later.id, slots: [0, 1], allocations: [50, 50] });
    const afterEqualOrWorseReplay = await prisma.draftLeaderboardEntry.findUniqueOrThrow({
      where: { userId_format: { userId: userC, format: 'quick' } },
    });
    expect(afterEqualOrWorseReplay.draftId).toBe(retained.draftId);
  }, 120_000);
});
