import type { Confidence, Difficulty } from './types';

export const CONFIDENCE_CONFIG = {
  low: { label: 'Low', bankrollPercent: 0.1, signalScoreValue: 1 },
  medium: { label: 'Medium', bankrollPercent: 0.4, signalScoreValue: 2 },
  high: { label: 'High', bankrollPercent: 0.7, signalScoreValue: 3 },
  all_in: { label: 'All-In', bankrollPercent: 1.0, signalScoreValue: 5 },
} as const;

export function calculateStake(currentBankroll: number, confidence: Confidence): number {
  return currentBankroll * CONFIDENCE_CONFIG[confidence].bankrollPercent;
}

export const STARTING_BANKROLL: Record<Difficulty, number> = {
  easy: 12500,
  medium: 10000,
  hard: 7500,
};

export const CLASSIC_RUN_ROUNDS = 20;

export const GUESS_CORRECT_BONUS = 2;
export const GUESS_WRONG_PENALTY = -1;
export const BANKRUPTCY_FLOOR = 1;
