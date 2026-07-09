import { BANKRUPTCY_FLOOR, STARTING_BANKROLL, CLASSIC_RUN_ROUNDS } from './confidence';
import { scoreRound } from './scoring';
import type {
  Difficulty,
  RunState,
  RunStatus,
  CompletedRound,
  RunSummary,
  ApplyRoundResultInput,
  AdvanceRunOutput,
} from './types';

export function createRunState(params: {
  difficulty: Difficulty;
  startingBankroll?: number;
  totalRounds?: number;
}): RunState {
  if (params.startingBankroll !== undefined && params.startingBankroll < 0) {
    throw new Error('startingBankroll must not be negative.');
  }
  if (params.totalRounds !== undefined && params.totalRounds < 1) {
    throw new Error('totalRounds must be at least 1.');
  }

  return {
    mode: 'classic_run',
    difficulty: params.difficulty,
    startingBankroll: params.startingBankroll ?? STARTING_BANKROLL[params.difficulty],
    currentBankroll: params.startingBankroll ?? STARTING_BANKROLL[params.difficulty],
    signalScore: 0,
    totalRounds: params.totalRounds ?? CLASSIC_RUN_ROUNDS[params.difficulty],
    currentRoundIndex: 0,
    status: 'in_progress',
    rounds: [],
    currentStreak: 0,
    bestStreak: 0,
  };
}

export function applyRoundResult(run: RunState, input: ApplyRoundResultInput): RunState {
  if (run.status !== 'in_progress') {
    throw new Error('Cannot apply round to a run that is not in_progress.');
  }

  const output = scoreRound({
    action: input.action,
    confidence: input.confidence,
    currentBankroll: run.currentBankroll,
    actualReturnPercent: input.actualReturnPercent,
    companyGuessCorrect: input.companyGuessCorrect ?? null,
  });

  const round: CompletedRound = {
    roundIndex: run.currentRoundIndex,
    scenarioId: input.scenarioId,
    action: input.action,
    confidence: input.confidence ?? null,
    stakeAmount: output.stakeAmount,
    pnlAmount: output.pnlAmount,
    bankrollBefore: run.currentBankroll,
    bankrollAfter: output.newBankroll,
    signalScoreDelta: output.signalScoreDelta,
    wasCorrect: output.wasCorrect,
    companyGuess: input.companyGuess ?? null,
    companyGuessCorrect: input.companyGuessCorrect ?? null,
  };

  const rounds = [...run.rounds, round];
  const newBankroll = output.newBankroll;
  const newSignalScore = run.signalScore + output.signalScoreDelta;
  const newRoundIndex = run.currentRoundIndex + 1;

  let currentStreak = run.currentStreak;
  let bestStreak = run.bestStreak;
  if (output.wasCorrect === true) {
    currentStreak += 1;
    bestStreak = Math.max(bestStreak, currentStreak);
  } else if (output.wasCorrect === false) {
    currentStreak = 0;
  }
  // wasCorrect === null (Pass): leave streaks unchanged

  let status: RunStatus = run.status;
  if (newBankroll < BANKRUPTCY_FLOOR) {
    status = 'bankrupt';
  } else if (rounds.length === run.totalRounds) {
    status = 'completed';
  }

  return {
    ...run,
    currentBankroll: newBankroll,
    signalScore: newSignalScore,
    currentRoundIndex: newRoundIndex,
    status,
    rounds,
    currentStreak,
    bestStreak,
  };
}

export function advanceRun(run: RunState, input: ApplyRoundResultInput): AdvanceRunOutput {
  const nextRun = applyRoundResult(run, input);
  const round = nextRun.rounds[nextRun.rounds.length - 1];
  const didEndRun = nextRun.status !== 'in_progress';
  return {
    run: nextRun,
    round,
    summary: didEndRun ? summarizeRun(nextRun) : null,
    didEndRun,
  };
}

export function isBankrupt(run: RunState): boolean {
  return run.currentBankroll < BANKRUPTCY_FLOOR;
}

export function summarizeRun(run: RunState): RunSummary {
  let correctCalls = 0;
  let wrongCalls = 0;
  let passes = 0;
  let companiesCalled = 0;
  let bestTrade: CompletedRound | null = null;
  let worstTrade: CompletedRound | null = null;

  for (const r of run.rounds) {
    if (r.wasCorrect === true) {
      correctCalls++;
    } else if (r.wasCorrect === false) {
      wrongCalls++;
    }
    if (r.action === 'pass') {
      passes++;
    }
    if (r.companyGuessCorrect === true) {
      companiesCalled++;
    }

    if (r.stakeAmount > 0) {
      if (!bestTrade || r.pnlAmount > bestTrade.pnlAmount) {
        bestTrade = r;
      }
      if (!worstTrade || r.pnlAmount < worstTrade.pnlAmount) {
        worstTrade = r;
      }
    }
  }

  return {
    finalBankroll: run.currentBankroll,
    signalScore: run.signalScore,
    correctCalls,
    wrongCalls,
    passes,
    companiesCalled,
    bestTrade,
    worstTrade,
    wentBankrupt: run.status === 'bankrupt',
    currentStreak: run.currentStreak,
    bestStreak: run.bestStreak,
  };
}
