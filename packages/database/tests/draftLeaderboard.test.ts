import { Prisma } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { LeaderboardService } from '../src/leaderboardService';
import { isBetterDraftLeaderboardResult } from '../src/draftService';

describe('Draft leaderboard ranking', () => {
  it('replaces only with a better solo result and retains equal or worse replays', () => {
    const current = { finalValue: 12_000, gapFromOptimal: 500, completedAt: new Date('2026-01-02T00:00:00.000Z') };
    expect(isBetterDraftLeaderboardResult(
      { finalValue: 12_001, gapFromOptimal: 9_999, completedAt: new Date('2026-02-01T00:00:00.000Z') },
      current,
    )).toBe(true);
    expect(isBetterDraftLeaderboardResult(
      { finalValue: 12_000, gapFromOptimal: 499, completedAt: new Date('2026-02-01T00:00:00.000Z') },
      current,
    )).toBe(true);
    expect(isBetterDraftLeaderboardResult(
      { finalValue: 12_000, gapFromOptimal: 500, completedAt: new Date('2026-01-01T00:00:00.000Z') },
      current,
    )).toBe(true);
    expect(isBetterDraftLeaderboardResult({ ...current }, current)).toBe(false);
    expect(isBetterDraftLeaderboardResult(
      { finalValue: 11_999, gapFromOptimal: 0, completedAt: new Date('2025-01-01T00:00:00.000Z') },
      current,
    )).toBe(false);
  });

  it('keeps three exact ties on the same rank and leaves the next placement gapped', async () => {
    const completedAt = new Date('2026-01-01T00:00:00.000Z');
    const entries = ['a', 'b', 'c', 'd'].map((userId, index) => ({
      id: `entry-${userId}`, userId, draftId: `draft-${userId}`, format: 'quick' as const,
      finalValue: new Prisma.Decimal(index < 3 ? 12000 : 11000),
      gapFromOptimal: new Prisma.Decimal(index < 3 ? 100 : 200),
      completedAt, createdAt: completedAt,
      user: { publicAlias: userId.toUpperCase(), publicDisplayName: null },
    }));
    const prisma = {
      draftLeaderboardEntry: { findMany: async () => entries },
    } as unknown as PrismaClient;
    const page = await new LeaderboardService(prisma).listDraft({ format: 'quick', page: 1, pageSize: 10 });
    expect(page.rows.map((row) => row.rank)).toEqual([1, 1, 1, 4]);
  });
});
