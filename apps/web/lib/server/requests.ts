import { z } from 'zod';

/**
 * Web-boundary request schemas. All are strict: a request that smuggles
 * identity or scoring fields (userId, guestSessionId, isOfficial, bankroll,
 * scores) is rejected with 400 before any service call. Identity is derived
 * exclusively from the verified Clerk session and the httpOnly guest cookie.
 */
export const createClassicRunRequestSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']),
}).strict();

export const submitDecisionRequestSchema = z.object({
  roundIndex: z.number().int().nonnegative(),
  action: z.enum(['long', 'short', 'pass']),
  confidence: z.enum(['low', 'medium', 'high', 'all_in']).optional(),
  companyGuess: z.string().trim().min(1).max(100).optional(),
}).strict();

export const runIdSchema = z.string().min(1).max(128);

/** Mutation routes with no client input reject rather than ignore extra data. */
export const emptyMutationRequestSchema = z.object({}).strict();

const pageSchema = z.coerce.number().int().positive().default(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(50).default(25);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
});

export const leaderboardRequestSchema = z.discriminatedUnion('board', [
  z.object({
    board: z.literal('daily'),
    date: dateSchema,
    page: pageSchema,
    pageSize: pageSizeSchema,
  }).strict(),
  z.object({
    board: z.literal('classic'),
    difficulty: z.enum(['easy', 'medium', 'hard']).default('easy'),
    page: pageSchema,
    pageSize: pageSizeSchema,
  }).strict(),
  z.object({
    board: z.literal('signal'),
    page: pageSchema,
    pageSize: pageSizeSchema,
  }).strict(),
  z.object({
    board: z.literal('draft'),
    format: z.enum(['classic', 'quick', 'era']).default('classic'),
    page: pageSchema,
    pageSize: pageSizeSchema,
  }).strict(),
]);

export function leaderboardRequestInput(
  searchParams: URLSearchParams,
  today = new Date().toISOString().slice(0, 10),
): Record<string, string> {
  const input = Object.fromEntries(searchParams.entries());
  input.board ??= 'daily';
  if (input.board === 'daily') input.date ??= today;
  if (input.board === 'classic') input.difficulty ??= 'easy';
  if (input.board === 'draft') input.format ??= 'classic';
  return input;
}

export const publicDisplayNameRequestSchema = z.object({
  displayName: z.string()
    .trim()
    .min(3)
    .max(24)
    .regex(/^[A-Za-z0-9](?:[A-Za-z0-9 _-]*[A-Za-z0-9])?$/)
    .refine(
      (value) => !/^player-[a-z0-9]{4}$/i.test(value.trim()),
      'Names matching generated Player-XXXX aliases are reserved',
    )
    .nullable(),
}).strict();

export const createDraftRequestSchema = z.object({
  format: z.enum(['classic', 'quick', 'era']).default('classic'),
  eraId: z.string().min(1).max(128).optional(),
}).strict().superRefine((input, context) => {
  if (input.format === 'era' && !input.eraId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['eraId'], message: 'Era Draft needs an era' });
  }
});

/** Draft picks travel as card slots 0-5 — never as scenario ids. */
export const draftSelectionRequestSchema = z.object({
  slots: z.array(z.number().int().min(0).max(5)).min(2).max(3)
    .refine((slots) => new Set(slots).size === slots.length, {
      message: 'Draft picks must be distinct companies',
    }),
  allocations: z.array(z.number().int().min(10).max(60)).min(2).max(3),
}).strict().superRefine((input, context) => {
  if (input.allocations.length !== input.slots.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['allocations'], message: 'One allocation is required per pick' });
  }
  if (input.allocations.some((value) => value % 10 !== 0)
    || input.allocations.reduce((sum, value) => sum + value, 0) !== 100) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['allocations'], message: 'Allocations must use 10% increments and total 100%' });
  }
});

export const draftBattleFormatRequestSchema = z.object({
  format: z.enum(['classic', 'quick', 'era']),
  eraId: z.string().min(1).max(128).optional(),
  timerSeconds: z.union([z.null(), z.literal(120), z.literal(300)]).default(120),
}).strict().superRefine((input, context) => {
  if (input.format === 'era' && !input.eraId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['eraId'], message: 'Era Draft needs an era' });
  }
  if (input.format !== 'era' && input.eraId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['eraId'], message: 'Only Era Draft accepts an era' });
  }
});

export const draftBattleSubmissionRequestSchema = z.object({
  slots: z.array(z.number().int().min(0).max(5)).min(2).max(3),
  allocations: z.array(z.number().int().min(10).max(60)).min(2).max(3),
}).strict().superRefine((input, context) => {
  if (new Set(input.slots).size !== input.slots.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['slots'], message: 'Battle picks must be distinct' });
  }
  if (input.slots.length !== input.allocations.length
    || input.allocations.some((value) => value % 10 !== 0)
    || input.allocations.reduce((sum, value) => sum + value, 0) !== 100) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['allocations'], message: 'Allocations must use 10% increments and total 100%' });
  }
});

export const createBattleRequestSchema = z.object({
  difficulty: z.enum(['easy', 'medium', 'hard']),
  timerSeconds: z.union([
    z.null(),
    z.literal(30),
    z.literal(60),
    z.literal(120),
  ]).default(60),
}).strict();

export const inviteCodeRequestSchema = z.string().regex(/^[a-f0-9]{32}$/);

export const battleReadyRequestSchema = z.object({
  round: z.number().int().nonnegative(),
}).strict();

export const battleDecisionRequestSchema = z.object({
  roundIndex: z.number().int().nonnegative(),
  action: z.enum(['long', 'short', 'pass']),
  confidence: z.enum(['low', 'medium', 'high', 'all_in']).optional(),
  companyGuess: z.string().trim().min(1).max(100).optional(),
}).strict();

export async function parseEmptyMutationRequest(request: Request): Promise<boolean> {
  const text = await request.text();
  if (text.trim().length === 0) return true;
  try {
    return emptyMutationRequestSchema.safeParse(JSON.parse(text)).success;
  } catch {
    return false;
  }
}
