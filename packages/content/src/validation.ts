import { scenarioSchema } from './schema';
import type {
  Difficulty,
  HiddenCardVariant,
  Scenario,
  ValidationIssue,
  ValidationResult,
  ValidationWarning,
} from './types';

/** Directional-sentiment terms that produce warnings only (do not fail validation). */
export const DIRECTIONAL_SENTIMENT_TERMS = [
  'obvious',
  'doomed',
  'unstoppable',
  'exploded',
  'disaster',
  'no-brainer',
] as const;

const SETUP_HINT_RULES: Record<
  Difficulty,
  { min: number; max: number; label: string }
> = {
  easy: { min: 1, max: 1, label: 'exactly 1' },
  medium: { min: 0, max: 1, label: '0 or 1' },
  hard: { min: 0, max: 0, label: 'exactly 0' },
};

/** Conservative guard: reject whole-percent-looking values outside decimal range. */
const MAX_ABS_RETURN_DECIMAL = 20;

/** Absolute tolerance for actualReturnPercent vs prices. */
const RETURN_CONSISTENCY_TOLERANCE = 0.01;

/** Absolute tolerance for lookback-last vs outcome-first continuity. */
const CHART_CONTINUITY_TOLERANCE = 0.05;

/**
 * Generic peer-bucket words — likely guesses must be named companies, not
 * group placeholders like "semiconductor peers".
 */
const GENERIC_LIKELY_GUESS_WORDS = [
  'peers',
  'retailers',
  'companies',
  'sector',
  'industry',
  'competitors',
  'infrastructure',
  'players',
] as const;

const LIKELY_GUESS_COUNT_RULES: Record<
  Difficulty,
  { min: number; max: number | null; reviewKey: keyof Scenario['review'] }
> = {
  easy: { min: 2, max: null, reviewKey: 'easyLikelyGuesses' },
  medium: { min: 2, max: 4, reviewKey: 'mediumLikelyGuesses' },
  hard: { min: 4, max: null, reviewKey: 'hardLikelyGuesses' },
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Case-insensitive term match with word boundaries.
 * Multi-word terms match as phrases with boundaries at the ends.
 */
export function textContainsTerm(text: string, term: string): boolean {
  const trimmed = term.trim();
  if (!trimmed) return false;
  const pattern = escapeRegExp(trimmed).replace(/\s+/g, '\\s+');
  const re = new RegExp(`\\b${pattern}\\b`, 'i');
  return re.test(text);
}

function collectHiddenTexts(
  scenario: Scenario,
): { path: string; text: string }[] {
  const fields = [
    'companyDescription',
    'macroContext',
    'situation',
    'longCase',
    'shortCase',
  ] as const satisfies readonly (keyof HiddenCardVariant)[];
  const out: { path: string; text: string }[] = [
    { path: 'scenario.title', text: scenario.scenario.title },
    { path: 'scenario.era', text: scenario.scenario.era },
    {
      path: 'scenario.decisionDateLabel',
      text: scenario.scenario.decisionDateLabel,
    },
    {
      path: 'scenario.holdingPeriodLabel',
      text: scenario.scenario.holdingPeriodLabel,
    },
  ];

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const variant = scenario.hiddenCard[difficulty];
    for (const field of fields) {
      out.push({
        path: `hiddenCard.${difficulty}.${field}`,
        text: variant[field],
      });
    }
    variant.setupHints.forEach((hint, index) => {
      out.push({
        path: `hiddenCard.${difficulty}.setupHints.${index}`,
        text: hint,
      });
    });
  }

  return out;
}

function checkLeakage(
  scenario: Scenario,
  errors: ValidationIssue[],
): void {
  const terms: { label: string; term: string }[] = [
    { label: 'company name', term: scenario.company.name },
    { label: 'ticker', term: scenario.company.ticker },
    ...scenario.company.acceptedNames.map((term) => ({
      label: 'accepted name',
      term,
    })),
    ...scenario.company.identityBannedTerms.map((term) => ({
      label: 'identity-banned term',
      term,
    })),
  ];

  const texts = collectHiddenTexts(scenario);

  for (const { path, text } of texts) {
    for (const { label, term } of terms) {
      if (textContainsTerm(text, term)) {
        errors.push({
          path,
          message: `Hidden pre-decision text contains ${label} "${term}"`,
        });
      }
    }
  }
}

function checkIdentityBannedTerms(
  scenario: Scenario,
  errors: ValidationIssue[],
): void {
  if (
    (scenario.status === 'reviewed' || scenario.status === 'active') &&
    scenario.company.identityBannedTerms.length === 0
  ) {
    errors.push({
      path: 'company.identityBannedTerms',
      message:
        'reviewed/active scenarios must list at least one identity-banned term',
    });
  }
}

