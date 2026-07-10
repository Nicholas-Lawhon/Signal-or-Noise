import { z } from 'zod';

export const runOwnerSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('guest'),
    guestSessionId: z.string().uuid(),
  }).strict(),
  z.object({
    kind: z.literal('user'),
    userId: z.string().min(1).max(128),
  }).strict(),
]);

export type RunOwner = z.infer<typeof runOwnerSchema>;

export const createClassicRunSchema = z.object({
  owner: runOwnerSchema,
  difficulty: z.enum(['easy', 'medium', 'hard']),
}).strict();

export const createDailyChallengeRunSchema = z.object({
  owner: runOwnerSchema,
  dailyChallengeId: z.string().min(1).max(128),
}).strict();

export const getCurrentRunSchema = z.object({
  owner: runOwnerSchema,
}).strict();

export const submitRoundDecisionSchema = z.object({
  owner: runOwnerSchema,
  runId: z.string().min(1).max(128),
  roundIndex: z.number().int().nonnegative(),
  action: z.enum(['long', 'short', 'pass']),
  confidence: z.enum(['low', 'medium', 'high', 'all_in']).optional(),
  companyGuess: z.string().trim().min(1).max(100).optional(),
}).strict().superRefine((input, context) => {
  if (input.action === 'pass' && input.confidence !== undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confidence'],
      message: 'Pass decisions must not include confidence',
    });
  }
  if (input.action !== 'pass' && input.confidence === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confidence'],
      message: 'Long and short decisions require confidence',
    });
  }
});

export const createLeaderboardEntrySchema = z.object({
  owner: runOwnerSchema,
  runId: z.string().min(1).max(128),
  leaderboardType: z.enum([
    'daily_challenge_bankroll',
    'best_classic_run_bankroll',
    'all_time_signal_score',
    'weekly_bankroll',
    'monthly_bankroll',
  ]),
  periodKey: z.string().min(1).max(64).optional(),
}).strict();

export type ScenarioOrderEntry = {
  scenarioId: string;
  difficulty: 'easy' | 'medium' | 'hard';
};

export const scenarioOrderSchema = z.array(z.object({
  scenarioId: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard']),
}).strict()).min(1);

export type PreDecisionRoundPayload = {
  roundIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
  title: string;
  decisionDateLabel: string;
  holdingPeriodLabel: string;
  companyDescription: string;
  macroContext: string;
  situation: string;
  longCase: string;
  shortCase: string;
  setupHints: string[];
  lookbackChart: Array<{ date: string; price: number }>;
};

export type CurrentRunPayload = {
  id: string;
  mode: 'classic_run' | 'daily_challenge';
  difficulty: 'easy' | 'medium' | 'hard' | null;
  status: 'in_progress';
  isOfficial: boolean;
  startingBankroll: number;
  currentBankroll: number;
  signalScore: number;
  totalRounds: number;
  completedRounds: number;
  currentRoundIndex: number;
  currentStreak: number;
  bestStreak: number;
  round: PreDecisionRoundPayload;
};

export type RevealPayload = {
  scenarioId: string;
  companyName: string;
  ticker: string;
  endingPrice: number;
  actualReturnPercent: number;
  shortText: string;
  funFact: string;
  whyItMoved: string[];
  outcomeChart: Array<{ date: string; price: number }>;
};
