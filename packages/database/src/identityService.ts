import type { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';
import {
  ensureUserForExternalAuthSchema,
  getPlayerStatsSchema,
} from './contracts';
import type { PlayerStatsPayload } from './contracts';
import { DatabaseDomainError } from './errors';

function parseInput<T>(parse: () => T): T {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new DatabaseDomainError(
        'INVALID_INPUT',
        error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
      );
    }
    throw error;
  }
}

/**
 * Idempotently maps a verified provider identity (Clerk user ID) to the internal
 * User row. The externalAuthId must come from the server-verified session only —
 * never from request data. Email/display name are best-effort profile mirrors;
 * a unique-email race with another row must never block sign-in, so the upsert
 * retries without the email.
 */
export async function ensureUserForExternalAuth(
  prisma: PrismaClient,
  input: unknown,
): Promise<{ id: string; displayName: string | null }> {
  const parsed = parseInput(() => ensureUserForExternalAuthSchema.parse(input));
  const upsert = (withEmail: boolean) => prisma.user.upsert({
    where: { externalAuthId: parsed.externalAuthId },
    create: {
      externalAuthId: parsed.externalAuthId,
      email: withEmail ? parsed.email : undefined,
      displayName: parsed.displayName,
    },
    update: {
      email: withEmail ? parsed.email : undefined,
      displayName: parsed.displayName,
    },
    select: { id: true, displayName: true },
  });
  try {
    return await upsert(true);
  } catch (error) {
    if (
      typeof error === 'object' && error !== null &&
      'code' in error && error.code === 'P2002'
    ) {
      return upsert(false);
    }
    throw error;
  }
}

/** Saved stats for an authenticated user; null until their first finished run. */
export async function getPlayerStats(
  prisma: PrismaClient,
  input: unknown,
): Promise<PlayerStatsPayload | null> {
  const parsed = parseInput(() => getPlayerStatsSchema.parse(input));
  const stats = await prisma.playerStats.findUnique({ where: { userId: parsed.userId } });
  if (!stats) return null;
  return {
    totalRuns: stats.totalRuns,
    completedRuns: stats.completedRuns,
    totalRounds: stats.totalRounds,
    correctCalls: stats.correctCalls,
    wrongCalls: stats.wrongCalls,
    passes: stats.passes,
    totalSignalScore: stats.totalSignalScore.toNumber(),
    bestRunBankroll: stats.bestRunBankroll?.toNumber() ?? null,
    averageFinalBankroll: stats.averageFinalBankroll?.toNumber() ?? null,
    bestStreak: stats.bestStreak,
  };
}
