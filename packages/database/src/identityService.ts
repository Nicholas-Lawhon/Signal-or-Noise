import { randomInt } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';
import {
  ensureUserForExternalAuthSchema,
  getPublicIdentitySchema,
  getPlayerStatsSchema,
  updatePublicIdentitySchema,
} from './contracts';
import type { PlayerStatsPayload, PublicIdentityPayload } from './contracts';
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
  const upsert = (withEmail: boolean, publicAlias: string) => prisma.user.upsert({
    where: { externalAuthId: parsed.externalAuthId },
    create: {
      externalAuthId: parsed.externalAuthId,
      email: withEmail ? parsed.email : undefined,
      displayName: parsed.displayName,
      publicAlias,
    },
    update: {
      email: withEmail ? parsed.email : undefined,
      displayName: parsed.displayName,
    },
    select: { id: true, displayName: true },
  });
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const publicAlias = `Player-${randomInt(36 ** 4).toString(36).toUpperCase().padStart(4, '0')}`;
    try {
      return await upsert(true, publicAlias);
    } catch (error) {
      if (!isUniqueConflict(error)) throw error;
      try {
        // A duplicate private email must never block sign-in. This also retries
        // the create path when the generated four-character alias collided.
        return await upsert(false, publicAlias);
      } catch (retryError) {
        if (!isUniqueConflict(retryError)) throw retryError;
      }
    }
  }
  throw new DatabaseDomainError('CONFLICT', 'Could not allocate a public player alias');
}

function isUniqueConflict(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

function publicIdentity(user: {
  publicAlias: string;
  publicDisplayName: string | null;
}): PublicIdentityPayload {
  return {
    alias: user.publicAlias,
    displayName: user.publicDisplayName,
    publicName: user.publicDisplayName ?? user.publicAlias,
  };
}

/** Returns only the identity fields the player has explicitly made public. */
export async function getPublicIdentity(
  prisma: PrismaClient,
  input: unknown,
): Promise<PublicIdentityPayload> {
  const parsed = parseInput(() => getPublicIdentitySchema.parse(input));
  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { publicAlias: true, publicDisplayName: true },
  });
  if (!user) throw new DatabaseDomainError('NOT_FOUND', 'User not found');
  return publicIdentity(user);
}

/** Sets an optional, case-insensitively unique name chosen for public display. */
export async function updatePublicIdentity(
  prisma: PrismaClient,
  input: unknown,
): Promise<PublicIdentityPayload> {
  const parsed = parseInput(() => updatePublicIdentitySchema.parse(input));
  const displayName = parsed.displayName?.replace(/\s+/g, ' ').trim() ?? null;
  const normalized = displayName?.normalize('NFKC').toLocaleLowerCase('en-US') ?? null;
  try {
    const user = await prisma.user.update({
      where: { id: parsed.userId },
      data: {
        publicDisplayName: displayName,
        publicDisplayNameNormalized: normalized,
      },
      select: { publicAlias: true, publicDisplayName: true },
    });
    return publicIdentity(user);
  } catch (error) {
    if (isUniqueConflict(error)) {
      throw new DatabaseDomainError('CONFLICT', 'That leaderboard name is already taken');
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025') {
      throw new DatabaseDomainError('NOT_FOUND', 'User not found');
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
