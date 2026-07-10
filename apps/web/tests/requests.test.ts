import { describe, expect, it } from 'vitest';
import {
  createClassicRunRequestSchema,
  leaderboardRequestInput,
  leaderboardRequestSchema,
  parseEmptyMutationRequest,
  publicDisplayNameRequestSchema,
  submitDecisionRequestSchema,
} from '../lib/server/requests';

describe('web boundary request schemas', () => {
  it('accepts a plain classic run request', () => {
    expect(createClassicRunRequestSchema.safeParse({ difficulty: 'easy' }).success).toBe(true);
  });

  it('rejects request-supplied identity and official-status fields', () => {
    for (const spoof of [
      { difficulty: 'easy', userId: 'someone_else' },
      { difficulty: 'easy', guestSessionId: '2c52a2f6-4b6c-4b1c-9a52-58f4b3fdd6a1' },
      { difficulty: 'easy', externalAuthId: 'clerk_x' },
      { difficulty: 'easy', isOfficial: true },
      { difficulty: 'easy', owner: { kind: 'user', userId: 'x' } },
    ]) {
      expect(createClassicRunRequestSchema.safeParse(spoof).success).toBe(false);
    }
  });

  it('accepts a valid decision and rejects smuggled score or identity fields', () => {
    expect(submitDecisionRequestSchema.safeParse({
      roundIndex: 0,
      action: 'long',
      confidence: 'medium',
      companyGuess: 'Netflix',
    }).success).toBe(true);

    for (const spoof of [
      { roundIndex: 0, action: 'pass', currentBankroll: 999999 },
      { roundIndex: 0, action: 'pass', signalScore: 50 },
      { roundIndex: 0, action: 'pass', userId: 'someone_else' },
      { roundIndex: 0, action: 'pass', isOfficial: true },
      { roundIndex: 0, action: 'pass', actualReturnPercent: 5 },
    ]) {
      expect(submitDecisionRequestSchema.safeParse(spoof).success).toBe(false);
    }
  });

  it('rejects malformed decisions', () => {
    expect(submitDecisionRequestSchema.safeParse({ roundIndex: -1, action: 'long', confidence: 'low' }).success).toBe(false);
    expect(submitDecisionRequestSchema.safeParse({ roundIndex: 0, action: 'buy' }).success).toBe(false);
    expect(submitDecisionRequestSchema.safeParse(null).success).toBe(false);
  });

  it('accepts empty mutation requests and rejects spoofed identity bodies', async () => {
    await expect(parseEmptyMutationRequest(new Request('http://local.test', {
      method: 'POST',
    }))).resolves.toBe(true);
    await expect(parseEmptyMutationRequest(new Request('http://local.test', {
      method: 'POST',
      body: '{}',
    }))).resolves.toBe(true);
    await expect(parseEmptyMutationRequest(new Request('http://local.test', {
      method: 'POST',
      body: JSON.stringify({ userId: 'spoofed' }),
    }))).resolves.toBe(false);
    await expect(parseEmptyMutationRequest(new Request('http://local.test', {
      method: 'POST',
      body: '{not-json',
    }))).resolves.toBe(false);
  });

  it('normalizes valid leaderboard filters with safe defaults', () => {
    const daily = leaderboardRequestSchema.parse(leaderboardRequestInput(
      new URLSearchParams(),
      '2026-07-10',
    ));
    expect(daily).toEqual({
      board: 'daily',
      date: '2026-07-10',
      page: 1,
      pageSize: 25,
    });
    expect(leaderboardRequestSchema.parse(leaderboardRequestInput(
      new URLSearchParams('board=classic&difficulty=hard&page=2&pageSize=10'),
    ))).toEqual({ board: 'classic', difficulty: 'hard', page: 2, pageSize: 10 });
    expect(leaderboardRequestSchema.parse(leaderboardRequestInput(
      new URLSearchParams('board=signal&page=3'),
    ))).toEqual({ board: 'signal', page: 3, pageSize: 25 });
  });

  it('rejects malformed, inapplicable, and identity-spoofing leaderboard filters', () => {
    for (const query of [
      'board=daily&date=2026-02-30',
      'board=classic&difficulty=easy&date=2026-07-10',
      'board=signal&difficulty=hard',
      'board=classic&difficulty=easy&page=0',
      'board=classic&difficulty=easy&pageSize=51',
      'board=classic&difficulty=easy&userId=spoofed',
      'board=signal&isOfficial=true',
      'board=signal&score=999999',
    ]) {
      const parsed = leaderboardRequestSchema.safeParse(
        leaderboardRequestInput(new URLSearchParams(query), '2026-07-10'),
      );
      expect(parsed.success, query).toBe(false);
    }
  });

  it('accepts public names or alias fallback and rejects spoofing or reserved aliases', () => {
    expect(publicDisplayNameRequestSchema.safeParse({ displayName: 'Signal Star' }).success)
      .toBe(true);
    expect(publicDisplayNameRequestSchema.safeParse({ displayName: null }).success).toBe(true);
    for (const body of [
      { displayName: 'ab' },
      { displayName: 'Player-1A2B' },
      { displayName: 'bad!' },
      { displayName: 'Signal Star', userId: 'spoofed' },
      { alias: 'Player-FAKE', displayName: null },
    ]) {
      expect(publicDisplayNameRequestSchema.safeParse(body).success).toBe(false);
    }
  });
});
