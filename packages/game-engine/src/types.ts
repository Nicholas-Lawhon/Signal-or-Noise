export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameMode = 'classic_run' | 'daily_challenge';
export type RoundAction = 'long' | 'short' | 'pass';
export type Confidence = 'low' | 'medium' | 'high' | 'all_in';
export type RunStatus = 'in_progress' | 'completed' | 'bankrupt';

export type ScoreRoundInput = {
  action: RoundAction;
  confidence?: Confidence;
  currentBankroll: number;
  actualReturnPercent: number;
  companyGuessCorrect?: boolean | null;
};

export type ScoreRoundOutput = {
  stakeAmount: number;
  pnlAmount: number;
  newBankroll: number;
  signalScoreDelta: number;
  wasCorrect: boolean | null;
};

export type CompletedRound = {
  roundIndex: number;
  scenarioId: string;
  action: RoundAction;
  confidence: Confidence | null;
  stakeAmount: number;
  pnlAmount: number;
  bankrollBefore: number;
  bankrollAfter: number;
  signalScoreDelta: number;
  wasCorrect: boolean | null;
  companyGuess: string | null;
  companyGuessCorrect: boolean | null;
};

export type RunState = {
  mode: GameMode;
  difficulty: Difficulty | null;
  startingBankroll: number;
  currentBankroll: number;
  signalScore: number;
  totalRounds: number;
  currentRoundIndex: number;
  status: RunStatus;
  rounds: CompletedRound[];
  currentStreak: number;
  bestStreak: number;
};

export type RunSummary = {
  finalBankroll: number;
  signalScore: number;
  correctCalls: number;
  wrongCalls: number;
  passes: number;
  companiesCalled: number;
  bestTrade: CompletedRound | null;
  worstTrade: CompletedRound | null;
  wentBankrupt: boolean;
  currentStreak: number;
  bestStreak: number;
};

export type ApplyRoundResultInput = {
  scenarioId: string;
  action: RoundAction;
  confidence?: Confidence;
  actualReturnPercent: number;
  companyGuess?: string | null;
  companyGuessCorrect?: boolean | null;
};

export type AdvanceRunOutput = {
  run: RunState;
  round: CompletedRound;
  summary: RunSummary | null;
  didEndRun: boolean;
};

export type DraftPoolEntry = {
  scenarioId: string;
  actualReturnPercent: number;
};

export type DraftResult = {
  budget: number;
  selectedScenarioIds: string[];
  finalValue: number;
  optimalScenarioIds: string[];
  optimalValue: number;
  gapFromOptimal: number;
};

export type DraftWindowCandidate = {
  scenarioId: string;
  /** ISO YYYY-MM-DD */
  decisionDate: string;
  /** ISO YYYY-MM-DD */
  endDate: string;
};

export type DraftWindow = {
  scenarioIds: string[];
  /** Latest decision date in the window — the start of the shared overlap. */
  windowStart: string;
  /** Earliest end date in the window — the end of the shared overlap. */
  windowEnd: string;
};

export type BattleTimerSeconds = 30 | 60 | 120 | null;

export type BattlePlayerFinalState = {
  finalBankroll: number;
  signalScore: number;
  isBankrupt: boolean;
};

export type BattleVerdict = 'a' | 'b' | 'draw';

export type LeaderboardTiebreakerInput = {
  finalBankroll: number;
  signalScore: number;
  correctCalls: number;
  passes: number;
  completionTimeMs: number;
};

export type LeaderboardTiebreakers = {
  finalBankroll: number;
  signalScore: number;
  correctCalls: number;
  fewerPasses: number;
  fasterCompletion: number;
  sortKey: readonly [number, number, number, number, number];
};

export type BankrollRankMetrics = {
  finalBankroll: number;
  signalScore: number;
  correctCalls: number;
  passes: number;
  completionTimeMs: number;
};

export type SignalRankMetrics = {
  signalScore: number;
  correctCalls: number;
  passes: number;
  attainedAtMs: number;
};
