import { z } from 'zod';
import { gate2VariantResultSchema } from './gate2/resultValidation';

export const scenarioStatusSchema = z.enum([
  'draft',
  'reviewed',
  'active',
  'inactive',
  'archived',
]);

export const difficultySchema = z.enum(['easy', 'medium', 'hard']);
export const recognitionBucketSchema = z.enum([
  'famous',
  'moderate',
  'obscure',
]);

const nonEmptyString = z.string().min(1);
const contentIdSchema = z
  .string()
  .regex(
    /^[a-z0-9]+(?:_[a-z0-9]+)*$/,
    'Expected a lowercase snake_case content ID',
  );

export const productionScenarioInventoryEntrySchema = z.object({
  scenarioId: contentIdSchema,
  recognitionBucket: recognitionBucketSchema,
});

const REQUIRED_RECOGNITION_COUNTS = {
  famous: 24,
  moderate: 12,
  obscure: 4,
} as const;

export const productionScenarioInventorySchema = z
  .array(productionScenarioInventoryEntrySchema)
  .length(40)
  .superRefine((entries, context) => {
    const scenarioIds = new Set<string>();
    const counts: Record<z.infer<typeof recognitionBucketSchema>, number> = {
      famous: 0,
      moderate: 0,
      obscure: 0,
    };

    entries.forEach((entry, index) => {
      if (scenarioIds.has(entry.scenarioId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'scenarioId'],
          message: 'Production inventory scenario IDs must be unique',
        });
      }
      scenarioIds.add(entry.scenarioId);
      counts[entry.recognitionBucket] += 1;
    });

    recognitionBucketSchema.options.forEach((bucket) => {
      const required = REQUIRED_RECOGNITION_COUNTS[bucket];
      if (counts[bucket] !== required) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [],
          message: `Production inventory must contain exactly ${required} ${bucket} scenarios (got ${counts[bucket]})`,
        });
      }
    });
  });

export const dailyChallengePoolEntrySchema = z.object({
  scenarioId: contentIdSchema,
  difficulty: difficultySchema,
});

export const dailyChallengePoolSchema = z
  .object({
    id: contentIdSchema,
    name: nonEmptyString,
    startingBankroll: z.literal(10000),
    scenarios: z.array(dailyChallengePoolEntrySchema).length(10),
  })
  .superRefine((pool, context) => {
    const scenarioIds = new Set<string>();
    const difficulties = new Set<string>();

    pool.scenarios.forEach((entry, index) => {
      if (scenarioIds.has(entry.scenarioId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['scenarios', index, 'scenarioId'],
          message: 'A daily challenge pool cannot repeat a scenario',
        });
      }
      scenarioIds.add(entry.scenarioId);
      difficulties.add(entry.difficulty);
    });

    if (difficulties.size !== difficultySchema.options.length) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['scenarios'],
        message: 'A daily challenge pool must include easy, medium, and hard',
      });
    }
  });

export const dailyChallengePoolsSchema = z
  .array(dailyChallengePoolSchema)
  .length(10)
  .superRefine((pools, context) => {
    const ids = new Set<string>();
    pools.forEach((pool, index) => {
      if (ids.has(pool.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'id'],
          message: 'Daily challenge pool IDs must be unique',
        });
      }
      ids.add(pool.id);
    });
  });

export const marketEraSchema = z.object({
  id: contentIdSchema,
  name: nonEmptyString,
  description: nonEmptyString,
});

export const marketErasSchema = z
  .array(marketEraSchema)
  .length(10)
  .superRefine((eras, context) => {
    const ids = new Set<string>();
    eras.forEach((era, index) => {
      if (ids.has(era.id)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'id'],
          message: 'Market era IDs must be unique',
        });
      }
      ids.add(era.id);
    });
  });

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
  peerSets: z
    .object({
      easy: z.array(z.string()).optional(),
      medium: z.array(z.string()).optional(),
      hard: z.array(z.string()).optional(),
    })
    .optional(),
  prohibitedConjunctions: z.array(z.string()).optional(),
});

const gate2ReviewSchema = z
  .object({
    easy: gate2VariantResultSchema.optional(),
    medium: gate2VariantResultSchema.optional(),
    hard: gate2VariantResultSchema.optional(),
  })
  .optional();

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
    /** Optional; missing does not fail validation in H021. */
    gate2: gate2ReviewSchema,
  }),
});

export type ScenarioSchemaInput = z.input<typeof scenarioSchema>;
export type ScenarioSchemaOutput = z.output<typeof scenarioSchema>;
