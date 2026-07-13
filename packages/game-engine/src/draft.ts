import type {
  DraftFormat,
  DraftFormatConfig,
  DraftPoolEntry,
  DraftResult,
  DraftWindow,
  DraftWindowCandidate,
} from './types';

export const DRAFT_BUDGET = 10000;
export const DRAFT_POOL_SIZE = 6;
export const DRAFT_PICKS = 3;
export const DRAFT_ALLOCATION_STEP = 10;
export const DRAFT_MIN_ALLOCATION = 10;
export const DRAFT_MAX_ALLOCATION = 60;

export const DRAFT_FORMATS: Readonly<Record<DraftFormat, DraftFormatConfig>> = {
  classic: { format: 'classic', poolSize: 6, picks: 3 },
  quick: { format: 'quick', poolSize: 4, picks: 2 },
  era: { format: 'era', poolSize: 6, picks: 3 },
};

export function getDraftFormatConfig(format: DraftFormat): DraftFormatConfig {
  return DRAFT_FORMATS[format];
}

/** The nearest valid 10% allocation to an equal split. */
export function equalWeightAllocations(picks: number): number[] {
  if (!Number.isInteger(picks) || picks < 1 || picks > 6) {
    throw new Error('Draft pick count must be between one and six.');
  }
  const base = Math.floor(100 / picks / DRAFT_ALLOCATION_STEP) * DRAFT_ALLOCATION_STEP;
  const allocations = Array.from({ length: picks }, () => base);
  const remainder = 100 - base * picks;
  if (remainder > 0) allocations[picks - 1] += remainder;
  return allocations;
}

export function isValidDraftAllocation(
  allocations: readonly number[],
  picks: number,
): boolean {
  return allocations.length === picks
    && allocations.every((value) => Number.isInteger(value)
      && value >= DRAFT_MIN_ALLOCATION
      && value <= DRAFT_MAX_ALLOCATION
      && value % DRAFT_ALLOCATION_STEP === 0)
    && allocations.reduce((sum, value) => sum + value, 0) === 100;
}

function assertDraftAllocation(allocations: readonly number[], picks: number): void {
  if (!isValidDraftAllocation(allocations, picks)) {
    throw new Error(
      `Draft allocations must contain ${picks} values from 10%-60% in 10% increments and total 100%.`,
    );
  }
}

/**
 * Legacy equal-split value used by the original D052 Draft. New D055 callers
 * should use weightedDraftFinalValue through computeDraftResult allocations.
 */
export function portfolioFinalValue(
  returns: readonly number[],
  budget: number = DRAFT_BUDGET,
): number {
  if (returns.length === 0) throw new Error('Portfolio needs at least one pick.');
  if (!Number.isFinite(budget) || budget <= 0) throw new Error('Budget must be positive.');
  const slice = budget / returns.length;
  return returns.reduce((total, actualReturnPercent) =>
    total + Math.max(0, slice * (1 + actualReturnPercent)), 0);
}

/** Calculates a D055 weighted portfolio with non-negative per-company slices. */
export function weightedDraftFinalValue(
  returns: readonly number[],
  allocations: readonly number[],
  budget: number = DRAFT_BUDGET,
): number {
  if (returns.length === 0) throw new Error('Portfolio needs at least one pick.');
  if (!Number.isFinite(budget) || budget <= 0) throw new Error('Budget must be positive.');
  assertDraftAllocation(allocations, returns.length);
  return returns.reduce((total, actualReturnPercent, index) =>
    total + Math.max(0, budget * (allocations[index] / 100) * (1 + actualReturnPercent)), 0);
}

function inferFormat(poolSize: number, explicit?: DraftFormat): DraftFormat {
  if (explicit) {
    const config = getDraftFormatConfig(explicit);
    if (config.poolSize !== poolSize) {
      throw new Error(`${explicit} Draft pools must contain exactly ${config.poolSize} companies.`);
    }
    return explicit;
  }
  if (poolSize === 4) return 'quick';
  if (poolSize === 6) return 'classic';
  throw new Error('Draft pool must contain four or six companies.');
}

