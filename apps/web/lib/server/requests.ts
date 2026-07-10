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
]);

export function leaderboardRequestInput(
  searchParams: URLSearchParams,
  today = new Date().toISOString().slice(0, 10),
): Record<string, string> {
  const input = Object.fromEntries(searchParams.entries());
  input.board ??= 'daily';
  if (input.board === 'daily') input.date ??= today;
  if (input.board === 'classic') input.difficulty ??= 'easy';
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

export async function parseEmptyMutationRequest(request: Request): Promise<boolean> {
  const text = await request.text();
  if (text.trim().length === 0) return true;
  try {
    return emptyMutationRequestSchema.safeParse(JSON.parse(text)).success;
  } catch {
    return false;
  }
}
