import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabaseClient } from '../src/client';
import { importProductionContent } from '../src/contentImport';
import { loadDatabaseEnvironment } from '../src/environment';
import { FriendBattleService } from '../src/battleService';
import { PortfolioDraftService } from '../src/draftService';
import type { BattleStatePayload, CurrentDraftPayload } from '../src/contracts';

loadDatabaseEnvironment();

const databaseAvailable = Boolean(process.env.DATABASE_URL && process.env.DIRECT_URL);

/**
 * Phase 9A tables may not exist yet on a database the owner must not migrate
 * (shared Neon). Probe once and skip cleanly instead of failing: the suite
 * runs fully wherever migration 20260712090000 has been applied.
 */
async function competitiveTablesExist(): Promise<boolean> {
  if (!databaseAvailable) return false;
  const prisma = createDatabaseClient();
  try {
    const rows = await prisma.$queryRaw<Array<{ battle: string | null; draft: string | null }>>`
      SELECT to_regclass('"FriendBattle"')::text AS battle,
             to_regclass('"PortfolioDraft"')::text AS draft
    `;
    return Boolean(rows[0]?.battle && rows[0]?.draft);
  } finally {
    await prisma.$disconnect();
  }
}

const describeCompetitive = (await competitiveTablesExist()) ? describe : describe.skip;