function combinations<T>(values: readonly T[], count: number): T[][] {
  const result: T[][] = [];
  const visit = (start: number, current: T[]): void => {
    if (current.length === count) {
      result.push([...current]);
      return;
    }
    for (let index = start; index <= values.length - (count - current.length); index += 1) {
      current.push(values[index]);
      visit(index + 1, current);
      current.pop();
    }
  };
  visit(0, []);
  return result;
}

function allocationVectors(picks: number): number[][] {
  const result: number[][] = [];
  const visit = (index: number, remaining: number, current: number[]): void => {
    if (index === picks - 1) {
      if (remaining >= DRAFT_MIN_ALLOCATION && remaining <= DRAFT_MAX_ALLOCATION) {
        result.push([...current, remaining]);
      }
      return;
    }
    for (
      let value = DRAFT_MIN_ALLOCATION;
      value <= DRAFT_MAX_ALLOCATION && value <= remaining - DRAFT_MIN_ALLOCATION * (picks - index - 1);
      value += DRAFT_ALLOCATION_STEP
    ) {
      visit(index + 1, remaining - value, [...current, value]);
    }
  };
  visit(0, 100, []);
  return result;
}

function candidateKey(scenarioIds: readonly string[], allocations: readonly number[]): string {
  return `${scenarioIds.join('|')}::${allocations.join(',')}`;
}

function compareCandidates(
  left: { value: number; scenarioIds: readonly string[]; allocations: readonly number[] },
  right: { value: number; scenarioIds: readonly string[]; allocations: readonly number[] },
): number {
  if (Math.abs(left.value - right.value) > 1e-9) return right.value - left.value;
  return candidateKey(left.scenarioIds, left.allocations)
    .localeCompare(candidateKey(right.scenarioIds, right.allocations));
}

function parseResultOptions(
  allocationsOrOptions: readonly number[] | { allocations?: readonly number[]; format?: DraftFormat } | undefined,
  explicitFormat?: DraftFormat,
): { allocations?: readonly number[]; format?: DraftFormat; legacyEqual: boolean } {
  if (Array.isArray(allocationsOrOptions)) {
    return { allocations: allocationsOrOptions, format: explicitFormat, legacyEqual: false };
  }
  const objectOptions = allocationsOrOptions as { allocations?: readonly number[]; format?: DraftFormat } | undefined;
  if (objectOptions) {
    return {
      allocations: objectOptions.allocations,
      format: objectOptions.format ?? explicitFormat,
      legacyEqual: false,
    };
  }
  return { format: explicitFormat, legacyEqual: true };
}

/**
 * Calculates a weighted Draft result. Omitting allocations intentionally keeps
 * the original D052 equal-split behavior for old saved/replayed clients; all
 * D055 submissions pass an explicit 10% allocation vector.
 */
