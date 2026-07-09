/**
 * Pure Gate 2 pre-decision payload rendering and content hashing.
 * Defines exactly what the judge (and player) sees — no reveal-side fields.
 * Browser-safe: no node: imports (must stay importable from package root).
 */
import { sha256Hex } from './sha256';
import type { Difficulty, Scenario } from '../types';

/**
 * Pre-decision payload for one difficulty variant.
 * Field order is intentional and stable for hashing.
 */
export type Gate2VariantPayload = {
  title: string;
  era: string;
  decisionDateLabel: string;
  holdingPeriodLabel: string;
  companyDescription: string;
  macroContext: string;
  situation: string;
  longCase: string;
  shortCase: string;
  setupHints: string[];
  /** Lookback series reindexed so first value = 100, one decimal place. */
  lookbackPrices: number[];
};

/**
 * Normalize raw lookback prices to first value = 100 with one decimal.
 * Empty series returns []. Zero/invalid first price returns all zeros at one decimal.
 */
export function normalizeLookbackPrices(prices: number[]): number[] {
  if (prices.length === 0) return [];
  const first = prices[0];
  if (first === undefined || first === 0 || !Number.isFinite(first)) {
    return prices.map(() => 0);
  }
  return prices.map((p) => Math.round((p / first) * 1000) / 10);
}

/**
 * Render the exact pre-decision payload a player sees for one difficulty.
 * Excludes company identity, reveal, outcome data, sources, and review metadata.
 */
export function renderVariantPayload(
  scenario: Scenario,
  difficulty: Difficulty,
): Gate2VariantPayload {
  const variant = scenario.hiddenCard[difficulty];
  return {
    title: scenario.scenario.title,
    era: scenario.scenario.era,
    decisionDateLabel: scenario.scenario.decisionDateLabel,
    holdingPeriodLabel: scenario.scenario.holdingPeriodLabel,
    companyDescription: variant.companyDescription,
    macroContext: variant.macroContext,
    situation: variant.situation,
    longCase: variant.longCase,
    shortCase: variant.shortCase,
    setupHints: [...variant.setupHints],
    lookbackPrices: normalizeLookbackPrices(scenario.marketData.lookbackPrices),
  };
}

/**
 * Canonical JSON: recursively sort object keys, then compact stringify.
 * Arrays preserve order; primitives stringify as JSON.
 */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = canonicalize(obj[key]);
  }
  return sorted;
}

/**
 * SHA-256 over canonical JSON of the payload, prefixed as `sha256:<hex>`.
 * Uses pure browser-safe SHA-256 (no Node builtins).
 */
export function hashVariantPayload(payload: Gate2VariantPayload): string {
  const digest = sha256Hex(canonicalJson(payload));
  return `sha256:${digest}`;
}

/**
 * Convenience: render + hash for one scenario variant.
 */
export function hashScenarioVariant(
  scenario: Scenario,
  difficulty: Difficulty,
): string {
  return hashVariantPayload(renderVariantPayload(scenario, difficulty));
}

/** Re-export for known-vector tests without pulling Node crypto. */
export { sha256Hex } from './sha256';
