/**
 * Gate 2 judge model policy and offline threshold calibration (D031 / C003).
 * Changing these values is a reviewed code change.
 */

export const GATE2_DEFAULT_MODEL = 'grok-4.5' as const;
export const GATE2_APPROVED_MODELS = [
  GATE2_DEFAULT_MODEL,
  'claude-fable',
] as const;

/** @deprecated Use GATE2_DEFAULT_MODEL for new code. */
export const GATE2_MODEL = GATE2_DEFAULT_MODEL;

/** Combined guess + direction prompt pin. Bump on any prompt edit. */
export const GATE2_PROMPT_VERSION = 'guess.v1+direction.v1' as const;

export type Gate2ThresholdConfig = {
  /** Easy: correct at rank 1–3 passes; rank 4–5 warns; absent fails. */
  easy: {
    passMaxRank: number;
    warnMaxRank: number;
  };
  /** Medium: fail only when #1 meets both confidence and lead dominance thresholds. */
  medium: {
    failTopConfidence: number;
    failLeadPoints: number;
  };
  /** Hard: fail only when correct is #1 and meets both dominance thresholds. */
  hard: {
    failTopConfidence: number;
    failLeadPoints: number;
  };
  /** Guess is "plausible" if confidence >= floor and has a pointing fact. WARN-only checks. */
  plausibleFloor: number;
  plausibleMinCounts: {
    easy: number;
    medium: number;
    hard: number;
  };
  /** Medium dominance proxy for plausible set (WARN). */
  mediumDominanceConfidence: number;
  /** Direction WARN if long/short confidence >= this. Never blocks phase acceptance. */
  directionWarnConfidence: number;
};

export const GATE2_THRESHOLDS: Gate2ThresholdConfig = {
  easy: {
    passMaxRank: 3,
    warnMaxRank: 5,
  },
  medium: {
    failTopConfidence: 85,
    failLeadPoints: 35,
  },
  hard: {
    failTopConfidence: 75,
    failLeadPoints: 35,
  },
  plausibleFloor: 10,
  plausibleMinCounts: {
    easy: 2,
    medium: 2,
    hard: 2,
  },
  mediumDominanceConfidence: 85,
  directionWarnConfidence: 65,
};

export const GATE2_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Gate2Difficulty = (typeof GATE2_DIFFICULTIES)[number];
