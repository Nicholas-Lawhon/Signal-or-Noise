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
  mode: z.enum(['classic_run', 'daily_challenge']).optional(),
  dailyChallengeId: z.string().min(1).max(128).optional(),
}).strict().superRefine((input, context) => {
  if (input.dailyChallengeId !== undefined && input.mode !== 'daily_challenge') {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['dailyChallengeId'],
      message: 'Daily challenge IDs require daily_challenge mode',
    });
  }
});

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

export const claimCompletedGuestRunSchema = z.object({
  userId: z.string().min(1).max(128),
  guestSessionId: z.string().uuid(),
  runId: z.string().min(1).max(128),
}).strict();

export const getRunSummarySchema = z.object({
  owner: runOwnerSchema,
  runId: z.string().min(1).max(128),
}).strict();

export const ensureUserForExternalAuthSchema = z.object({
  externalAuthId: z.string().min(1).max(255),
  email: z.string().email().max(320).optional(),
  displayName: z.string().trim().min(1).max(120).optional(),
}).strict();

export const getPlayerStatsSchema = z.object({
  userId: z.string().min(1).max(128),
}).strict();

export const getPublicIdentitySchema = z.object({
  userId: z.string().min(1).max(128),
}).strict();

export const updatePublicIdentitySchema = z.object({
  userId: z.string().min(1).max(128),
  displayName: z.string()
    .trim()
    .min(3)
    .max(24)
    .regex(
      /^[A-Za-z0-9](?:[A-Za-z0-9 _-]*[A-Za-z0-9])?$/,
      'Use letters, numbers, spaces, hyphens, or underscores',
    )
    .refine(
      (value) => !/^player-[a-z0-9]{4}$/i.test(value.trim()),
      'Names matching generated Player-XXXX aliases are reserved',
    )
    .nullable(),
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

export type DailyChallengePayload = {
  date: string;
  totalRounds: number;
  difficulties: Array<'easy' | 'medium' | 'hard'>;
  startingBankroll: number;
};

export type RunSummaryTradePayload = {
  companyName: string;
  pnlAmount: number;
};

export type RunSummaryPayload = {
  id: string;
  mode: 'classic_run' | 'daily_challenge';
  difficulty: 'easy' | 'medium' | 'hard' | null;
  status: 'completed' | 'bankrupt';
  isOfficial: boolean;
  claimed: boolean;
  claimable: boolean;
  startingBankroll: number;
  finalBankroll: number;
  signalScore: number;
  totalRounds: number;
  completedRounds: number;
  correctCalls: number;
  wrongCalls: number;
  passes: number;
  companiesCalled: number;
  bestStreak: number;
  completionTimeMs: number | null;
  bestTrade: RunSummaryTradePayload | null;
  worstTrade: RunSummaryTradePayload | null;
};

export type PlayerStatsPayload = {
  totalRuns: number;
  completedRuns: number;
  totalRounds: number;
  correctCalls: number;
  wrongCalls: number;
  passes: number;
  totalSignalScore: number;
  bestRunBankroll: number | null;
  averageFinalBankroll: number | null;
  bestStreak: number;
};

export type PublicIdentityPayload = {
  alias: string;
  displayName: string | null;
  publicName: string;
};

export type RevealPayload = {
  scenarioId: string;
  companyName: string;
  ticker: string;
  outcomeLabel: string;
  endingPrice: number;
  actualReturnPercent: number;
  shortText: string;
  funFact: string;
  whyItMoved: string[];
  outcomeChart: Array<{ date: string; price: number }>;
};
