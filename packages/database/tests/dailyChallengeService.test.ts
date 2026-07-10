import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import {
  materializeDailyChallengeForDate,
  rotationIndex,
  utcDateKey,
  utcDay,
} from '../src/dailyChallengeService';

function snapshotEntries(prefix: string) {
  const difficulties = ['easy', 'medium', 'hard', 'easy', 'medium', 'hard', 'easy', 'medium', 'hard', 'medium'] as const;
  return difficulties.map((difficulty, index) => ({ scenarioId: `${prefix}_${index}`, difficulty }));
}

describe('Daily Challenge UTC rotation', () => {
  it('normalizes every instant in a UTC day to the same calendar date', () => {
    expect(utcDateKey(new Date('2026-07-10T00:00:00.000Z'))).toBe('2026-07-10');
    expect(utcDateKey(new Date('2026-07-10T23:59:59.999Z'))).toBe('2026-07-10');
    expect(utcDay(new Date('2026-07-10T23:59:59.999Z')).toISOString())
      .toBe('2026-07-10T00:00:00.000Z');
  });

  it('rotates deterministically across UTC midnight and wraps the fixed pool list', () => {
    const beforeMidnight = new Date('2026-07-10T23:59:59.999Z');
    const afterMidnight = new Date('2026-07-11T00:00:00.000Z');
    expect(rotationIndex(beforeMidnight, 10)).toBe(rotationIndex(new Date('2026-07-10T12:00:00Z'), 10));
    expect(rotationIndex(afterMidnight, 10)).toBe((rotationIndex(beforeMidnight, 10) + 1) % 10);
    expect(rotationIndex(new Date('2025-12-31T12:00:00Z'), 10)).toBe(9);
  });

  it('rejects invalid rotation pool counts', () => {
    expect(() => rotationIndex(new Date(), 0)).toThrow('poolCount must be a positive integer');
    expect(() => rotationIndex(new Date(), 1.5)).toThrow('poolCount must be a positive integer');
  });

  it('converges concurrent publication on one immutable schedule snapshot', async () => {
    const date = new Date('2026-07-10T12:00:00.000Z');
    const pools = [
      { id: 'daily_pool_001', startingBankroll: 10000, entries: snapshotEntries('first') },
      { id: 'daily_pool_002', startingBankroll: 10000, entries: snapshotEntries('second') },
    ];
    let published: {
      id: string;
      challengeDate: Date;
      startingBankroll: number;
      scenarioOrder: ReturnType<typeof snapshotEntries>;
    } | null = null;
    const create = vi.fn(async (input: {
      data: {
        challengeDate: Date;
        startingBankroll: number;
        scenarioOrder: ReturnType<typeof snapshotEntries>;
      };
    }) => {
      await Promise.resolve();
      if (published) {
        const error = Object.assign(new Error('unique date'), { code: 'P2002' });
        throw error;
      }
      published = {
        id: 'published_daily',
        challengeDate: input.data.challengeDate,
        startingBankroll: input.data.startingBankroll,
        scenarioOrder: input.data.scenarioOrder,
      };
      return published;
    });
    const prisma = {
      dailyChallenge: {
        findUnique: vi.fn(async () => published),
        create,
      },
      dailyChallengePool: {
        findMany: vi.fn(async () => pools),
      },
    } as unknown as PrismaClient;

    const schedules = await Promise.all([
      materializeDailyChallengeForDate(prisma, date),
      materializeDailyChallengeForDate(prisma, date),
    ]);

    expect(schedules[0]).toEqual(schedules[1]);
    expect(schedules[0].id).toBe('published_daily');
    expect(create).toHaveBeenCalledTimes(2);
    expect(schedules[0].scenarioOrder).toHaveLength(10);

    pools[0].entries = snapshotEntries('changed_after_publish');
    await expect(materializeDailyChallengeForDate(prisma, date))
      .resolves.toEqual(schedules[0]);
  });
});
