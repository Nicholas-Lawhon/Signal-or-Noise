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
  title: string,
  hiddenCard: Scenario['hiddenCard'],
): { path: string; text: string }[] {
  const fields = [
    'companyDescription',
    'macroContext',
    'situation',
    'longCase',
    'shortCase',
  ] as const satisfies readonly (keyof HiddenCardVariant)[];
  const out: { path: string; text: string }[] = [
    { path: 'scenario.title', text: title },
  ];

  for (const difficulty of ['easy', 'medium', 'hard'] as const) {
    const variant = hiddenCard[difficulty];
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

  const texts = collectHiddenTexts(scenario.scenario.title, scenario.hiddenCard);

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
  const texts = collectHiddenTexts(scenario.scenario.title, scenario.hiddenCard);

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
  checkReturnPercent(scenario, errors);
  checkDateWindows(scenario, errors);

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
