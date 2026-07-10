import type { Prisma, PrismaClient } from '@prisma/client';
import type { ScenarioOrderEntry } from './contracts';
import { DatabaseDomainError } from './errors';

const ROTATION_EPOCH_MS = Date.UTC(2026, 0, 1);
const DAILY_ROUNDS = 10;

export type DailyChallengeSchedule = {
  id: string;
  challengeDate: Date;
  startingBankroll: number;
  scenarioOrder: ScenarioOrderEntry[];
};

export type DailyChallengeOverview = {
  date: string;
  totalRounds: number;
  difficulties: Array<'easy' | 'medium' | 'hard'>;
  startingBankroll: number;
};

function number(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

export function utcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function utcDateKey(date: Date): string {
  return utcDay(date).toISOString().slice(0, 10);
}

export function rotationIndex(date: Date, poolCount: number): number {
  if (!Number.isInteger(poolCount) || poolCount < 1) {
    throw new Error('poolCount must be a positive integer');
  }
  const offset = Math.floor((utcDay(date).getTime() - ROTATION_EPOCH_MS) / 86_400_000);
  return ((offset % poolCount) + poolCount) % poolCount;
}

function parseScenarioOrder(value: Prisma.JsonValue): ScenarioOrderEntry[] {
  if (!Array.isArray(value) || value.length !== DAILY_ROUNDS) {
    throw new DatabaseDomainError('INVALID_STATE', 'Daily Challenge snapshot is invalid');
  }
  const entries = value.map((entry) => {
    if (
      typeof entry !== 'object'
      || entry === null
      || Array.isArray(entry)
    ) {
      throw new DatabaseDomainError('INVALID_STATE', 'Daily Challenge snapshot is invalid');
    }
    const candidate = entry as Record<string, unknown>;
    if (
      typeof candidate.scenarioId !== 'string'
      || !['easy', 'medium', 'hard'].includes(String(candidate.difficulty))
    ) {
      throw new DatabaseDomainError('INVALID_STATE', 'Daily Challenge snapshot is invalid');
    }
    return {
      scenarioId: candidate.scenarioId,
      difficulty: candidate.difficulty as ScenarioOrderEntry['difficulty'],
    };
  });
  if (new Set(entries.map((entry) => entry.scenarioId)).size !== entries.length) {
    throw new DatabaseDomainError('INVALID_STATE', 'Daily Challenge snapshot has duplicate scenarios');
  }
  return entries;
}

function toSchedule(challenge: {
  id: string;
  challengeDate: Date;
  startingBankroll: Prisma.Decimal | number;
  scenarioOrder: Prisma.JsonValue;
}): DailyChallengeSchedule {
  return {
    id: challenge.id,
    challengeDate: challenge.challengeDate,
    startingBankroll: number(challenge.startingBankroll),
    scenarioOrder: parseScenarioOrder(challenge.scenarioOrder),
  };
}

function isUniqueError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

/**
 * Resolves one UTC date to its published challenge. A date is lazily
 * materialized from the deterministic sorted-pool rotation. The unique day key
 * means concurrent publication attempts converge on one immutable snapshot.
 */
export async function materializeDailyChallengeForDate(
  prisma: PrismaClient,
  date: Date,
): Promise<DailyChallengeSchedule> {
  const challengeDate = utcDay(date);
  const existing = await prisma.dailyChallenge.findUnique({
    where: { challengeDate },
    select: {
      id: true,
      challengeDate: true,
      startingBankroll: true,
      scenarioOrder: true,
    },
  });
  if (existing) return toSchedule(existing);

  const pools = await prisma.dailyChallengePool.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      startingBankroll: true,
      entries: {
        orderBy: { ordinal: 'asc' },
        select: { scenarioId: true, difficulty: true },
      },
    },
  });
  if (pools.length === 0) {
    throw new DatabaseDomainError('NOT_FOUND', 'No Daily Challenge is published yet');
  }
  const pool = pools[rotationIndex(challengeDate, pools.length)];
  if (pool.entries.length !== DAILY_ROUNDS) {
    throw new DatabaseDomainError('INVALID_STATE', 'Daily Challenge pool must contain exactly 10 rounds');
  }
  const scenarioOrder = pool.entries.map((entry) => ({
    scenarioId: entry.scenarioId,
    difficulty: entry.difficulty,
  }));
  if (new Set(scenarioOrder.map((entry) => entry.scenarioId)).size !== scenarioOrder.length) {
    throw new DatabaseDomainError('INVALID_STATE', 'Daily Challenge pool has duplicate scenarios');
  }

  try {
    const created = await prisma.dailyChallenge.create({
      data: {
        challengeDate,
        poolId: pool.id,
        startingBankroll: pool.startingBankroll,
        scenarioOrder,
      },
      select: {
        id: true,
        challengeDate: true,
        startingBankroll: true,
        scenarioOrder: true,
      },
    });
    return toSchedule(created);
  } catch (error) {
    if (!isUniqueError(error)) throw error;
    const published = await prisma.dailyChallenge.findUnique({
      where: { challengeDate },
      select: {
        id: true,
        challengeDate: true,
        startingBankroll: true,
        scenarioOrder: true,
      },
    });
    if (!published) throw error;
    return toSchedule(published);
  }
}

export async function findDailyChallengeForDate(
  prisma: PrismaClient,
  date: Date,
): Promise<DailyChallengeSchedule | null> {
  const challenge = await prisma.dailyChallenge.findUnique({
    where: { challengeDate: utcDay(date) },
    select: {
      id: true,
      challengeDate: true,
      startingBankroll: true,
      scenarioOrder: true,
    },
  });
  return challenge ? toSchedule(challenge) : null;
}

/** Finds an already-published immutable snapshot without materializing another date. */
export async function findDailyChallengeById(
  prisma: PrismaClient,
  id: string,
): Promise<DailyChallengeSchedule | null> {
  const challenge = await prisma.dailyChallenge.findUnique({
    where: { id },
    select: {
      id: true,
      challengeDate: true,
      startingBankroll: true,
      scenarioOrder: true,
    },
  });
  return challenge ? toSchedule(challenge) : null;
}

export function toDailyChallengeOverview(schedule: DailyChallengeSchedule): DailyChallengeOverview {
  return {
    date: utcDateKey(schedule.challengeDate),
    totalRounds: schedule.scenarioOrder.length,
    difficulties: ['easy', 'medium', 'hard'].filter((difficulty) =>
      schedule.scenarioOrder.some((entry) => entry.difficulty === difficulty),
    ) as DailyChallengeOverview['difficulties'],
    startingBankroll: schedule.startingBankroll,
  };
}
