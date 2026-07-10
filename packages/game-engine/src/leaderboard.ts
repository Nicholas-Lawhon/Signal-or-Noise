import type {
  BankrollRankMetrics,
  LeaderboardTiebreakerInput,
  LeaderboardTiebreakers,
  SignalRankMetrics,
} from './types';

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

function descending(left: number, right: number): number {
  return right - left;
}

function ascending(left: number, right: number): number {
  return left - right;
}

/** Locked bankroll ordering: bankroll, Signal Score, correct calls, fewer passes, speed. */
export function compareBankrollRankMetrics(
  left: BankrollRankMetrics,
  right: BankrollRankMetrics,
): number {
  return descending(left.finalBankroll, right.finalBankroll)
    || descending(left.signalScore, right.signalScore)
    || descending(left.correctCalls, right.correctCalls)
    || ascending(left.passes, right.passes)
    || ascending(left.completionTimeMs, right.completionTimeMs);
}

export function areBankrollRanksTied(
  left: BankrollRankMetrics,
  right: BankrollRankMetrics,
): boolean {
  return compareBankrollRankMetrics(left, right) === 0;
}

/** D050 cumulative Signal ordering: score, correct calls, fewer passes, attainment. */
export function compareSignalRankMetrics(
  left: SignalRankMetrics,
  right: SignalRankMetrics,
): number {
  return descending(left.signalScore, right.signalScore)
    || descending(left.correctCalls, right.correctCalls)
    || ascending(left.passes, right.passes)
    || ascending(left.attainedAtMs, right.attainedAtMs);
}

export function areSignalRanksTied(
  left: SignalRankMetrics,
  right: SignalRankMetrics,
): boolean {
  return compareSignalRankMetrics(left, right) === 0;
}

/** Assigns competition ranks to an already-sorted list: 1, 2, 2, 4. */
export function assignCompetitionRanks<T>(
  sorted: readonly T[],
  areTied: (left: T, right: T) => boolean,
): Array<{ item: T; rank: number }> {
  let currentRank = 0;
  return sorted.map((item, index) => {
    if (index === 0 || !areTied(sorted[index - 1], item)) currentRank = index + 1;
    return { item, rank: currentRank };
  });
}
