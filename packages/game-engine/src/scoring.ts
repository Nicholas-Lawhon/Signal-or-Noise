import { CONFIDENCE_CONFIG, GUESS_CORRECT_BONUS, GUESS_WRONG_PENALTY } from './confidence';
import type { ScoreRoundInput, ScoreRoundOutput } from './types';

export function scoreRound(input: ScoreRoundInput): ScoreRoundOutput {
  const guessDelta =
    input.companyGuessCorrect === true
      ? GUESS_CORRECT_BONUS
      : input.companyGuessCorrect === false
        ? GUESS_WRONG_PENALTY
        : 0;

  if (input.action === 'pass') {
    const smartPassAwarded = input.smartPassEligible === true;
    return {
      stakeAmount: 0,
      pnlAmount: 0,
      newBankroll: input.currentBankroll,
      signalScoreDelta: (smartPassAwarded ? 1 : -0.25) + guessDelta,
      smartPassAwarded,
      wasCorrect: null,
    };
  }
  if (!input.confidence) {
    throw new Error('Confidence is required for long/short actions.');
  }
  const config = CONFIDENCE_CONFIG[input.confidence];
  const stakeAmount = input.currentBankroll * config.bankrollPercent;
  const rawReturn =
    input.action === 'long' ? input.actualReturnPercent : input.actualReturnPercent * -1;
  const rawPnl = stakeAmount * rawReturn;
  const cappedPnl = Math.max(rawPnl, stakeAmount * -1);
  const wasCorrect = rawReturn > 0;
  const pnlAmount = input.confidence === 'all_in' && !wasCorrect ? stakeAmount * -1 : cappedPnl;
  const newBankroll = input.confidence === 'all_in' && !wasCorrect
    ? 0
    : Math.max(0, input.currentBankroll + pnlAmount);
  const baseSignalScoreDelta = wasCorrect ? config.signalScoreValue : config.signalScoreValue * -1;
  const signalScoreDelta = baseSignalScoreDelta + guessDelta;
  return {
    stakeAmount,
    pnlAmount,
    newBankroll,
    signalScoreDelta,
    smartPassAwarded: false,
    wasCorrect,
  };
}
