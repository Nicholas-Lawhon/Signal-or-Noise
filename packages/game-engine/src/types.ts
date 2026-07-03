export type Difficulty = 'easy' | 'medium' | 'hard';
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
  mode: 'classic_run';
  difficulty: Difficulty;
  startingBankroll: number;
  currentBankroll: number;
  signalScore: number;
  totalRounds: number;
  currentRoundIndex: number;
  status: RunStatus;
  rounds: CompletedRound[];
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
};
