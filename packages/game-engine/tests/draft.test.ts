import { describe, expect, it } from 'vitest';
import {
  DRAFT_BUDGET,
  DRAFT_PICKS,
  DRAFT_POOL_SIZE,
  computeDraftResult,
  equalWeightAllocations,
  findDraftWindows,
  isValidDraftAllocation,
  portfolioFinalValue,
  weightedDraftFinalValue,
} from '../src/draft';
import type { DraftPoolEntry } from '../src/types';

function pool(returns: Record<string, number>): DraftPoolEntry[] {
  return Object.entries(returns).map(([scenarioId, actualReturnPercent]) => ({
    scenarioId,
    actualReturnPercent,
  }));
}

const SIX = pool({ a: 0.5, b: 0.2, c: -0.1, d: 0.9, e: -0.6, f: 0.0 });

describe('portfolioFinalValue', () => {
  it('splits the budget equally and applies each return', () => {
    // 10000 / 3 slices: +50%, -10%, 0% → 5000 + 3000 + 3333.33...
    expect(portfolioFinalValue([0.5, -0.1, 0])).toBeCloseTo(
      5000 + 3000 + DRAFT_BUDGET / 3,
      6,
    );
  });

  it('floors a slice at zero for returns below -100%', () => {
    expect(portfolioFinalValue([-1.5, 0, 0])).toBeCloseTo((DRAFT_BUDGET / 3) * 2, 6);
  });

  it('rejects an empty portfolio and non-positive budgets', () => {
    expect(() => portfolioFinalValue([])).toThrow();
    expect(() => portfolioFinalValue([0.1], 0)).toThrow();
    expect(() => portfolioFinalValue([0.1], Number.NaN)).toThrow();
  });
});

describe('computeDraftResult', () => {
  it('computes selected value, optimal three, and the gap', () => {
    const result = computeDraftResult(SIX, ['b', 'c', 'f']);
    const slice = DRAFT_BUDGET / DRAFT_PICKS;
    expect(result.budget).toBe(DRAFT_BUDGET);
    expect(result.finalValue).toBeCloseTo(slice * 1.2 + slice * 0.9 + slice * 1.0, 6);
    // Optimal picks are the top three returns: d (+90%), a (+50%), b (+20%).
    expect(result.optimalScenarioIds).toEqual(['d', 'a', 'b']);
    expect(result.optimalValue).toBeCloseTo(slice * 1.9 + slice * 1.5 + slice * 1.2, 6);
    expect(result.gapFromOptimal).toBeCloseTo(result.optimalValue - result.finalValue, 9);
  });

  it('reports zero gap when the player drafts the optimal three', () => {
    const result = computeDraftResult(SIX, ['d', 'a', 'b']);
    expect(result.gapFromOptimal).toBeCloseTo(0, 9);
  });

  it('breaks return ties deterministically by scenarioId', () => {
    const tied = pool({ z: 0.3, y: 0.3, x: 0.3, w: 0.3, v: -0.2, u: -0.4 });
    const result = computeDraftResult(tied, ['v', 'u', 'z']);
    expect(result.optimalScenarioIds).toEqual(['w', 'x', 'y']);
  });

  it('handles an all-negative window (best value can still lose money)', () => {
    const grim = pool({ a: -0.2, b: -0.4, c: -0.5, d: -0.7, e: -0.8, f: -0.9 });
    const result = computeDraftResult(grim, ['d', 'e', 'f']);
    const slice = DRAFT_BUDGET / DRAFT_PICKS;
    expect(result.finalValue).toBeCloseTo(slice * (0.3 + 0.2 + 0.1), 6);
    expect(result.optimalScenarioIds).toEqual(['a', 'b', 'c']);
    expect(result.optimalValue).toBeLessThan(DRAFT_BUDGET);
  });

  it('rejects selections that are not exactly three distinct pool members', () => {
    expect(() => computeDraftResult(SIX, ['a', 'b'])).toThrow();
    expect(() => computeDraftResult(SIX, ['a', 'b', 'c', 'd'])).toThrow();
    expect(() => computeDraftResult(SIX, ['a', 'a', 'b'])).toThrow();
    expect(() => computeDraftResult(SIX, ['a', 'b', 'nope'])).toThrow();
  });

  it('rejects pools that are not exactly six distinct companies', () => {
    expect(() => computeDraftResult(SIX.slice(0, 5), ['a', 'b', 'c'])).toThrow();
    expect(() =>
      computeDraftResult([...SIX.slice(0, 5), { ...SIX[0] }], ['a', 'b', 'c']),
    ).toThrow();
    expect(DRAFT_POOL_SIZE).toBe(6);
  });
});

