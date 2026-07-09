import { describe, expect, it } from 'vitest';
import { calculateLeaderboardTiebreakers } from '../src/leaderboard';

describe('calculateLeaderboardTiebreakers', () => {
  it('builds sortKey and named fields for bankroll → signal → correct → fewer passes → faster completion', () => {
    const result = calculateLeaderboardTiebreakers({
      finalBankroll: 15000,
      signalScore: 12.5,
      correctCalls: 8,
      passes: 3,
      completionTimeMs: 120000,
    });

    expect(result.finalBankroll).toBe(15000);
    expect(result.signalScore).toBe(12.5);
    expect(result.correctCalls).toBe(8);
    expect(result.fewerPasses).toBe(-3);
    expect(result.fasterCompletion).toBe(-120000);
    expect(result.sortKey).toEqual([15000, 12.5, 8, -3, -120000]);
    expect(result.sortKey[0]).toBe(result.finalBankroll);
    expect(result.sortKey[1]).toBe(result.signalScore);
    expect(result.sortKey[2]).toBe(result.correctCalls);
    expect(result.sortKey[3]).toBe(result.fewerPasses);
    expect(result.sortKey[4]).toBe(result.fasterCompletion);
  });

  it('throws when any input number is not finite', () => {
    const base = {
      finalBankroll: 10000,
      signalScore: 5,
      correctCalls: 4,
      passes: 1,
      completionTimeMs: 1000,
    };

    expect(() =>
      calculateLeaderboardTiebreakers({ ...base, finalBankroll: Number.NaN }),
    ).toThrow('finalBankroll must be a finite number.');
    expect(() =>
      calculateLeaderboardTiebreakers({ ...base, signalScore: Number.POSITIVE_INFINITY }),
    ).toThrow('signalScore must be a finite number.');
    expect(() =>
      calculateLeaderboardTiebreakers({ ...base, correctCalls: Number.NaN }),
    ).toThrow('correctCalls must be a finite number.');
  });

  it('throws when passes, correctCalls, or completionTimeMs are negative', () => {
    const base = {
      finalBankroll: 10000,
      signalScore: 5,
      correctCalls: 4,
      passes: 1,
      completionTimeMs: 1000,
    };

    expect(() => calculateLeaderboardTiebreakers({ ...base, passes: -1 })).toThrow(
      'passes must be >= 0.',
    );
    expect(() => calculateLeaderboardTiebreakers({ ...base, correctCalls: -1 })).toThrow(
      'correctCalls must be >= 0.',
    );
    expect(() => calculateLeaderboardTiebreakers({ ...base, completionTimeMs: -1 })).toThrow(
      'completionTimeMs must be >= 0.',
    );
  });
});
