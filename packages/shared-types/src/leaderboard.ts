import { z } from 'zod';

const pageFields = {
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(50).default(25),
};

const calendarDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'Date must be a real UTC calendar date');

export const leaderboardQuerySchema = z.discriminatedUnion('board', [
  z.object({
    board: z.literal('daily'),
    date: calendarDateSchema,
    ...pageFields,
  }).strict(),
  z.object({
    board: z.literal('classic'),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    ...pageFields,
  }).strict(),
  z.object({
    board: z.literal('signal'),
    ...pageFields,
  }).strict(),
]);

export const draftLeaderboardQuerySchema = z.object({
  format: z.enum(['classic', 'quick', 'era']),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().min(1).max(50).default(25),
}).strict();

export type DraftLeaderboardQuery = z.infer<typeof draftLeaderboardQuerySchema>;

// DraftLeaderboardPagePayload lives in ./contracts; the duplicate definition
// that previously existed in the database leaderboard service was dropped.

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;

export type LeaderboardRowPayload = {
  rank: number;
  publicName: string;
  bankroll: number | null;
  signalScore: number;
  correctCalls: number;
  passes: number;
  completionTimeMs: number | null;
  isCurrentUser: boolean;
};

export type LeaderboardPagePayload = {
  selection:
    | { board: 'daily'; date: string }
    | { board: 'classic'; difficulty: 'easy' | 'medium' | 'hard' }
    | { board: 'signal' };
  rows: LeaderboardRowPayload[];
  currentUserRow: LeaderboardRowPayload | null;
  pagination: {
    page: number;
    pageSize: number;
    totalEntries: number;
    totalPages: number;
  };
};
