import { z } from 'zod';

export const scenarioStatusSchema = z.enum([
  'draft',
  'reviewed',
  'active',
  'inactive',
  'archived',
]);

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);

const nonEmptyString = z.string().min(1);

/** True when value is a real calendar day in zero-padded YYYY-MM-DD form. */
function isValidCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  // UTC construction avoids local-timezone day shifts for pure date strings.
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected ISO date YYYY-MM-DD')
  .refine(isValidCalendarDate, {
    message: 'Invalid calendar date (not a real YYYY-MM-DD day)',
  });

const hiddenCardVariantSchema = z.object({
  companyDescription: nonEmptyString,
  macroContext: nonEmptyString,
  situation: nonEmptyString,
  longCase: nonEmptyString,
  shortCase: nonEmptyString,
  setupHints: z.array(nonEmptyString),
});

const factBankSchema = z.object({
  revealOnly: z.array(z.string()),
  decisionUseful: z.array(z.string()),
  prohibited: z.array(z.string()),
});

/**
 * Base shape schema (structure only). Business rules live in validation.ts.
 */
export const scenarioSchema = z.object({
  id: nonEmptyString,
  status: scenarioStatusSchema,
  company: z.object({
    name: nonEmptyString,
    ticker: nonEmptyString,
    exchange: nonEmptyString,
    sector: nonEmptyString,
    industry: nonEmptyString,
    country: nonEmptyString,
    acceptedNames: z.array(nonEmptyString).min(1),
    identityBannedTerms: z.array(nonEmptyString),
  }),
  scenario: z.object({
    title: nonEmptyString,
    decisionDate: isoDateSchema,
    endDate: isoDateSchema,
    decisionDateLabel: nonEmptyString,
    outcomeLabel: nonEmptyString,
    holdingPeriodLabel: nonEmptyString,
    era: nonEmptyString,
    eraId: nonEmptyString,
    contentPackIds: z.array(nonEmptyString).min(1),
    difficultySupported: z.array(difficultySchema).min(1),
  }),
  marketData: z.object({
    startingPrice: z.number().positive(),
    endingPrice: z.number().positive(),
    actualReturnPercent: z.number(),
    usesSplitAdjustedPrices: z.boolean(),
    usesTotalReturn: z.boolean(),
    preDecisionChartStartDate: isoDateSchema,
    preDecisionChartEndDate: isoDateSchema,
    outcomeChartStartDate: isoDateSchema,
    outcomeChartEndDate: isoDateSchema,
    lookbackPrices: z.array(z.number()).min(1),
    outcomePrices: z.array(z.number()).min(1),
  }),
  hiddenCard: z.object({
    easy: hiddenCardVariantSchema,
    medium: hiddenCardVariantSchema,
    hard: hiddenCardVariantSchema,
  }),
  reveal: z.object({
    shortText: nonEmptyString,
    funFact: nonEmptyString,
    whyItMoved: z.tuple([nonEmptyString, nonEmptyString, nonEmptyString]),
  }),
  sources: z
    .array(
      z.object({
        label: nonEmptyString,
        url: z.string().url(),
        notes: z.string().optional(),
      }),
    )
    .min(1),
  review: z.object({
    generatedByAi: z.boolean(),
    humanReviewed: z.boolean(),
    reviewNotes: z.string(),
    factBank: factBankSchema,
    easyLikelyGuesses: z.array(z.string()),
    mediumLikelyGuesses: z.array(z.string()),
    hardLikelyGuesses: z.array(z.string()),
  }),
});

export type ScenarioSchemaInput = z.input<typeof scenarioSchema>;
export type ScenarioSchemaOutput = z.output<typeof scenarioSchema>;
