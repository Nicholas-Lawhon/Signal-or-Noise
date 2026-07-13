import type { Prisma, PrismaClient } from '@prisma/client';
import {
  areBankrollRanksTied,
  areSignalRanksTied,
  assignCompetitionRanks,
  compareBankrollRankMetrics,
  compareSignalRankMetrics,
} from '@signal-or-noise/game-engine';
import {
  draftLeaderboardQuerySchema,
  leaderboardQuerySchema,
} from '@signal-or-noise/shared-types';
import type {
  DraftLeaderboardPagePayload,
  DraftLeaderboardQuery,
  LeaderboardPagePayload,
  LeaderboardQuery,
  LeaderboardRowPayload,
} from '@signal-or-noise/shared-types';
import { ZodError } from 'zod';
import { DatabaseDomainError } from './errors';

// Query schemas and page payload types moved to the platform-neutral
// shared-types package; re-exported here for existing consumers.
export { draftLeaderboardQuerySchema, leaderboardQuerySchema };
export type {
  DraftLeaderboardPagePayload,
  DraftLeaderboardQuery,
  LeaderboardPagePayload,
  LeaderboardQuery,
  LeaderboardRowPayload,
};

const runSelect = {
  id: true,
  userId: true,
  finalBankroll: true,
  signalScore: true,
  correctCalls: true,
  passes: true,
  completionTimeMs: true,
  startedAt: true,
  completedAt: true,
  claimedAt: true,
  user: { select: { publicAlias: true, publicDisplayName: true } },
} satisfies Prisma.RunSelect;

type RunRow = Prisma.RunGetPayload<{ select: typeof runSelect }>;

type BankrollCandidate = {
  userId: string;
  publicName: string;
  finalBankroll: number;
  signalScore: number;
  correctCalls: number;
  passes: number;
  completionTimeMs: number;
  stableRunId: string;
  attainedAtMs: number;
};

type SignalCandidate = {
  userId: string;
  publicName: string;
  signalScore: number;
  correctCalls: number;
  passes: number;
  attainedAtMs: number;
};

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

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

function publicName(run: RunRow): string {
  if (!run.user) throw new DatabaseDomainError('INVALID_STATE', 'Leaderboard run lacks a user');
  return run.user.publicDisplayName ?? run.user.publicAlias;
}

function terminalTime(run: RunRow): number {
  const completedAt = run.completedAt;
  if (!completedAt) throw new DatabaseDomainError('INVALID_STATE', 'Finished run lacks completion time');
  return run.completionTimeMs
    ?? Math.min(2_147_483_647, Math.max(0, completedAt.getTime() - run.startedAt.getTime()));
}

function officialAttainmentMs(run: RunRow): number {
  const attainedAt = run.claimedAt ?? run.completedAt;
  if (!attainedAt) throw new DatabaseDomainError('INVALID_STATE', 'Official run lacks attainment time');
  return attainedAt.getTime();
}

function bankrollCandidate(run: RunRow): BankrollCandidate {
  if (!run.userId || run.finalBankroll === null) {
    throw new DatabaseDomainError('INVALID_STATE', 'Leaderboard run is missing canonical scores');
  }
  return {
    userId: run.userId,
    publicName: publicName(run),
    finalBankroll: toNumber(run.finalBankroll),
    signalScore: toNumber(run.signalScore),
    correctCalls: run.correctCalls,
    passes: run.passes,
    completionTimeMs: terminalTime(run),
    stableRunId: run.id,
    attainedAtMs: officialAttainmentMs(run),
  };
}

function chooseUserBest(runs: RunRow[]): BankrollCandidate[] {
  const best = new Map<string, BankrollCandidate>();
  for (const run of runs) {
    const candidate = bankrollCandidate(run);
    const current = best.get(candidate.userId);
    const comparison = current ? compareBankrollRankMetrics(candidate, current) : -1;
    if (
      !current
      || comparison < 0
      || (
        comparison === 0
        && (candidate.attainedAtMs < current.attainedAtMs
          || (
            candidate.attainedAtMs === current.attainedAtMs
            && candidate.stableRunId.localeCompare(current.stableRunId) < 0
          ))
      )
    ) {
      best.set(candidate.userId, candidate);
    }
  }
  return [...best.values()];
}

function pageResult<T extends BankrollCandidate | SignalCandidate>(
  candidates: T[],
  query: LeaderboardQuery,
  currentUserId: string | undefined,
  compare: (left: T, right: T) => number,
  areTied: (left: T, right: T) => boolean,
  toRow: (candidate: T, rank: number, isCurrentUser: boolean) => LeaderboardRowPayload,
): Pick<LeaderboardPagePayload, 'rows' | 'currentUserRow' | 'pagination'> {
  candidates.sort((left, right) => compare(left, right) || left.userId.localeCompare(right.userId));
  const ranked = assignCompetitionRanks(candidates, areTied);
  const offset = (query.page - 1) * query.pageSize;
  const rows = ranked.slice(offset, offset + query.pageSize).map(({ item, rank }) =>
    toRow(item, rank, item.userId === currentUserId));
  const current = currentUserId
    ? ranked.find(({ item }) => item.userId === currentUserId)
    : undefined;
  return {
    rows,
    currentUserRow: current
      ? toRow(current.item, current.rank, true)
      : null,
    pagination: {
      page: query.page,
      pageSize: query.pageSize,
      totalEntries: ranked.length,
      totalPages: Math.ceil(ranked.length / query.pageSize),
    },
  };
}

