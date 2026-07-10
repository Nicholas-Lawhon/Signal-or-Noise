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

export async function parseEmptyMutationRequest(request: Request): Promise<boolean> {
  const text = await request.text();
  if (text.trim().length === 0) return true;
  try {
    return emptyMutationRequestSchema.safeParse(JSON.parse(text)).success;
  } catch {
    return false;
  }
}
