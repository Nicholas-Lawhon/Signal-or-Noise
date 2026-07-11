import type { BattlePlayerFinalState, BattleTimerSeconds, BattleVerdict } from './types';

/** Per-round timer choices (D052). `null` means the timer is off. */
export const BATTLE_TIMER_OPTIONS: readonly BattleTimerSeconds[] = [null, 30, 60, 120];
export const BATTLE_DEFAULT_TIMER_SECONDS = 60;
/** Unfinished battles expire this long after creation with no winner (D052). */
export const BATTLE_EXPIRY_HOURS = 24;

export function isBattleTimerSeconds(value: unknown): value is BattleTimerSeconds {
  return BATTLE_TIMER_OPTIONS.includes(value as BattleTimerSeconds);
}

/**
 * Decides a settled battle (D052): highest final bankroll wins; equal
 * bankroll falls to Signal Score; equality on both is a draw. Bankruptcy is
 * resolved with the same rule — a single bankrupt player always loses because
 * the opponent's bankroll is above the floor, and simultaneous bankruptcy
 * lands on the bankroll-then-Signal-Score tiebreak and may draw.
 */
export function decideBattleVerdict(
  a: BattlePlayerFinalState,
  b: BattlePlayerFinalState,
): BattleVerdict {
  if (a.isBankrupt !== b.isBankrupt) return a.isBankrupt ? 'b' : 'a';
  if (a.finalBankroll !== b.finalBankroll) {
    return a.finalBankroll > b.finalBankroll ? 'a' : 'b';
  }
  if (a.signalScore !== b.signalScore) return a.signalScore > b.signalScore ? 'a' : 'b';
  return 'draw';
}