describeCompetitive('Phase 9A competitive modes integration', () => {
  const prisma = createDatabaseClient();
  const suiteId = randomUUID();
  // Deterministic-enough control of server time: absolute offsets applied to
  // the real clock let tests cross round deadlines and the 24h expiry.
  let timeOffsetMs = 0;
  const serverNow = () => new Date(Date.now() + timeOffsetMs);
  const drafts = new PortfolioDraftService(prisma);
  const battles = new FriendBattleService(prisma, { now: serverNow });

  const userA = `p9a_user_a_${suiteId}`;
  const userB = `p9a_user_b_${suiteId}`;
  const userC = `p9a_user_c_${suiteId}`;
  const guestOne = randomUUID();
  const guestTwo = randomUUID();
  const ownerA = { kind: 'user', userId: userA } as const;
  const guestOwner = { kind: 'guest', guestSessionId: guestOne } as const;

  beforeAll(async () => {
    await importProductionContent(prisma);
    await prisma.user.createMany({
      data: [
        { id: userA, publicAlias: `Player-${suiteId.slice(0, 4).toUpperCase()}A` },
        { id: userB, publicAlias: `Player-${suiteId.slice(0, 4).toUpperCase()}B` },
        { id: userC, publicAlias: `Player-${suiteId.slice(0, 4).toUpperCase()}C` },
      ],
    });
  }, 120_000);

  afterAll(async () => {
    await prisma.friendBattle.deleteMany({
      where: { creatorId: { in: [userA, userB, userC] } },
    });
    await prisma.portfolioDraft.deleteMany({
      where: {
        OR: [
          { userId: { in: [userA, userB, userC] } },
          { guestSession: { clientSessionId: { in: [guestOne, guestTwo] } } },
        ],
      },
    });
    await prisma.guestSession.deleteMany({
      where: { clientSessionId: { in: [guestOne, guestTwo] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [userA, userB, userC] } } });
    await prisma.$disconnect();
  }, 120_000);

  async function scenarioForRound(battleId: string, roundIndex: number) {
    const battle = await prisma.friendBattle.findUniqueOrThrow({
      where: { id: battleId },
      select: { scenarioOrder: true },
    });
    const order = battle.scenarioOrder as Array<{ scenarioId: string }>;
    return prisma.scenario.findUniqueOrThrow({
      where: { id: order[roundIndex].scenarioId },
      select: { id: true, companyName: true, ticker: true, actualReturnPercent: true },
    });
  }

  async function startedBattle(options?: {
    timerSeconds?: 30 | 60 | 120 | null;
    difficulty?: 'easy' | 'medium' | 'hard';
  }): Promise<BattleStatePayload> {
    const created = await battles.createBattle({
      userId: userA,
      difficulty: options?.difficulty ?? 'easy',
      timerSeconds: options?.timerSeconds === undefined ? 60 : options.timerSeconds,
    });
    expect(created.inviteCode).toBeDefined();
    await battles.joinBattle({ userId: userB, inviteCode: created.inviteCode! });
    await battles.setReady({ userId: userA, battleId: created.id, round: 0 });
    return battles.setReady({ userId: userB, battleId: created.id, round: 0 });
  }

  describe('Portfolio Draft', () => {
    it('creates a guest draft with six leak-free Medium cards from one window', async () => {
      const draft = await drafts.createDraft({ owner: guestOwner });
      expect(draft.status).toBe('in_progress');
      expect(draft.isOfficial).toBe(false);
      expect(draft.budget).toBe(10000);
      expect(draft.cards).toHaveLength(6);
      expect(draft.cards.map((card) => card.slot)).toEqual([0, 1, 2, 3, 4, 5]);
      for (const card of draft.cards) {
        expect(card.situation.length).toBeGreaterThan(0);
        expect(card.longCase.length).toBeGreaterThan(0);
        expect(card.shortCase.length).toBeGreaterThan(0);
        expect(card.lookbackChart.length).toBeGreaterThan(0);
      }

      // Leakage: no scenario ids, company names, tickers, returns, or reveal
      // fields may appear before the selection locks.
      const raw = JSON.stringify(draft);
      expect(raw).not.toContain('scenario_');
      expect(raw).not.toContain('companyName');
      expect(raw).not.toContain('ticker');
      expect(raw).not.toContain('actualReturnPercent');
      expect(raw).not.toContain('endingPrice');
      expect(raw).not.toContain('reveal');
      expect(raw).not.toContain('outcome');

      const record = await prisma.portfolioDraft.findUniqueOrThrow({
        where: { id: draft.id },
        select: { scenarioIds: true },
      });
      const ids = record.scenarioIds as string[];
      const scenarios = await prisma.scenario.findMany({
        where: { id: { in: ids } },
        select: { id: true, companyName: true, decisionDate: true, endDate: true },
      });
      expect(scenarios).toHaveLength(6);
      // Six distinct companies whose holding periods share a common date.
      expect(new Set(scenarios.map((s) => s.companyName)).size).toBe(6);
      const latestDecision = Math.max(...scenarios.map((s) => s.decisionDate.getTime()));
      const earliestEnd = Math.min(...scenarios.map((s) => s.endDate.getTime()));
      expect(latestDecision).toBeLessThan(earliestEnd);
      // Each card must not name its own hidden company.
      const companyById = new Map(scenarios.map((s) => [s.id, s.companyName]));
      for (const card of draft.cards) {
        const ownCompany = companyById.get(ids[card.slot])!;
        expect(JSON.stringify(card).toLowerCase()).not.toContain(ownCompany.toLowerCase());
      }
    });

    it('resumes the current in-progress draft and abandons it on a fresh start', async () => {
      const current = await drafts.getCurrentDraft({ owner: guestOwner });
      expect(current).not.toBeNull();
      const fresh = await drafts.createDraft({ owner: guestOwner });
      expect(fresh.id).not.toBe(current!.id);
      await expect(drafts.getDraft({ owner: guestOwner, draftId: current!.id }))
        .rejects.toMatchObject({ code: 'INVALID_STATE' });
    });

    it('rejects malformed selections and enforces ownership', async () => {
      const draft = await drafts.getCurrentDraft({ owner: guestOwner });
      const draftId = draft!.id;
      await expect(drafts.submitSelections({ owner: guestOwner, draftId, slots: [0, 1] }))
        .rejects.toMatchObject({ code: 'INVALID_INPUT' });
      await expect(drafts.submitSelections({ owner: guestOwner, draftId, slots: [0, 1, 2, 3] }))
        .rejects.toMatchObject({ code: 'INVALID_INPUT' });
      await expect(drafts.submitSelections({ owner: guestOwner, draftId, slots: [0, 1, 1] }))
        .rejects.toMatchObject({ code: 'INVALID_INPUT' });
      await expect(drafts.submitSelections({ owner: guestOwner, draftId, slots: [0, 1, 6] }))
        .rejects.toMatchObject({ code: 'INVALID_INPUT' });

      const stranger = { kind: 'guest', guestSessionId: guestTwo } as const;
      await expect(drafts.getDraft({ owner: stranger, draftId }))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });
      await expect(drafts.submitSelections({ owner: stranger, draftId, slots: [0, 1, 2] }))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });
      await expect(drafts.getDraft({ owner: ownerA, draftId }))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('locks exactly one selection, computes server-side results, and reveals all six', async () => {
      const draft = (await drafts.getCurrentDraft({ owner: guestOwner }))!;
      const record = await prisma.portfolioDraft.findUniqueOrThrow({
        where: { id: draft.id },
        select: { scenarioIds: true },
      });
      const ids = record.scenarioIds as string[];
      const scenarios = await prisma.scenario.findMany({
        where: { id: { in: ids } },
        select: { id: true, actualReturnPercent: true },
      });
      const returnById = new Map(
        scenarios.map((s) => [s.id, Number(s.actualReturnPercent)]),
      );

      // Race two submissions: exactly one wins, the loser sees CONFLICT.
      const [first, second] = await Promise.allSettled([
        drafts.submitSelections({ owner: guestOwner, draftId: draft.id, slots: [0, 1, 2] }),
        drafts.submitSelections({ owner: guestOwner, draftId: draft.id, slots: [3, 4, 5] }),
      ]);
      const outcomes = [first, second];
      expect(outcomes.filter((o) => o.status === 'fulfilled')).toHaveLength(1);
      const failure = outcomes.find((o) => o.status === 'rejected') as PromiseRejectedResult;
      expect(failure.reason).toMatchObject({ code: 'CONFLICT' });

      const completed = await drafts.getDraft({ owner: guestOwner, draftId: draft.id });
      if (completed.status !== 'completed') throw new Error('Draft should be completed');
      const winner = outcomes.find((o) => o.status === 'fulfilled');
      expect(JSON.stringify((winner as PromiseFulfilledResult<unknown>).value))
        .toBe(JSON.stringify(completed));

      // Hand-verify the equal-split math against raw scenario returns.
      const selectedSlots = completed.companies.filter((c) => c.selected).map((c) => c.slot);
      const selectedReturns = selectedSlots.map((slot) => returnById.get(ids[slot])!);
      const expectedFinal = selectedReturns.reduce(
        (sum, r) => sum + Math.max(0, (10000 / 3) * (1 + r)),
        0,
      );
      expect(completed.finalValue).toBeCloseTo(expectedFinal, 6);
      const sortedReturns = [...returnById.values()].sort((a, b) => b - a).slice(0, 3);
      const expectedOptimal = sortedReturns.reduce(
        (sum, r) => sum + Math.max(0, (10000 / 3) * (1 + r)),
        0,
      );
      expect(completed.optimalValue).toBeCloseTo(expectedOptimal, 6);
      expect(completed.gapFromOptimal).toBeCloseTo(expectedOptimal - expectedFinal, 6);
      expect(completed.companies).toHaveLength(6);
      expect(completed.companies.filter((c) => c.selected)).toHaveLength(3);
      expect(completed.companies.filter((c) => c.optimal)).toHaveLength(3);
      expect(completed.companies.every((c) => c.companyName.length > 0)).toBe(true);

      // Immutability: a repeat submission conflicts and changes nothing.
      await expect(
        drafts.submitSelections({ owner: guestOwner, draftId: draft.id, slots: [3, 4, 5] }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
    });

    it('saves signed-in drafts as official', async () => {
      const draft = await drafts.createDraft({ owner: ownerA });
      expect(draft.isOfficial).toBe(true);
      const completed = await drafts.submitSelections({
        owner: ownerA,
        draftId: draft.id,
        slots: [1, 3, 5],
      });
      expect(completed.status).toBe('completed');
      const record = await prisma.portfolioDraft.findUniqueOrThrow({
        where: { id: draft.id },
        select: { userId: true, status: true, finalValue: true },
      });
      expect(record.userId).toBe(userA);
      expect(record.status).toBe('completed');
      expect(record.finalValue).not.toBeNull();
    });
  });

  describe('Friend Battle', () => {
    it('creates an immutable invite with Classic difficulty settings', async () => {
      const state = await battles.createBattle({
        userId: userA,
        difficulty: 'hard',
        timerSeconds: 120,
      });
      expect(state.status).toBe('awaiting_opponent');
      expect(state.totalRounds).toBe(20);
      expect(state.startingBankroll).toBe(7500);
      expect(state.timerSeconds).toBe(120);
      expect(state.inviteCode).toMatch(/^[a-f0-9]{32}$/);
      expect(state.opponent).toBeNull();
      expect(state.round).toBeNull();
      expect(state.reveal).toBeNull();

      const preview = await battles.getInvitePreview({
        userId: userB,
        inviteCode: state.inviteCode!,
      });
      expect(preview.joinable).toBe(true);
      expect(preview.difficulty).toBe('hard');
      const selfPreview = await battles.getInvitePreview({
        userId: userA,
        inviteCode: state.inviteCode!,
      });
      expect(selfPreview.joinable).toBe(false);
    });

    it('applies the 60-second default timer', async () => {
      const state = await battles.createBattle({ userId: userA, difficulty: 'easy' });
      expect(state.timerSeconds).toBe(60);
    });

    it('lets exactly one other signed-in player join, never the creator', async () => {
      const created = await battles.createBattle({
        userId: userA,
        difficulty: 'easy',
        timerSeconds: null,
      });
      const code = created.inviteCode!;
      await expect(battles.joinBattle({ userId: userA, inviteCode: code }))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });

      const [joinB, joinC] = await Promise.allSettled([
        battles.joinBattle({ userId: userB, inviteCode: code }),
        battles.joinBattle({ userId: userC, inviteCode: code }),
      ]);
      const fulfilled = [joinB, joinC].filter((o) => o.status === 'fulfilled');
      expect(fulfilled).toHaveLength(1);
      const rejected = [joinB, joinC].find(
        (o) => o.status === 'rejected',
      ) as PromiseRejectedResult;
      expect(rejected.reason).toMatchObject({ code: 'CONFLICT' });

      const battle = await prisma.friendBattle.findUniqueOrThrow({
        where: { id: created.id },
        include: { players: true },
      });
      expect(battle.status).toBe('awaiting_ready');
      expect(battle.players).toHaveLength(2);
    });

    it('blocks non-participants from state, ready, and decisions', async () => {
      const state = await startedBattle();
      await expect(battles.getBattleState({ userId: userC, battleId: state.id }))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });
      await expect(battles.setReady({ userId: userC, battleId: state.id, round: 1 }))
        .rejects.toMatchObject({ code: 'FORBIDDEN' });
      await expect(
        battles.submitDecision({
          userId: userC,
          battleId: state.id,
          roundIndex: 0,
          action: 'pass',
        }),
      ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    });

    it('requires both players ready before round 1 and synchronizes reveals', async () => {
      const created = await battles.createBattle({
        userId: userA,
        difficulty: 'easy',
        timerSeconds: 60,
      });
      await battles.joinBattle({ userId: userB, inviteCode: created.inviteCode! });

      let state = await battles.setReady({ userId: userA, battleId: created.id, round: 0 });
      expect(state.status).toBe('awaiting_ready');
      expect(state.round).toBeNull();
      // Ready is idempotent.
      state = await battles.setReady({ userId: userA, battleId: created.id, round: 0 });
      expect(state.status).toBe('awaiting_ready');

      state = await battles.setReady({ userId: userB, battleId: created.id, round: 0 });
      expect(state.status).toBe('in_progress');
      expect(state.roundPhase).toBe('deciding');
      expect(state.currentRoundIndex).toBe(0);
      expect(state.roundDeadlineAt).not.toBeNull();
      expect(state.round).not.toBeNull();
      expect(state.round!.roundIndex).toBe(0);

      // Pre-decision leakage: the deciding payload exposes no answer fields
      // and no scenario ids, and the hidden company's name appears nowhere.
      const scenario = await scenarioForRound(created.id, 0);
      const raw = JSON.stringify(state);
      expect(raw).not.toContain('scenario_');
      expect(raw).not.toContain('companyName');
      expect(raw).not.toContain('actualReturnPercent');
      expect(raw).not.toContain('endingPrice');
      expect(raw).not.toContain('outcomeChart');
      expect(raw).not.toContain(JSON.stringify(scenario.companyName).slice(1, -1));

      // Nobody can start round 2 alone from the deciding phase.
      await expect(battles.setReady({ userId: userA, battleId: created.id, round: 1 }))
        .rejects.toMatchObject({ code: 'INVALID_STATE' });

      // A locks a call; B sees only a boolean, never the choice.
      state = await battles.submitDecision({
        userId: userA,
        battleId: created.id,
        roundIndex: 0,
        action: 'long',
        confidence: 'medium',
        companyGuess: 'definitely wrong guess',
      });
      expect(state.you.hasDecidedCurrentRound).toBe(true);
      expect(state.you.currentCall).toMatchObject({ action: 'long', confidence: 'medium' });
      expect(state.reveal).toBeNull();
      // Your own bankroll must not move until the round settles jointly.
      expect(state.you.bankroll).toBe(state.startingBankroll);

      const viewB = await battles.getBattleState({ userId: userB, battleId: created.id });
      expect(viewB.opponent!.hasDecidedCurrentRound).toBe(true);
      expect(viewB.opponent!.lastCall).toBeNull();
      expect(viewB.opponent!.bankroll).toBe(viewB.startingBankroll);
      const rawOpponent = JSON.stringify(viewB.opponent);
      expect(rawOpponent).not.toContain('long');
      expect(rawOpponent).not.toContain('medium');
      expect(rawOpponent).not.toContain('wrong guess');
      expect(viewB.reveal).toBeNull();

      // Duplicate and stale submissions conflict.
      await expect(
        battles.submitDecision({
          userId: userA,
          battleId: created.id,
          roundIndex: 0,
          action: 'pass',
        }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });
      await expect(
        battles.submitDecision({
          userId: userB,
          battleId: created.id,
          roundIndex: 1,
          action: 'pass',
        }),
      ).rejects.toMatchObject({ code: 'CONFLICT' });

      // B decides; the round settles for both and the reveal opens.
      state = await battles.submitDecision({
        userId: userB,
        battleId: created.id,
        roundIndex: 0,
        action: 'pass',
      });
      expect(state.roundPhase).toBe('reveal');
      expect(state.reveal).not.toBeNull();
      expect(state.reveal!.you.action).toBe('pass');
      expect(state.reveal!.opponent.action).toBe('long');
      expect(state.reveal!.companyName.length).toBeGreaterThan(0);
      expect(state.you.signalScore).toBe(-0.25);

      // Opponent progress card after the joint reveal shows the settled call.
      const viewA = await battles.getBattleState({ userId: userA, battleId: created.id });
      expect(viewA.opponent!.lastCall).toMatchObject({ action: 'pass', roundIndex: 0 });
      expect(viewA.opponent!.signalScore).toBe(-0.25);

      // Both must leave the reveal before round 2 begins.
      state = await battles.setReady({ userId: userA, battleId: created.id, round: 1 });
      expect(state.roundPhase).toBe('reveal');
      expect(state.currentRoundIndex).toBe(0);
      state = await battles.setReady({ userId: userB, battleId: created.id, round: 1 });
      expect(state.roundPhase).toBe('deciding');
      expect(state.currentRoundIndex).toBe(1);
      expect(state.roundDeadlineAt).not.toBeNull();
    });

    it('runs without deadlines when the timer is off', async () => {
      const state = await startedBattle({ timerSeconds: null });
      expect(state.roundDeadlineAt).toBeNull();
    });

    it('keeps the same absolute deadline across reconnect reads', async () => {
      const state = await startedBattle();
      const again = await battles.getBattleState({ userId: userA, battleId: state.id });
      expect(again.roundDeadlineAt).toBe(state.roundDeadlineAt);
    });

    it('turns a missed deadline into a normal Pass for the missing player only', async () => {
      const state = await startedBattle();
      await battles.submitDecision({
        userId: userA,
        battleId: state.id,
        roundIndex: 0,
        action: 'long',
        confidence: 'low',
      });
      timeOffsetMs += 61_000;
      try {
        const settled = await battles.getBattleState({ userId: userB, battleId: state.id });
        expect(settled.roundPhase).toBe('reveal');
        expect(settled.reveal!.you.action).toBe('pass');
        expect(settled.reveal!.you.wasAutoPass).toBe(true);
        expect(settled.reveal!.you.signalScoreDelta).toBe(-0.25);
        expect(settled.reveal!.opponent.action).toBe('long');
        expect(settled.reveal!.opponent.wasAutoPass).toBe(false);

        // A late submission conflicts instead of double-recording.
        await expect(
          battles.submitDecision({
            userId: userB,
            battleId: state.id,
            roundIndex: 0,
            action: 'short',
            confidence: 'high',
          }),
        ).rejects.toMatchObject({ code: 'CONFLICT' });
      } finally {
        timeOffsetMs = 0;
      }
    });

    it('ends the battle immediately when one player goes bankrupt', async () => {
      const state = await startedBattle();
      const scenario = await scenarioForRound(state.id, 0);
      const wrongDirection = Number(scenario.actualReturnPercent) > 0 ? 'short' : 'long';
      await battles.submitDecision({
        userId: userA,
        battleId: state.id,
        roundIndex: 0,
        action: wrongDirection,
        confidence: 'all_in',
      });
      const settled = await battles.submitDecision({
        userId: userB,
        battleId: state.id,
        roundIndex: 0,
        action: 'pass',
      });
      expect(settled.status).toBe('completed');
      expect(settled.summary).not.toBeNull();
      expect(settled.summary!.outcome).toBe('you_won');
      expect(settled.summary!.opponent!.isBankrupt).toBe(true);
      expect(settled.summary!.opponent!.finalBankroll).toBe(0);

      const loserView = await battles.getBattleState({ userId: userA, battleId: state.id });
      expect(loserView.summary!.outcome).toBe('you_lost');
      expect(loserView.you.isBankrupt).toBe(true);
      // The final reveal is still visible to both players.
      expect(loserView.reveal).not.toBeNull();

      // No further decisions or readies are accepted.
      await expect(
        battles.setReady({ userId: userB, battleId: state.id, round: 1 }),
      ).rejects.toMatchObject({ code: 'INVALID_STATE' });
    });

    it('resolves simultaneous bankruptcy with the shared tiebreak (draw)', async () => {
      const state = await startedBattle();
      const scenario = await scenarioForRound(state.id, 0);
      const wrongDirection = Number(scenario.actualReturnPercent) > 0 ? 'short' : 'long';
      await battles.submitDecision({
        userId: userA,
        battleId: state.id,
        roundIndex: 0,
        action: wrongDirection,
        confidence: 'all_in',
      });
      const settled = await battles.submitDecision({
        userId: userB,
        battleId: state.id,
        roundIndex: 0,
        action: wrongDirection,
        confidence: 'all_in',
      });
      expect(settled.status).toBe('completed');
      expect(settled.summary!.outcome).toBe('draw');
      expect(settled.you.isBankrupt).toBe(true);
      expect(settled.summary!.opponent!.isBankrupt).toBe(true);
    });

    it('completes a full battle and decides the winner by bankroll then Signal Score', async () => {
      // Timer off: remote-database latency must never auto-pass a scripted round.
      const state = await startedBattle({ timerSeconds: null });
      const totalRounds = state.totalRounds;
      let latest = state;
      for (let round = 0; round < totalRounds; round += 1) {
        const scenario = await scenarioForRound(state.id, round);
        const actual = Number(scenario.actualReturnPercent);
        const rightDirection = actual > 0 ? 'long' : 'short';
        // A plays every round correctly at low confidence; B always passes.
        // A's bankroll only grows (correct calls), so A must win on bankroll.
        await battles.submitDecision({
          userId: userA,
          battleId: state.id,
          roundIndex: round,
          action: actual === 0 ? 'pass' : rightDirection,
          ...(actual === 0 ? {} : { confidence: 'low' as const }),
        });
        latest = await battles.submitDecision({
          userId: userB,
          battleId: state.id,
          roundIndex: round,
          action: 'pass',
        });
        if (round < totalRounds - 1) {
          await battles.setReady({ userId: userA, battleId: state.id, round: round + 1 });
          latest = await battles.setReady({ userId: userB, battleId: state.id, round: round + 1 });
        }
      }
      expect(latest.status).toBe('completed');
      const viewA = await battles.getBattleState({ userId: userA, battleId: state.id });
      expect(viewA.summary!.outcome).toBe('you_won');
      expect(viewA.summary!.rounds).toHaveLength(totalRounds);
      const viewB = await battles.getBattleState({ userId: userB, battleId: state.id });
      expect(viewB.summary!.outcome).toBe('you_lost');
      expect(viewB.you.signalScore).toBeCloseTo(-0.25 * totalRounds, 6);
    }, 120_000);

    it('expires unfinished battles 24 hours after creation with no winner', async () => {
      const created = await battles.createBattle({
        userId: userA,
        difficulty: 'easy',
        timerSeconds: 60,
      });
      timeOffsetMs = 24 * 3_600_000 + 1_000;
      try {
        const expired = await battles.getBattleState({ userId: userA, battleId: created.id });
        expect(expired.status).toBe('expired');
        expect(expired.summary!.outcome).toBe('expired');
        await expect(
          battles.joinBattle({ userId: userB, inviteCode: created.inviteCode! }),
        ).rejects.toMatchObject({ code: 'INVALID_STATE' });
        const preview = await battles.getInvitePreview({
          userId: userB,
          inviteCode: created.inviteCode!,
        });
        expect(preview.status).toBe('expired');
        expect(preview.joinable).toBe(false);
      } finally {
        timeOffsetMs = 0;
      }
    });

    it('lists battles for both participants', async () => {
      const listA = await battles.listBattles({ userId: userA });
      expect(listA.length).toBeGreaterThan(0);
      const listB = await battles.listBattles({ userId: userB });
      expect(listB.length).toBeGreaterThan(0);
      expect(listB.every((entry) => typeof entry.status === 'string')).toBe(true);
    });
  });
});