const finishedOfficialWhere = {
  isOfficial: true,
  userId: { not: null },
  status: { in: ['completed', 'bankrupt'] },
  finalBankroll: { not: null },
  completedAt: { not: null },
} satisfies Prisma.RunWhereInput;

export class LeaderboardService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Queries canonical immutable runs; there is no client-facing score write path. */
  async list(input: unknown, currentUserId?: string): Promise<LeaderboardPagePayload> {
    const query = parseInput(() => leaderboardQuerySchema.parse(input));
    if (query.board === 'classic') {
      const runs = await this.prisma.run.findMany({
        where: {
          ...finishedOfficialWhere,
          mode: 'classic_run',
          difficulty: query.difficulty,
        },
        select: runSelect,
      });
      return {
        selection: { board: 'classic', difficulty: query.difficulty },
        ...pageResult(
          chooseUserBest(runs),
          query,
          currentUserId,
          compareBankrollRankMetrics,
          areBankrollRanksTied,
          (candidate, rank, isCurrentUser) => ({
            rank,
            publicName: candidate.publicName,
            bankroll: candidate.finalBankroll,
            signalScore: candidate.signalScore,
            correctCalls: candidate.correctCalls,
            passes: candidate.passes,
            completionTimeMs: candidate.completionTimeMs,
            isCurrentUser,
          }),
        ),
      };
    }

    if (query.board === 'daily') {
      const runs = await this.prisma.run.findMany({
        where: {
          ...finishedOfficialWhere,
          mode: 'daily_challenge',
          dailyChallenge: {
            challengeDate: new Date(`${query.date}T00:00:00.000Z`),
          },
        },
        select: runSelect,
      });
      return {
        selection: { board: 'daily', date: query.date },
        ...pageResult(
          chooseUserBest(runs),
          query,
          currentUserId,
          compareBankrollRankMetrics,
          areBankrollRanksTied,
          (candidate, rank, isCurrentUser) => ({
            rank,
            publicName: candidate.publicName,
            bankroll: candidate.finalBankroll,
            signalScore: candidate.signalScore,
            correctCalls: candidate.correctCalls,
            passes: candidate.passes,
            completionTimeMs: candidate.completionTimeMs,
            isCurrentUser,
          }),
        ),
      };
    }

    const runs = await this.prisma.run.findMany({
      where: finishedOfficialWhere,
      select: runSelect,
    });
    const byUser = new Map<string, SignalCandidate>();
    for (const run of runs) {
      if (!run.userId) continue;
      const current = byUser.get(run.userId) ?? {
        userId: run.userId,
        publicName: publicName(run),
        signalScore: 0,
        correctCalls: 0,
        passes: 0,
        attainedAtMs: 0,
      };
      current.signalScore += toNumber(run.signalScore);
      current.correctCalls += run.correctCalls;
      current.passes += run.passes;
      current.attainedAtMs = Math.max(current.attainedAtMs, officialAttainmentMs(run));
      byUser.set(run.userId, current);
    }
    return {
      selection: { board: 'signal' },
      ...pageResult(
        [...byUser.values()],
        query,
        currentUserId,
        compareSignalRankMetrics,
        areSignalRanksTied,
        (candidate, rank, isCurrentUser) => ({
          rank,
          publicName: candidate.publicName,
          bankroll: null,
          signalScore: candidate.signalScore,
          correctCalls: candidate.correctCalls,
          passes: candidate.passes,
          completionTimeMs: null,
          isCurrentUser,
        }),
      ),
    };
  }

  /** All-time best official solo Draft result per player and format. */
  async listDraft(input: unknown, currentUserId?: string): Promise<DraftLeaderboardPagePayload> {
    const query = parseInput(() => draftLeaderboardQuerySchema.parse(input));
    const entries = await this.prisma.draftLeaderboardEntry.findMany({
      where: { format: query.format },
      orderBy: [{ finalValue: 'desc' }, { gapFromOptimal: 'asc' }, { completedAt: 'asc' }, { userId: 'asc' }],
      include: { user: { select: { publicAlias: true, publicDisplayName: true } } },
    });
    const ranked: Array<{ entry: typeof entries[number]; rank: number }> = [];
    entries.forEach((entry, index) => {
      const previous = entries[index - 1];
      const sameRank = previous
        && Number(previous.finalValue) === Number(entry.finalValue)
        && Number(previous.gapFromOptimal) === Number(entry.gapFromOptimal)
        && previous.completedAt.getTime() === entry.completedAt.getTime();
      ranked.push({ entry, rank: sameRank ? ranked[index - 1].rank : index + 1 });
    });
    const toRow = (item: typeof ranked[number]) => ({
      rank: item.rank,
      publicName: item.entry.user.publicDisplayName ?? item.entry.user.publicAlias,
      finalValue: Number(item.entry.finalValue),
      gapFromOptimal: Number(item.entry.gapFromOptimal),
      completedAt: item.entry.completedAt.toISOString(),
      isCurrentUser: item.entry.userId === currentUserId,
    });
    const offset = (query.page - 1) * query.pageSize;
    const rows = ranked.slice(offset, offset + query.pageSize).map(toRow);
    const current = currentUserId ? ranked.find((item) => item.entry.userId === currentUserId) : undefined;
    return {
      format: query.format,
      rows,
      currentUserRow: current ? toRow(current) : null,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        totalEntries: ranked.length,
        totalPages: Math.ceil(ranked.length / query.pageSize),
      },
    };
  }
}