export function computeDraftResult(
  pool: readonly DraftPoolEntry[],
  selectedScenarioIds: readonly string[],
  allocationsOrOptions?: readonly number[] | { allocations?: readonly number[]; format?: DraftFormat },
  explicitFormat?: DraftFormat,
): DraftResult {
  const options = parseResultOptions(allocationsOrOptions, explicitFormat);
  const format = inferFormat(pool.length, options.format);
  const config = getDraftFormatConfig(format);
  if (pool.length !== config.poolSize) {
    throw new Error(`Draft pool must contain exactly ${config.poolSize} companies.`);
  }
  const poolIds = new Set(pool.map((entry) => entry.scenarioId));
  if (poolIds.size !== pool.length) throw new Error('Draft pool contains duplicate scenarios.');
  if (selectedScenarioIds.length !== config.picks) {
    throw new Error(`Draft selection must contain exactly ${config.picks} companies.`);
  }
  const selected = new Set(selectedScenarioIds);
  if (selected.size !== config.picks) throw new Error('Draft selection contains duplicate companies.');
  for (const id of selected) {
    if (!poolIds.has(id)) throw new Error('Draft selection includes a company outside this draft.');
  }

  const selectedAllocations = options.legacyEqual
    ? equalWeightAllocations(config.picks).map((value) => value / 100 * 100)
    : [...(options.allocations ?? equalWeightAllocations(config.picks))];
  if (options.legacyEqual) {
    // The old API allowed fractional equal slices, so use a separate value
    // path while still reporting the nearest valid vector for new consumers.
    const byId = new Map(pool.map((entry) => [entry.scenarioId, entry]));
    const selectedReturns = selectedScenarioIds.map((id) => byId.get(id)!.actualReturnPercent);
    const finalValue = portfolioFinalValue(selectedReturns);
    const ranked = [...pool].sort((a, b) =>
      b.actualReturnPercent - a.actualReturnPercent || a.scenarioId.localeCompare(b.scenarioId));
    const optimal = ranked.slice(0, config.picks);
    const optimalValue = portfolioFinalValue(optimal.map((entry) => entry.actualReturnPercent));
    return {
      budget: DRAFT_BUDGET,
      format,
      selectedScenarioIds: [...selectedScenarioIds],
      selectedAllocations,
      finalValue,
      optimalScenarioIds: optimal.map((entry) => entry.scenarioId),
      optimalAllocations: equalWeightAllocations(config.picks),
      optimalValue,
      gapFromOptimal: optimalValue - finalValue,
    };
  }

  assertDraftAllocation(selectedAllocations, config.picks);
  const byId = new Map(pool.map((entry) => [entry.scenarioId, entry]));
  const selectedValue = weightedDraftFinalValue(
    selectedScenarioIds.map((id) => byId.get(id)!.actualReturnPercent),
    selectedAllocations,
  );
  const allocationCandidates = allocationVectors(config.picks);
  let optimal = { value: Number.NEGATIVE_INFINITY, scenarioIds: [] as string[], allocations: [] as number[] };
  for (const candidateSelection of combinations(pool, config.picks)) {
    const ids = candidateSelection.map((entry) => entry.scenarioId);
    for (const candidateAllocations of allocationCandidates) {
      const candidate = {
        value: weightedDraftFinalValue(
          candidateSelection.map((entry) => entry.actualReturnPercent),
          candidateAllocations,
        ),
        scenarioIds: ids,
        allocations: candidateAllocations,
      };
      if (compareCandidates(candidate, optimal) < 0) optimal = candidate;
    }
  }
  return {
    budget: DRAFT_BUDGET,
    format,
    selectedScenarioIds: [...selectedScenarioIds],
    selectedAllocations: [...selectedAllocations],
    finalValue: selectedValue,
    optimalScenarioIds: optimal.scenarioIds,
    optimalAllocations: optimal.allocations,
    optimalValue: optimal.value,
    gapFromOptimal: optimal.value - selectedValue,
  };
}

/**
 * Groups scenarios into compatible historical windows. Dates are ISO
 * YYYY-MM-DD strings and holding intervals are treated as [start, end).
 */
export function findDraftWindows(
  candidates: readonly DraftWindowCandidate[],
  minimumPoolSize: number = DRAFT_POOL_SIZE,
): DraftWindow[] {
  if (!Number.isInteger(minimumPoolSize) || minimumPoolSize < 1) {
    throw new Error('Draft window pool size must be a positive integer.');
  }
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
  for (const anchor of candidates) {
    const covering = candidates.filter((candidate) =>
      candidate.decisionDate <= anchor.decisionDate && candidate.endDate > anchor.decisionDate);
    if (covering.length < minimumPoolSize) continue;
    const scenarioIds = covering.map((candidate) => candidate.scenarioId).sort();
    const key = scenarioIds.join('|');
    if (windows.has(key)) continue;
    windows.set(key, {
      scenarioIds,
      windowStart: covering.reduce(
        (max, candidate) => candidate.decisionDate > max ? candidate.decisionDate : max,
        covering[0].decisionDate,
      ),
      windowEnd: covering.reduce(
        (min, candidate) => candidate.endDate < min ? candidate.endDate : min,
        covering[0].endDate,
      ),
    });
  }
  return [...windows.values()].sort((a, b) =>
    a.windowStart.localeCompare(b.windowStart) || a.windowEnd.localeCompare(b.windowEnd));
}
