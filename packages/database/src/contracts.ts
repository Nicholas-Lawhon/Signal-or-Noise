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
// Portfolio Draft (D052/D055)
//
// Pre-selection cards are addressed by slot index 0-5, never by scenario id:
// production scenario ids embed company names, so exposing them before the
// reveal would cross the pre-decision boundary.
// ---------------------------------------------------------------------------

export const draftFormatSchema = z.enum(['classic', 'quick', 'era']);
export type DraftFormatValue = z.infer<typeof draftFormatSchema>;

export const createPortfolioDraftSchema = z.object({
  owner: runOwnerSchema,
  format: draftFormatSchema.optional(),
  eraId: z.string().min(1).max(128).optional(),
}).strict().superRefine((input, context) => {
  if (input.format === 'era' && !input.eraId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['eraId'], message: 'Era Draft needs an era' });
  }
  if (input.format !== 'era' && input.eraId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['eraId'], message: 'Only Era Draft accepts an era' });
  }
});

export const getPortfolioDraftSchema = z.object({
  owner: runOwnerSchema,
  draftId: z.string().min(1).max(128),
}).strict();

export const getCurrentPortfolioDraftSchema = z.object({
  owner: runOwnerSchema,
}).strict();

export const getDraftHistorySchema = z.object({
  userId: z.string().min(1).max(128),
  limit: z.number().int().min(1).max(20).default(10),
}).strict();

export const submitDraftSelectionSchema = z.object({
  owner: runOwnerSchema,
  draftId: z.string().min(1).max(128),
  slots: z.array(z.number().int().min(0).max(5)).min(2).max(3)
    .refine((slots) => new Set(slots).size === slots.length, { message: 'Draft picks must be distinct companies' }),
  allocations: z.array(z.number().int().min(10).max(60)).min(2).max(3),
}).strict().superRefine((input, context) => {
  if (input.allocations.length !== input.slots.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['allocations'], message: 'One allocation is required per pick' });
  }
  if (input.allocations.some((value) => value % 10 !== 0)
    || input.allocations.reduce((sum, value) => sum + value, 0) !== 100) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['allocations'], message: 'Allocations must use 10% increments and total 100%' });
  }
});

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

export type DraftEraPayload = { id: string; name: string; description: string };

export type CurrentDraftPayload = {
  id: string;
  status: 'in_progress';
  isOfficial: boolean;
  format: DraftFormatValue;
  eraId: string | null;
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
  allocationPercent: number | null;
  allocatedValue: number | null;
  optimalAllocationPercent?: number;
};

export type CompletedDraftPayload = {
  id: string;
  status: 'completed';
  isOfficial: boolean;
  format: DraftFormatValue;
  eraId: string | null;
  budget: number;
  windowLabel: string;
  finalValue: number;
  optimalValue: number;
  gapFromOptimal: number;
  companies: DraftRevealCompanyPayload[];
};

export type DraftPayload = CurrentDraftPayload | CompletedDraftPayload;

export type DraftHistoryEntryPayload = {
  id: string;
  format: DraftFormatValue;
  finalValue: number;
  gapFromOptimal: number;
  completedAt: string;
};

export type DraftLeaderboardRowPayload = {
  rank: number;
  publicName: string;
  finalValue: number;
  gapFromOptimal: number;
  completedAt: string;
  isCurrentUser: boolean;
};

export type DraftLeaderboardPagePayload = {
  format: DraftFormatValue;
  rows: DraftLeaderboardRowPayload[];
  currentUserRow: DraftLeaderboardRowPayload | null;
  pagination: { page: number; pageSize: number; totalEntries: number; totalPages: number };
};

// Draft Battle (D055). Scenario slots remain opaque until the joint settle.
export const draftBattleTimerSchema = z.union([z.null(), z.literal(120), z.literal(300)]);

export const createDraftBattleSchema = z.object({
  userId: z.string().min(1).max(128),
  format: draftFormatSchema,
  eraId: z.string().min(1).max(128).optional(),
  timerSeconds: draftBattleTimerSchema.default(120),
}).strict().superRefine((input, context) => {
  if (input.format === 'era' && !input.eraId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['eraId'], message: 'Era Draft needs an era' });
  }
  if (input.format !== 'era' && input.eraId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['eraId'], message: 'Only Era Draft accepts an era' });
  }
});

export const getDraftBattleStateSchema = z.object({
  userId: z.string().min(1).max(128),
  battleId: z.string().min(1).max(128),
}).strict();

export const getDraftBattleInviteSchema = z.object({
  userId: z.string().min(1).max(128),
  inviteCode: z.string().regex(/^[a-f0-9]{32}$/),
}).strict();

export const joinDraftBattleSchema = getDraftBattleInviteSchema;

export const submitDraftBattleSchema = z.object({
  userId: z.string().min(1).max(128),
  battleId: z.string().min(1).max(128),
  slots: z.array(z.number().int().min(0).max(5)).min(2).max(3),
  allocations: z.array(z.number().int().min(10).max(60)).min(2).max(3),
}).strict().superRefine((input, context) => {
  if (new Set(input.slots).size !== input.slots.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['slots'], message: 'Battle picks must be distinct' });
  }
  if (input.slots.length !== input.allocations.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['allocations'], message: 'One allocation is required per pick' });
  }
  if (input.allocations.some((value) => value % 10 !== 0)
    || input.allocations.reduce((sum, value) => sum + value, 0) !== 100) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['allocations'], message: 'Allocations must use 10% increments and total 100%' });
  }
});

export type DraftBattleStatusValue = 'awaiting_opponent' | 'awaiting_submissions' | 'completed' | 'expired';
export type DraftBattleTimer = z.infer<typeof draftBattleTimerSchema>;
export type DraftBattleSelfPayload = {
  name: string;
  hasSubmitted: boolean;
  selectedSlots: number[] | null;
  allocations: number[] | null;
};
export type DraftBattleOpponentPayload = { name: string; hasSubmitted: boolean } | null;
export type DraftBattleRevealCompanyPayload = {
  slot: number;
  title: string;
  companyName: string;
  ticker: string;
  actualReturnPercent: number;
  youSelected: boolean;
  opponentSelected: boolean;
  youAllocationPercent: number | null;
  opponentAllocationPercent: number | null;
};
export type DraftBattleRevealPayload = {
  companies: DraftBattleRevealCompanyPayload[];
  you: { finalValue: number | null; gapFromOptimal: number | null; forfeited: boolean };
  opponent: { finalValue: number | null; gapFromOptimal: number | null; forfeited: boolean } | null;
};
export type DraftBattleStatePayload = {
  id: string;
  status: DraftBattleStatusValue;
  format: DraftFormatValue;
  eraId: string | null;
  timerSeconds: DraftBattleTimer;
  budget: number;
  inviteCode?: string;
  submissionDeadlineAt: string | null;
  expiresAt: string;
  serverNow: string;
  cards: DraftCardPayload[] | null;
  you: DraftBattleSelfPayload;
  opponent: DraftBattleOpponentPayload;
  outcome: 'you_won' | 'you_lost' | 'draw' | 'no_winner' | 'expired' | null;
  reveal: DraftBattleRevealPayload | null;
};
export type DraftBattleInvitePreviewPayload = {
  format: DraftFormatValue;
  eraId: string | null;
  timerSeconds: DraftBattleTimer;
  status: DraftBattleStatusValue;
  joinable: boolean;
};

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
  /** Released only with the settled reveal, never in pre-decision payloads. */
  smartPassEligible: boolean;
  smartPassExplanation: string;
};