function checkSetupHintCounts(
  scenario: Scenario,
  errors: ValidationIssue[],
): void {
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const count = scenario.hiddenCard[difficulty].setupHints.length;
    const rule = SETUP_HINT_RULES[difficulty];
    if (count < rule.min || count > rule.max) {
      errors.push({
        path: `hiddenCard.${difficulty}.setupHints`,
        message: `${difficulty} must have ${rule.label} setup hint(s); got ${count}`,
      });
    }
  }
}

function checkReturnPercent(
  scenario: Scenario,
  errors: ValidationIssue[],
): void {
  const value = scenario.marketData.actualReturnPercent;
  if (Math.abs(value) >= MAX_ABS_RETURN_DECIMAL) {
    errors.push({
      path: 'marketData.actualReturnPercent',
      message: `actualReturnPercent must be a decimal with absolute value < ${MAX_ABS_RETURN_DECIMAL} (got ${value}). Example: +35% = 0.35, not 35.`,
    });
  }
}

/**
 * Internal price/return consistency: decimal return vs start/end prices, and
 * lookback→outcome chart continuity at the decision boundary.
 */
function checkPriceReturnConsistency(
  scenario: Scenario,
  errors: ValidationIssue[],
): void {
  const {
    startingPrice,
    endingPrice,
    actualReturnPercent,
    lookbackPrices,
    outcomePrices,
  } = scenario.marketData;

  if (startingPrice > 0) {
    const expectedReturn = (endingPrice - startingPrice) / startingPrice;
    const delta = Math.abs(actualReturnPercent - expectedReturn);
    if (delta > RETURN_CONSISTENCY_TOLERANCE) {
      errors.push({
        path: 'marketData.actualReturnPercent',
        message: `actualReturnPercent (${actualReturnPercent}) differs from (endingPrice - startingPrice) / startingPrice (${expectedReturn.toFixed(6)}) by ${delta.toFixed(6)} (max allowed ${RETURN_CONSISTENCY_TOLERANCE})`,
      });
    }
  }

  const lookbackLast = lookbackPrices[lookbackPrices.length - 1];
  const outcomeFirst = outcomePrices[0];
  if (
    lookbackLast !== undefined &&
    outcomeFirst !== undefined &&
    Math.abs(lookbackLast - outcomeFirst) > CHART_CONTINUITY_TOLERANCE
  ) {
    errors.push({
      path: 'marketData.lookbackPrices',
      message: `last lookbackPrices value (${lookbackLast}) and first outcomePrices value (${outcomeFirst}) differ by more than ${CHART_CONTINUITY_TOLERANCE}`,
    });
  }
}

/**
 * Conservative named-company check for red-team likely-guess lists.
 * Rejects empty strings and peer-bucket placeholders (generic group words).
 * Ordinary company-name strings (including multi-word names like
 * "American Express") pass. Intentionally strict on group words so
 * placeholders cannot slip through with decorative capitalization.
 */
function isNamedCompanyGuess(guess: string): boolean {
  const trimmed = guess.trim();
  if (trimmed.length < 2) return false;
  if (!/[a-zA-Z]/.test(trimmed)) return false;

  const hasGenericGroupWord = GENERIC_LIKELY_GUESS_WORDS.some((word) =>
    new RegExp(`\\b${escapeRegExp(word)}\\b`, 'i').test(trimmed),
  );
  return !hasGenericGroupWord;
}

/**
 * Likely-guess quality floor for reviewed/active only (Gate 1 red-team lists).
 * Draft/inactive/archived are exempt so WIP content can use placeholders.
 */
function checkLikelyGuessQuality(
  scenario: Scenario,
  errors: ValidationIssue[],
): void {
  if (scenario.status !== 'reviewed' && scenario.status !== 'active') {
    return;
  }

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const rule = LIKELY_GUESS_COUNT_RULES[difficulty];
    const guesses = scenario.review[rule.reviewKey] as string[];
    const path = `review.${rule.reviewKey}`;

    if (guesses.length < rule.min) {
      errors.push({
        path,
        message: `${difficulty} must list at least ${rule.min} likely guess(es); got ${guesses.length}`,
      });
    }
    if (rule.max !== null && guesses.length > rule.max) {
      errors.push({
        path,
        message: `${difficulty} must list at most ${rule.max} likely guess(es); got ${guesses.length}`,
      });
    }

    guesses.forEach((guess, index) => {
      if (!isNamedCompanyGuess(guess)) {
        errors.push({
          path: `${path}.${index}`,
          message: `likely guess must be a named company, not a generic peer bucket (got "${guess}")`,
        });
      }
    });
  }
}