describe('findDraftWindows', () => {
  const interval = (scenarioId: string, decisionDate: string, endDate: string) => ({
    scenarioId,
    decisionDate,
    endDate,
  });

  it('finds one window when six holding periods share a common date', () => {
    const candidates = [
      interval('a', '2020-01-02', '2021-01-04'),
      interval('b', '2020-01-02', '2021-01-04'),
      interval('c', '2020-01-02', '2021-01-04'),
      interval('d', '2020-01-02', '2021-01-04'),
      interval('e', '2020-01-02', '2021-01-04'),
      interval('f', '2020-03-23', '2021-03-22'),
      interval('lonely', '1999-01-04', '2000-01-03'),
    ];
    const windows = findDraftWindows(candidates);
    expect(windows).toHaveLength(1);
    expect(windows[0].scenarioIds).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
    // The shared slice starts at the latest decision date and ends at the
    // earliest end date.
    expect(windows[0].windowStart).toBe('2020-03-23');
    expect(windows[0].windowEnd).toBe('2021-01-04');
  });

  it('returns nothing when no six periods overlap a common date', () => {
    const candidates = Array.from({ length: 6 }, (_, i) =>
      interval(`s${i}`, `20${10 + i}-01-01`, `20${10 + i}-06-01`),
    );
    expect(findDraftWindows(candidates)).toHaveLength(0);
  });

  it('separates distinct overlapping cohorts into distinct windows', () => {
    const cohort = (prefix: string, decisionDate: string, endDate: string) =>
      Array.from({ length: 6 }, (_, i) => interval(`${prefix}${i}`, decisionDate, endDate));
    const windows = findDraftWindows([
      ...cohort('early', '2020-01-02', '2021-01-04'),
      ...cohort('late', '2022-01-03', '2023-01-03'),
    ]);
    expect(windows).toHaveLength(2);
    expect(windows[0].scenarioIds.every((id) => id.startsWith('early'))).toBe(true);
    expect(windows[1].scenarioIds.every((id) => id.startsWith('late'))).toBe(true);
  });

  it('rejects malformed or inverted dates', () => {
    expect(() =>
      findDraftWindows([interval('a', '2020/01/02', '2021-01-04')]),
    ).toThrow();
    expect(() =>
      findDraftWindows([interval('a', '2021-01-04', '2020-01-02')]),
    ).toThrow();
  });
});

describe('D055 weighted Draft formats', () => {
  it('validates 10% increments and the equal-weight shortcut', () => {
    expect(equalWeightAllocations(2)).toEqual([50, 50]);
    expect(equalWeightAllocations(3)).toEqual([30, 30, 40]);
    expect(isValidDraftAllocation([60, 40], 2)).toBe(true);
    expect(isValidDraftAllocation([60, 30, 10], 3)).toBe(true);
    expect(isValidDraftAllocation([50, 30, 20], 2)).toBe(false);
    expect(isValidDraftAllocation([33, 33, 34], 3)).toBe(false);
  });

  it('supports Quick Draft and computes weighted value', () => {
    const quick = pool({ a: 0.5, b: 0.2, c: -0.1, d: 0.9 });
    const result = computeDraftResult(quick, ['a', 'd'], [40, 60], 'quick');
    expect(result.format).toBe('quick');
    expect(result.selectedAllocations).toEqual([40, 60]);
    expect(result.finalValue).toBeCloseTo(weightedDraftFinalValue([0.5, 0.9], [40, 60]), 6);
    expect(result.optimalScenarioIds).toEqual(['a', 'd']);
    expect(result.optimalAllocations).toEqual([40, 60]);
    expect(result.gapFromOptimal).toBeCloseTo(0, 9);
  });

  it('finds the best valid allocation, not just the best three companies', () => {
    const six = pool({ a: 0.8, b: 0.7, c: 0.1, d: 0.0, e: -0.2, f: -0.4 });
    const result = computeDraftResult(six, ['a', 'b', 'c'], [30, 30, 40], 'classic');
    expect(result.optimalScenarioIds).toEqual(['a', 'b', 'c']);
    expect(result.optimalAllocations).toEqual([60, 30, 10]);
    expect(result.optimalValue).toBeCloseTo(weightedDraftFinalValue([0.8, 0.7, 0.1], [60, 30, 10]), 6);
    expect(result.gapFromOptimal).toBeGreaterThan(0);
  });

  it('rejects invalid weighted selections and pool sizes', () => {
    const quick = pool({ a: 0.1, b: 0.2, c: 0.3, d: 0.4 });
    expect(() => computeDraftResult(quick, ['a', 'b'], [50, 50], 'classic')).toThrow();
    expect(() => computeDraftResult(quick, ['a', 'b'], [70, 30], 'quick')).toThrow();
    expect(() => computeDraftResult(quick, ['a', 'b'], [40, 40], 'quick')).toThrow();
  });
});
