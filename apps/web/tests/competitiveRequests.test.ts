import { describe, expect, it } from 'vitest';
import {
  battleDecisionRequestSchema,
  battleReadyRequestSchema,
  createBattleRequestSchema,
  draftSelectionRequestSchema,
  inviteCodeRequestSchema,
} from '../lib/server/requests';

describe('Phase 9A web boundary request schemas', () => {
  it('accepts exactly three distinct draft slots', () => {
    expect(draftSelectionRequestSchema.safeParse({ slots: [0, 3, 5] }).success).toBe(true);
  });

  it('rejects malformed draft selections and smuggled fields', () => {
    for (const spoof of [
      { slots: [0, 1] },
      { slots: [0, 1, 2, 3] },
      { slots: [0, 1, 1] },
      { slots: [0, 1, 6] },
      { slots: [0, 1, -1] },
      { slots: [0, 1, 2.5] },
      { slots: ['scenario_tesla_2020_2021', 0, 1] },
      { slots: [0, 1, 2], scenarioIds: ['scenario_tesla_2020_2021'] },
      { slots: [0, 1, 2], finalValue: 999999 },
      { slots: [0, 1, 2], userId: 'someone_else' },
    ]) {
      expect(draftSelectionRequestSchema.safeParse(spoof).success).toBe(false);
    }
  });

  it('accepts battle creation with D052 timers and defaults to 60 seconds', () => {
    for (const timerSeconds of [null, 30, 60, 120]) {
      expect(
        createBattleRequestSchema.safeParse({ difficulty: 'medium', timerSeconds }).success,
      ).toBe(true);
    }
    const defaulted = createBattleRequestSchema.safeParse({ difficulty: 'easy' });
    expect(defaulted.success).toBe(true);
    if (defaulted.success) expect(defaulted.data.timerSeconds).toBe(60);
  });

  it('rejects invalid timers and smuggled battle fields', () => {
    for (const spoof of [
      { difficulty: 'easy', timerSeconds: 45 },
      { difficulty: 'easy', timerSeconds: '60' },
      { difficulty: 'easy', timerSeconds: 0 },
      { difficulty: 'expert' },
      { difficulty: 'easy', opponentId: 'someone_else' },
      { difficulty: 'easy', scenarioOrder: [] },
      { difficulty: 'easy', startingBankroll: 999999 },
    ]) {
      expect(createBattleRequestSchema.safeParse(spoof).success).toBe(false);
    }
  });

  it('validates opaque invite codes', () => {
    expect(inviteCodeRequestSchema.safeParse('a'.repeat(32)).success).toBe(true);
    expect(inviteCodeRequestSchema.safeParse('0123456789abcdef0123456789abcdef').success).toBe(true);
    for (const bad of ['short', 'g'.repeat(32), 'A'.repeat(32), '', 'a'.repeat(33)]) {
      expect(inviteCodeRequestSchema.safeParse(bad).success).toBe(false);
    }
  });

  it('validates ready and decision payloads', () => {
    expect(battleReadyRequestSchema.safeParse({ round: 0 }).success).toBe(true);
    expect(battleReadyRequestSchema.safeParse({ round: -1 }).success).toBe(false);
    expect(battleReadyRequestSchema.safeParse({ round: 1, userId: 'x' }).success).toBe(false);

    expect(battleDecisionRequestSchema.safeParse({
      roundIndex: 2,
      action: 'short',
      confidence: 'all_in',
      companyGuess: 'Netflix',
    }).success).toBe(true);
    for (const spoof of [
      { roundIndex: 0, action: 'pass', bankrollAfter: 999999 },
      { roundIndex: 0, action: 'buy' },
      { roundIndex: 0, action: 'long', confidence: 'max' },
      { roundIndex: 0, action: 'pass', userId: 'someone_else' },
    ]) {
      expect(battleDecisionRequestSchema.safeParse(spoof).success).toBe(false);
    }
  });
});