function checkDateWindows(
  scenario: Scenario,
  errors: ValidationIssue[],
): void {
  const {
    decisionDate,
    endDate,
  } = scenario.scenario;
  const {
    preDecisionChartStartDate,
    preDecisionChartEndDate,
    outcomeChartStartDate,
    outcomeChartEndDate,
  } = scenario.marketData;

  if (preDecisionChartStartDate > preDecisionChartEndDate) {
    errors.push({
      path: 'marketData.preDecisionChartStartDate',
      message: 'preDecisionChartStartDate must be <= preDecisionChartEndDate',
    });
  }
  if (preDecisionChartEndDate > decisionDate) {
    errors.push({
      path: 'marketData.preDecisionChartEndDate',
      message: 'preDecisionChartEndDate must be <= decisionDate',
    });
  }
  if (outcomeChartStartDate < decisionDate) {
    errors.push({
      path: 'marketData.outcomeChartStartDate',
      message: 'outcomeChartStartDate must be >= decisionDate',
    });
  }
  if (outcomeChartEndDate < outcomeChartStartDate) {
    errors.push({
      path: 'marketData.outcomeChartEndDate',
      message: 'outcomeChartEndDate must be >= outcomeChartStartDate',
    });
  }
  if (!(decisionDate < endDate)) {
    errors.push({
      path: 'scenario.decisionDate',
      message: 'decisionDate must be < endDate',
    });
  }
}

function checkDifficultySupport(
  scenario: Scenario,
  errors: ValidationIssue[],
): void {
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    if (!scenario.scenario.difficultySupported.includes(difficulty)) {
      errors.push({
        path: 'scenario.difficultySupported',
        message: `difficultySupported must include "${difficulty}" (all three variants are required)`,
      });
    }
  }
}

function collectSentimentWarnings(scenario: Scenario): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];
  const texts = collectHiddenTexts(scenario);

  for (const { path, text } of texts) {
    for (const term of DIRECTIONAL_SENTIMENT_TERMS) {
      if (textContainsTerm(text, term)) {
        warnings.push({
          path,
          message: `Directional-sentiment term "${term}" found; prefer neutral framing`,
        });
      }
    }
  }

  // Obvious case asymmetry: one case much shorter than the other at any difficulty
  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const { longCase, shortCase } = scenario.hiddenCard[difficulty];
    const longLen = longCase.trim().length;
    const shortLen = shortCase.trim().length;
    if (longLen === 0 || shortLen === 0) continue;
    const ratio = Math.max(longLen, shortLen) / Math.min(longLen, shortLen);
    if (ratio >= 2.5) {
      warnings.push({
        path: `hiddenCard.${difficulty}`,
        message:
          'longCase and shortCase lengths differ substantially; check for case asymmetry',
      });
    }
  }

  return warnings;
}

function zodIssuesToValidationIssues(
  issues: { path: (string | number)[]; message: string }[],
): ValidationIssue[] {
  return issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
}

/**
 * Validate a scenario object: Zod shape + content rules.
 * Warnings never fail validation.
 */
export function validateScenario(input: unknown): ValidationResult {
  const parsed = scenarioSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      errors: zodIssuesToValidationIssues(parsed.error.issues),
      warnings: [],
    };
  }

  const scenario = parsed.data as Scenario;
  const errors: ValidationIssue[] = [];

  checkDifficultySupport(scenario, errors);
  checkSetupHintCounts(scenario, errors);
  checkLeakage(scenario, errors);
  checkIdentityBannedTerms(scenario, errors);
  checkReturnPercent(scenario, errors);
  checkPriceReturnConsistency(scenario, errors);
  checkDateWindows(scenario, errors);
  checkLikelyGuessQuality(scenario, errors);

  // Empty prices / missing sources / whyItMoved length are enforced by Zod min/tuple.

  const warnings = collectSentimentWarnings(scenario);

  if (errors.length > 0) {
    return { success: false, errors, warnings };
  }

  return { success: true, scenario, warnings };
}

export function validateScenarioOrThrow(input: unknown): Scenario {
  const result = validateScenario(input);
  if (!result.success) {
    const detail = result.errors
      .map((e) => `${e.path}: ${e.message}`)
      .join('; ');
    throw new Error(`Scenario validation failed: ${detail}`);
  }
  return result.scenario;
}
