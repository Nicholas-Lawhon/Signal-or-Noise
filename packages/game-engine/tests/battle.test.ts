import { describe, expect, it } from 'vitest';
import {
  BATTLE_DEFAULT_TIMER_SECONDS,
  BATTLE_EXPIRY_HOURS,
  BATTLE_TIMER_OPTIONS,
  decideBattleVerdict,
  isBattleTimerSeconds,
} from '../src/battle';
import type { BattlePlayerFinalState } from '../src/types';

function player(
  finalBankroll: number,
  signalScore: number,
  isBankrupt = false,
): BattlePlayerFinalState {
  return { finalBankroll, signalScore, isBankrupt };
}

describe('battle timer configuration (D052)', () => {
  it('offers off, 30, 60, and 120 seconds with a 60-second default', () => {
    expect(BATTLE_TIMER_OPTIONS).toEqual([null, 30, 60, 120]);
    expect(BATTLE_DEFAULT_TIMER_SECONDS).toBe(60);
    expect(BATTLE_EXPIRY_HOURS).toBe(24);
  });

  it('validates timer values', () => {
    expect(isBattleTimerSeconds(null)).toBe(true);
    expect(isBattleTimerSeconds(60)).toBe(true);
    expect(isBattleTimerSeconds(45)).toBe(false);
    expect(isBattleTimerSeconds('60')).toBe(false);
    expect(isBattleTimerSeconds(undefined)).toBe(false);
  });
});

describe('decideBattleVerdict (D052)', () => {
  it('awards the higher final bankroll', () => {
    expect(decideBattleVerdict(player(12000, 1), player(9000, 20))).toBe('a');
    expect(decideBattleVerdict(player(9000, 20), player(12000, 1))).toBe('b');
  });

  it('breaks equal bankroll with Signal Score', () => {
    expect(decideBattleVerdict(player(10000, 5), player(10000, 3))).toBe('a');
    expect(decideBattleVerdict(player(10000, -2), player(10000, 0))).toBe('b');
  });

  it('draws when bankroll and Signal Score are both equal', () => {
    expect(decideBattleVerdict(player(10000, 4), player(10000, 4))).toBe('draw');
  });

  it('awards the other player when exactly one goes bankrupt', () => {
    expect(decideBattleVerdict(player(0, 30, true), player(500, -10))).toBe('b');
    expect(decideBattleVerdict(player(500, -10), player(0, 30, true))).toBe('a');
  });

  it('resolves simultaneous bankruptcy by bankroll, then Signal Score, then draw', () => {
    // Bankruptcy floor is $1, so a bankrupt bankroll can still be nonzero.
    expect(decideBattleVerdict(player(0.8, 1, true), player(0, 5, true))).toBe('a');
    expect(decideBattleVerdict(player(0, 5, true), player(0, 2, true))).toBe('a');
    expect(decideBattleVerdict(player(0, 2, true), player(0, 5, true))).toBe('b');
    expect(decideBattleVerdict(player(0, 3, true), player(0, 3, true))).toBe('draw');
  });
});
