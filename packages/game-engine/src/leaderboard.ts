import type { LeaderboardTiebreakerInput, LeaderboardTiebreakers } from './types';

function assertNonNegativeFinite(value: number, name: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${name} must be a finite number.`);
  }
  if (value < 0) {
    throw new Error(`${name} must be >= 0.`);
  }
}

export function calculateLeaderboardTiebreakers(
  input: LeaderboardTiebreakerInput,
): LeaderboardTiebreakers {
  if (!Number.isFinite(input.finalBankroll)) {
    throw new Error('finalBankroll must be a finite number.');
  }
  if (!Number.isFinite(input.signalScore)) {
    throw new Error('signalScore must be a finite number.');
  }
  assertNonNegativeFinite(input.correctCalls, 'correctCalls');
  assertNonNegativeFinite(input.passes, 'passes');
  assertNonNegativeFinite(input.completionTimeMs, 'completionTimeMs');

  const fewerPasses = -input.passes;
  const fasterCompletion = -input.completionTimeMs;

  return {
    finalBankroll: input.finalBankroll,
    signalScore: input.signalScore,
    correctCalls: input.correctCalls,
    fewerPasses,
    fasterCompletion,
    sortKey: [
      input.finalBankroll,
      input.signalScore,
      input.correctCalls,
      fewerPasses,
      fasterCompletion,
    ],
  };
}
