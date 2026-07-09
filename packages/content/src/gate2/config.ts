/**
 * Pinned Gate 2 judge config and offline threshold calibration (D031 / C003).
 * Changing these values is a reviewed code change.
 */

export const GATE2_MODEL = 'grok-4.5' as const;

/** Combined guess + direction prompt pin. Bump on any prompt edit. */
export const GATE2_PROMPT_VERSION = 'guess.v1+direction.v1' as const;

export type Gate2ThresholdConfig = {
  /** Easy: correct at rank 1–3 passes; rank 4–5 warns; absent fails. */
  easy: {
    passMaxRank: number;
    warnMaxRank: number;
  };
  /** Medium: fail if #1 with conf >= mediumFailTopConfidence, or lead >= mediumFailLeadPoints. */
  medium: {
    failTopConfidence: number;
    failLeadPoints: number;
  };
  /** Hard: fail if correct appears in top 5 with conf >= hardFailMinConfidence. */
  hard: {
    failMinConfidence: number;
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
  /** Direction WARN if long/short confidence >= this. Never blocks in H021. */
  directionWarnConfidence: number;
};

export const GATE2_THRESHOLDS: Gate2ThresholdConfig = {
  easy: {
    passMaxRank: 3,
    warnMaxRank: 5,
  },
  medium: {
    failTopConfidence: 40,
    failLeadPoints: 15,
  },
  hard: {
    failMinConfidence: 15,
  },
  plausibleFloor: 10,
  plausibleMinCounts: {
    easy: 2,
    medium: 2,
    hard: 2,
  },
  mediumDominanceConfidence: 40,
  directionWarnConfidence: 65,
};

export const GATE2_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export type Gate2Difficulty = (typeof GATE2_DIFFICULTIES)[number];
