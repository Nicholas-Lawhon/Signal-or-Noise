import { z } from 'zod';

const nonEmptyString = z.string().min(1);

export const gate2GuessSchema = z.object({
  company: nonEmptyString,
  confidence: z.number().int().min(0).max(100),
  pointingFact: nonEmptyString,
});

export const gate2DirectionSchema = z.object({
  call: z.enum(['long', 'short', 'toss_up']),
  confidence: z.number().int().min(0).max(100),
  cue: nonEmptyString,
});

function normalizeCompanyGuess(company: string): string {
  return company.normalize('NFKC').toLocaleLowerCase('en-US').replace(/[^a-z0-9]/g, '');
}

/** Five distinct company guesses ordered from highest to lowest confidence. */
export const rankedGate2GuessesSchema = z
  .array(gate2GuessSchema)
  .length(5)
  .superRefine((guesses, context) => {
    const companies = new Set<string>();
    guesses.forEach((guess, index) => {
      const company = normalizeCompanyGuess(guess.company);
      if (companies.has(company)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'company'],
          message: 'Gate 2 company guesses must be distinct',
        });
      }
      companies.add(company);

      const previous = guesses[index - 1];
      if (previous && previous.confidence < guess.confidence) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [index, 'confidence'],
          message:
            'Gate 2 guesses must be in descending confidence order (highest first; ties allowed)',
        });
      }
    });
  });

export const gate2JudgeEntrySchema = z.object({
  judgeId: nonEmptyString,
  guesses: rankedGate2GuessesSchema,
  direction: gate2DirectionSchema,
});
export const gate2JudgeResultSchema = z.object({
  model: nonEmptyString,
  promptVersion: nonEmptyString,
  testedAt: z.string().datetime(),
  entries: z.array(gate2JudgeEntrySchema).min(1),
});

export const gate2VariantResultSchema = z.object({
  payloadHash: nonEmptyString,
  model: nonEmptyString,
  promptVersion: nonEmptyString,
  testedAt: nonEmptyString,
  guesses: rankedGate2GuessesSchema,
  direction: gate2DirectionSchema,
});
