import type {
  DraftPoolEntry,
  DraftResult,
  DraftWindow,
  DraftWindowCandidate,
} from './types';

export const DRAFT_BUDGET = 10000;
export const DRAFT_POOL_SIZE = 6;
export const DRAFT_PICKS = 3;

/**
 * Final value of an equal-split portfolio: the budget is divided equally
 * across the picks and each slice moves by its company's actual return.
 * Slice values are floored at $0 so a catastrophic return cannot push the
 * portfolio negative (returns below -100% do not exist in real equity data,
 * but pure math should not trust its inputs).
 */
export function portfolioFinalValue(
  returns: readonly number[],
  budget: number = DRAFT_BUDGET,
): number {
  if (returns.length === 0) throw new Error('Portfolio needs at least one pick.');
  if (!Number.isFinite(budget) || budget <= 0) throw new Error('Budget must be positive.');
  const slice = budget / returns.length;
  return returns.reduce((total, r) => total + Math.max(0, slice * (1 + r)), 0);
}

/**
 * Computes the selected portfolio's final value, the optimal three picks, and
 * the gap from optimal for one immutable six-company pool. Pure and
 * deterministic: optimal ties resolve by return descending, then scenarioId
 * ascending, so replays of the same pool always report the same optimum.
 */
export function computeDraftResult(
  pool: readonly DraftPoolEntry[],
  selectedScenarioIds: readonly string[],
): DraftResult {
  if (pool.length !== DRAFT_POOL_SIZE) {
    throw new Error(`Draft pool must contain exactly ${DRAFT_POOL_SIZE} companies.`);
  }
  const poolIds = new Set(pool.map((entry) => entry.scenarioId));
  if (poolIds.size !== pool.length) {
    throw new Error('Draft pool contains duplicate scenarios.');
  }
  if (selectedScenarioIds.length !== DRAFT_PICKS) {
    throw new Error(`Draft selection must contain exactly ${DRAFT_PICKS} companies.`);
  }
  const selected = new Set(selectedScenarioIds);
  if (selected.size !== DRAFT_PICKS) {
    throw new Error('Draft selection contains duplicate companies.');
  }
  for (const id of selected) {
    if (!poolIds.has(id)) {
      throw new Error('Draft selection includes a company outside this draft.');
    }
  }

  const byId = new Map(pool.map((entry) => [entry.scenarioId, entry]));
  const selectedReturns = selectedScenarioIds.map(
    (id) => byId.get(id)!.actualReturnPercent,
  );
  const finalValue = portfolioFinalValue(selectedReturns);

  const ranked = [...pool].sort(
    (a, b) =>
      b.actualReturnPercent - a.actualReturnPercent ||
      a.scenarioId.localeCompare(b.scenarioId),
  );
  const optimal = ranked.slice(0, DRAFT_PICKS);
  const optimalValue = portfolioFinalValue(
    optimal.map((entry) => entry.actualReturnPercent),
  );

  return {
    budget: DRAFT_BUDGET,
    selectedScenarioIds: [...selectedScenarioIds],
    finalValue,
    optimalScenarioIds: optimal.map((entry) => entry.scenarioId),
    optimalValue,
    gapFromOptimal: optimalValue - finalValue,
  };
}

/**
 * Groups scenarios into compatible historical windows (D052): a window is a
 * set of scenarios whose [decisionDate, endDate) holding periods all cover at
 * least one common calendar date, so every drafted company was live over the
 * same slice of history. Dates are ISO `YYYY-MM-DD` strings compared
 * lexicographically. Returns maximal distinct windows with at least
 * DRAFT_POOL_SIZE members, sorted by window start.
 */
export function findDraftWindows(
  candidates: readonly DraftWindowCandidate[],
): DraftWindow[] {
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  for (const candidate of candidates) {
    if (!iso.test(candidate.decisionDate) || !iso.test(candidate.endDate)) {
      throw new Error('Draft window candidates need ISO YYYY-MM-DD dates.');
    }
    if (candidate.decisionDate >= candidate.endDate) {
      throw new Error('Draft window candidates need decisionDate before endDate.');
    }
  }

  const windows = new Map<string, DraftWindow>();
  // Any maximal overlap set is exactly the set of intervals covering some
  // decisionDate, so sweeping decision dates finds every candidate window.
  for (const anchor of candidates) {
    const covering = candidates.filter(
      (c) => c.decisionDate <= anchor.decisionDate && c.endDate > anchor.decisionDate,
    );
    if (covering.length < DRAFT_POOL_SIZE) continue;
    const scenarioIds = covering.map((c) => c.scenarioId).sort();
    const key = scenarioIds.join('|');
    if (windows.has(key)) continue;
    windows.set(key, {
      scenarioIds,
      windowStart: covering.reduce(
        (max, c) => (c.decisionDate > max ? c.decisionDate : max),
        covering[0].decisionDate,
      ),
      windowEnd: covering.reduce(
        (min, c) => (c.endDate < min ? c.endDate : min),
        covering[0].endDate,
      ),
    });
  }
  return [...windows.values()].sort(
    (a, b) =>
      a.windowStart.localeCompare(b.windowStart) ||
      a.windowEnd.localeCompare(b.windowEnd),
  );
}
