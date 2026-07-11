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

// ---------------------------------------------------------------------------
// Portfolio Draft (D052)
//
// Pre-selection cards are addressed by slot index 0-5, never by scenario id:
// production scenario ids embed company names, so exposing them before the
// reveal would cross the pre-decision boundary.
// ---------------------------------------------------------------------------

export const createPortfolioDraftSchema = z.object({
  owner: runOwnerSchema,
}).strict();

export const getPortfolioDraftSchema = z.object({
  owner: runOwnerSchema,
  draftId: z.string().min(1).max(128),
}).strict();

export const getCurrentPortfolioDraftSchema = z.object({
  owner: runOwnerSchema,
}).strict();

export const submitDraftSelectionSchema = z.object({
  owner: runOwnerSchema,
  draftId: z.string().min(1).max(128),
  slots: z.array(z.number().int().min(0).max(5)).length(3)
    .refine((slots) => new Set(slots).size === slots.length, {
      message: 'Draft picks must be three distinct companies',
    }),
}).strict();

export type DraftCardPayload = {
  slot: number;
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

export type CurrentDraftPayload = {
  id: string;
  status: 'in_progress';
  isOfficial: boolean;
  budget: number;
  windowLabel: string;
  cards: DraftCardPayload[];
};

export type DraftRevealCompanyPayload = {
  slot: number;
  title: string;
  companyName: string;
  ticker: string;
  actualReturnPercent: number;
  selected: boolean;
  optimal: boolean;
  /** Final value of this company's equal slice; null when not selected. */
  sliceValue: number | null;
};

export type CompletedDraftPayload = {
  id: string;
  status: 'completed';
  isOfficial: boolean;
  budget: number;
  windowLabel: string;
  finalValue: number;
  optimalValue: number;
  gapFromOptimal: number;
  companies: DraftRevealCompanyPayload[];
};

export type DraftPayload = CurrentDraftPayload | CompletedDraftPayload;

// ---------------------------------------------------------------------------
// Friend Battle (D052)
// ---------------------------------------------------------------------------

export const battleTimerSchema = z.union([
  z.null(),
  z.literal(30),
  z.literal(60),
  z.literal(120),
]);

export const createBattleSchema = z.object({
  userId: z.string().min(1).max(128),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  /** Per-round timer (D052): off, 30, 60, or 120 seconds; 60 is the default. */
  timerSeconds: battleTimerSchema.default(60),
}).strict();

export const inviteCodeSchema = z.string().regex(/^[a-f0-9]{32}$/);

export const battleInviteSchema = z.object({
  userId: z.string().min(1).max(128),
  inviteCode: inviteCodeSchema,
}).strict();

export const getBattleStateSchema = z.object({
  userId: z.string().min(1).max(128),
  battleId: z.string().min(1).max(128),
}).strict();

export const listBattlesSchema = z.object({
  userId: z.string().min(1).max(128),
}).strict();

export const battleReadySchema = z.object({
  userId: z.string().min(1).max(128),
  battleId: z.string().min(1).max(128),
  round: z.number().int().nonnegative(),
}).strict();

export const submitBattleDecisionSchema = z.object({
  userId: z.string().min(1).max(128),
  battleId: z.string().min(1).max(128),
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

export type BattleStatusValue =
  | 'awaiting_opponent'
  | 'awaiting_ready'
  | 'in_progress'
  | 'completed'
  | 'expired';

export type BattleTimer = 30 | 60 | 120 | null;

export type BattleInvitePreviewPayload = {
  battleId: string;
  creatorName: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timerSeconds: BattleTimer;
  totalRounds: number;
  startingBankroll: number;
  /** False when already joined, expired, or otherwise not open. */
  joinable: boolean;
  status: BattleStatusValue;
  expiresAt: string;
};

export type BattleListEntryPayload = {
  id: string;
  status: BattleStatusValue;
  difficulty: 'easy' | 'medium' | 'hard';
  timerSeconds: BattleTimer;
  totalRounds: number;
  currentRoundIndex: number;
  opponentName: string | null;
  outcome: 'you_won' | 'you_lost' | 'draw' | null;
  createdAt: string;
  expiresAt: string;
};

/** Prior-round call safe to show on the opponent progress card (D052). */
export type BattleOpponentLastCallPayload = {
  roundIndex: number;
  action: 'long' | 'short' | 'pass';
  confidence: 'low' | 'medium' | 'high' | 'all_in' | null;
  companyGuess: string | null;
};

export type BattleSelfPayload = {
  name: string;
  bankroll: number;
  signalScore: number;
  isBankrupt: boolean;
  readyRound: number;
  hasDecidedCurrentRound: boolean;
  /** Echo of your own locked call for reconnects; never includes results. */
  currentCall?: {
    action: 'long' | 'short' | 'pass';
    confidence: 'low' | 'medium' | 'high' | 'all_in' | null;
    companyGuess: string | null;
  };
};

export type BattleOpponentPayload = {
  name: string;
  bankroll: number;
  signalScore: number;
  isBankrupt: boolean;
  readyRound: number;
  hasDecidedCurrentRound: boolean;
  lastCall: BattleOpponentLastCallPayload | null;
};

export type BattleDecisionPayload = {
  roundIndex: number;
  action: 'long' | 'short' | 'pass';
  confidence: 'low' | 'medium' | 'high' | 'all_in' | null;
  companyGuess: string | null;
  companyGuessCorrect: boolean | null;
  stakeAmount: number;
  bankrollBefore: number;
  bankrollAfter: number;
  pnlAmount: number;
  signalScoreDelta: number;
  wasCorrect: boolean | null;
  wasAutoPass: boolean;
};

export type BattleRevealPayload = RevealPayload & {
  roundIndex: number;
  you: BattleDecisionPayload;
  opponent: BattleDecisionPayload;
};

export type BattleSummaryRoundPayload = {
  roundIndex: number;
  companyName: string;
  ticker: string;
  actualReturnPercent: number;
  you: BattleDecisionPayload;
  opponent: BattleDecisionPayload;
};

export type BattleSummaryPayload = {
  outcome: 'you_won' | 'you_lost' | 'draw' | 'expired';
  you: { finalBankroll: number; signalScore: number; isBankrupt: boolean };
  opponent: { finalBankroll: number; signalScore: number; isBankrupt: boolean } | null;
  rounds: BattleSummaryRoundPayload[];
};

export type BattleStatePayload = {
  id: string;
  status: BattleStatusValue;
  difficulty: 'easy' | 'medium' | 'hard';
  timerSeconds: BattleTimer;
  totalRounds: number;
  startingBankroll: number;
  currentRoundIndex: number;
  roundPhase: 'deciding' | 'reveal';
  roundDeadlineAt: string | null;
  expiresAt: string;
  /** Authoritative server clock at payload build time, for countdown skew. */
  serverNow: string;
  /** Only present for the creator while the battle awaits an opponent. */
  inviteCode?: string;
  you: BattleSelfPayload;
  opponent: BattleOpponentPayload | null;
  /** Current scenario, present while this round is being decided. */
  round: PreDecisionRoundPayload | null;
  /** Joint reveal of the just-settled round, present during the reveal phase. */
  reveal: BattleRevealPayload | null;
  /** Present once the battle is completed or expired. */
  summary: BattleSummaryPayload | null;
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
