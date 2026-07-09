/**
 * Pure offline Gate 2 evaluation from stored raw results + current thresholds.
 * Does not store pass/fail verdicts — recomputes every time.
 */
import {
  GATE2_DIFFICULTIES,
  GATE2_MODEL,
  GATE2_PROMPT_VERSION,
  GATE2_THRESHOLDS,
  type Gate2Difficulty,
  type Gate2ThresholdConfig,
} from './config';
import { hashScenarioVariant } from './payload';
import type {
  Gate2DirectionResult,
  Gate2Guess,
  Gate2VariantResult,
  Scenario,
} from '../types';

export type Gate2FindingSeverity = 'error' | 'warning';

export type Gate2Finding = {
  severity: Gate2FindingSeverity;
  path: string;
  message: string;
};

/**
 * Normalize company identity for matching: lowercase alphanumeric only.
 * Aligns with Call-the-Company style matching (D015).
 */
export function normalizeIdentity(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * True when a model guess matches company name, ticker, or any accepted name.
 */
export function isCorrectCompanyGuess(
  guessCompany: string,
  scenario: Scenario,
): boolean {
  const normalizedGuess = normalizeIdentity(guessCompany);
  if (!normalizedGuess) return false;

  const identities = [
    scenario.company.name,
    scenario.company.ticker,
    ...scenario.company.acceptedNames,
  ].map(normalizeIdentity);

  return identities.includes(normalizedGuess);
}

function hasPointingFact(guess: Gate2Guess): boolean {
  return guess.pointingFact.trim().length > 0;
}

function isPlausible(guess: Gate2Guess, floor: number): boolean {
  return guess.confidence >= floor && hasPointingFact(guess);
}

function findCorrectRank(
  guesses: Gate2Guess[],
  scenario: Scenario,
): { rank: number; guess: Gate2Guess } | null {
  for (let i = 0; i < guesses.length; i += 1) {
    const guess = guesses[i];
    if (guess && isCorrectCompanyGuess(guess.company, scenario)) {
      return { rank: i + 1, guess };
    }
  }
  return null;
}

function evaluateIdentityThresholds(
  difficulty: Gate2Difficulty,
  stored: Gate2VariantResult,
  scenario: Scenario,
  thresholds: Gate2ThresholdConfig,
  pathPrefix: string,
  findings: Gate2Finding[],
): void {
  const correct = findCorrectRank(stored.guesses, scenario);

  if (difficulty === 'easy') {
    if (!correct) {
      findings.push({
        severity: 'error',
        path: `${pathPrefix}.guesses`,
        message:
          'Easy Gate 2: correct company absent from top 5 (too vague)',
      });
    } else if (correct.rank <= thresholds.easy.passMaxRank) {
      // pass — no finding
    } else if (correct.rank <= thresholds.easy.warnMaxRank) {
      findings.push({
        severity: 'warning',
        path: `${pathPrefix}.guesses`,
        message: `Easy Gate 2: correct company at rank ${correct.rank} (should be top 3)`,
      });
    }
    return;
  }

  if (difficulty === 'medium') {
    if (correct && correct.rank === 1) {
      if (correct.guess.confidence >= thresholds.medium.failTopConfidence) {
        findings.push({
          severity: 'error',
          path: `${pathPrefix}.guesses`,
          message: `Medium Gate 2: correct company is #1 with confidence ${correct.guess.confidence} (threshold ${thresholds.medium.failTopConfidence})`,
        });
      }
      const second = stored.guesses[1];
      if (second) {
        const lead = correct.guess.confidence - second.confidence;
        if (lead >= thresholds.medium.failLeadPoints) {
          findings.push({
            severity: 'error',
            path: `${pathPrefix}.guesses`,
            message: `Medium Gate 2: correct company leads #2 by ${lead} points (threshold ${thresholds.medium.failLeadPoints})`,
          });
        }
      }
    }
    return;
  }

  // hard
  if (
    correct &&
    correct.guess.confidence >= thresholds.hard.failMinConfidence
  ) {
    findings.push({
      severity: 'error',
      path: `${pathPrefix}.guesses`,
      message: `Hard Gate 2: correct company appears in top 5 at rank ${correct.rank} with confidence ${correct.guess.confidence} (threshold ${thresholds.hard.failMinConfidence})`,
    });
  }
}

function evaluatePlausibleWarnings(
  difficulty: Gate2Difficulty,
  stored: Gate2VariantResult,
  thresholds: Gate2ThresholdConfig,
  pathPrefix: string,
  findings: Gate2Finding[],
): void {
  const plausible = stored.guesses.filter((g) =>
    isPlausible(g, thresholds.plausibleFloor),
  );
  const count = plausible.length;

  if (difficulty === 'easy') {
    if (count < thresholds.plausibleMinCounts.easy) {
      findings.push({
        severity: 'warning',
        path: `${pathPrefix}.guesses`,
        message: `Easy Gate 2: only ${count} plausible guess(es) (confidence >= ${thresholds.plausibleFloor} with pointing fact); want >= ${thresholds.plausibleMinCounts.easy}`,
      });
    }
    return;
  }

  if (difficulty === 'medium') {
    const { min, max } = thresholds.plausibleMinCounts.medium;
    if (count < min || count > max) {
      findings.push({
        severity: 'warning',
        path: `${pathPrefix}.guesses`,
        message: `Medium Gate 2: ${count} plausible guess(es); want ${min}–${max}`,
      });
    }
    const dominant = stored.guesses.find(
      (g) => g.confidence >= thresholds.mediumDominanceConfidence,
    );
    if (dominant) {
      findings.push({
        severity: 'warning',
        path: `${pathPrefix}.guesses`,
        message: `Medium Gate 2: dominant guess "${dominant.company}" at ${dominant.confidence}% (>= ${thresholds.mediumDominanceConfidence})`,
      });
    }
    return;
  }

  if (count < thresholds.plausibleMinCounts.hard) {
    findings.push({
      severity: 'warning',
      path: `${pathPrefix}.guesses`,
      message: `Hard Gate 2: only ${count} plausible guess(es); want >= ${thresholds.plausibleMinCounts.hard}`,
    });
  }
}

function evaluateLikelyGuessOverlap(
  difficulty: Gate2Difficulty,
  stored: Gate2VariantResult,
  scenario: Scenario,
  pathPrefix: string,
  findings: Gate2Finding[],
): void {
  const reviewKey =
    difficulty === 'easy'
      ? 'easyLikelyGuesses'
      : difficulty === 'medium'
        ? 'mediumLikelyGuesses'
        : 'hardLikelyGuesses';
  const curatorList = scenario.review[reviewKey] ?? [];
  if (curatorList.length === 0) return;

  const curatorNorm = new Set(
    curatorList.map(normalizeIdentity).filter(Boolean),
  );
  const hasOverlap = stored.guesses.some((g) =>
    curatorNorm.has(normalizeIdentity(g.company)),
  );

  if (!hasOverlap) {
    findings.push({
      severity: 'warning',
      path: `${pathPrefix}.guesses`,
      message: `Gate 2 top-5 has zero overlap with review.${reviewKey}`,
    });
  }
}

function evaluateDirection(
  direction: Gate2DirectionResult,
  thresholds: Gate2ThresholdConfig,
  pathPrefix: string,
  findings: Gate2Finding[],
): void {
  if (
    (direction.call === 'long' || direction.call === 'short') &&
    direction.confidence >= thresholds.directionWarnConfidence
  ) {
    findings.push({
      severity: 'warning',
      path: `${pathPrefix}.direction`,
      message: `Direction leakage WARN: model called ${direction.call} at ${direction.confidence}% (threshold ${thresholds.directionWarnConfidence})`,
    });
  }
}

/**
 * Evaluate one stored variant result: pin checks, hash currency, thresholds.
 * When `expectedHash` is provided (or scenario is available), stale hashes error.
 */
export function evaluateGate2Variant(options: {
  difficulty: Gate2Difficulty;
  stored: Gate2VariantResult;
  scenario: Scenario;
  thresholds?: Gate2ThresholdConfig;
  pinnedModel?: string;
  pinnedPromptVersion?: string;
}): Gate2Finding[] {
  const {
    difficulty,
    stored,
    scenario,
    thresholds = GATE2_THRESHOLDS,
    pinnedModel = GATE2_MODEL,
    pinnedPromptVersion = GATE2_PROMPT_VERSION,
  } = options;

  const pathPrefix = `review.gate2.${difficulty}`;
  const findings: Gate2Finding[] = [];

  if (stored.model !== pinnedModel) {
    findings.push({
      severity: 'error',
      path: `${pathPrefix}.model`,
      message: `Gate 2 model pin mismatch: stored "${stored.model}", expected "${pinnedModel}"`,
    });
  }

  if (stored.promptVersion !== pinnedPromptVersion) {
    findings.push({
      severity: 'error',
      path: `${pathPrefix}.promptVersion`,
      message: `Gate 2 prompt version mismatch: stored "${stored.promptVersion}", expected "${pinnedPromptVersion}"`,
    });
  }

  const expectedHash = hashScenarioVariant(scenario, difficulty);
  if (stored.payloadHash !== expectedHash) {
    findings.push({
      severity: 'error',
      path: `${pathPrefix}.payloadHash`,
      message: `Gate 2 payload hash is stale (stored ${stored.payloadHash}, expected ${expectedHash})`,
    });
  }

  if (stored.guesses.length !== 5) {
    findings.push({
      severity: 'error',
      path: `${pathPrefix}.guesses`,
      message: `Gate 2 guesses must contain exactly 5 entries; got ${stored.guesses.length}`,
    });
    return findings;
  }

  evaluateIdentityThresholds(
    difficulty,
    stored,
    scenario,
    thresholds,
    pathPrefix,
    findings,
  );
  evaluatePlausibleWarnings(
    difficulty,
    stored,
    thresholds,
    pathPrefix,
    findings,
  );
  evaluateLikelyGuessOverlap(
    difficulty,
    stored,
    scenario,
    pathPrefix,
    findings,
  );
  evaluateDirection(stored.direction, thresholds, pathPrefix, findings);

  return findings;
}

/**
 * Evaluate all present `review.gate2` variant entries on a scenario.
 * Missing variants produce no findings (H021 — enforcement lands later).
 */
export function evaluateScenarioGate2(
  scenario: Scenario,
  options?: {
    thresholds?: Gate2ThresholdConfig;
    pinnedModel?: string;
    pinnedPromptVersion?: string;
  },
): Gate2Finding[] {
  const gate2 = scenario.review.gate2;
  if (!gate2) return [];

  const findings: Gate2Finding[] = [];
  for (const difficulty of GATE2_DIFFICULTIES) {
    const stored = gate2[difficulty];
    if (!stored) continue;
    findings.push(
      ...evaluateGate2Variant({
        difficulty,
        stored,
        scenario,
        thresholds: options?.thresholds,
        pinnedModel: options?.pinnedModel,
        pinnedPromptVersion: options?.pinnedPromptVersion,
      }),
    );
  }
  return findings;
}

/**
 * Report missing Gate 2 results (informational — not validation errors in H021).
 */
export function listMissingGate2Variants(scenario: Scenario): Gate2Difficulty[] {
  const gate2 = scenario.review.gate2;
  return GATE2_DIFFICULTIES.filter((d) => !gate2?.[d]);
}
