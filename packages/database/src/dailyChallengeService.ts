import type { PrismaClient } from '@prisma/client';

/**
 * Looks up the Daily Challenge scheduled for a UTC calendar date. Phase 6 only
 * gates entry; challenge scheduling and gameplay arrive with the Daily phase.
 */
export async function findDailyChallengeForDate(
  prisma: PrismaClient,
  date: Date,
): Promise<{ id: string; challengeDate: Date } | null> {
  const utcDay = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  ));
  return prisma.dailyChallenge.findUnique({
    where: { challengeDate: utcDay },
    select: { id: true, challengeDate: true },
  });
}
