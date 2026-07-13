import { describe, expect, it } from 'vitest';
import { scoreRound } from '../src/scoring';
import { calculateStake } from '../src/confidence';

describe('scoreRound', () => {
  // Case 1: Correct long
  it('scores a correct long call', () => {
    const result = scoreRound({
      action: 'long',
      confidence: 'medium',
      currentBankroll: 10000,
      actualReturnPercent: 0.25,
    });
    expect(result.stakeAmount).toBe(4000);
    expect(result.pnlAmount).toBe(1000);
    expect(result.newBankroll).toBe(11000);
    expect(result.signalScoreDelta).toBe(2);
    expect(result.wasCorrect).toBe(true);
  });

  // Case 2: Wrong long
  it('scores a wrong long call', () => {
    const result = scoreRound({
      action: 'long',
      confidence: 'high',
      currentBankroll: 10000,
      actualReturnPercent: -0.2,
    });
    expect(result.stakeAmount).toBe(7000);
    expect(result.pnlAmount).toBe(-1400);
    expect(result.newBankroll).toBe(8600);
    expect(result.signalScoreDelta).toBe(-3);
    expect(result.wasCorrect).toBe(false);
  });

  // Case 3: Correct short
  it('scores a correct short call', () => {
    const result = scoreRound({
      action: 'short',
      confidence: 'medium',
      currentBankroll: 10000,
      actualReturnPercent: -0.3,
    });
    expect(result.stakeAmount).toBe(4000);
    expect(result.pnlAmount).toBe(1200);
    expect(result.newBankroll).toBe(11200);
    expect(result.signalScoreDelta).toBe(2);
    expect(result.wasCorrect).toBe(true);
  });

  // Case 4: Wrong short
  it('scores a wrong short call', () => {
    const result = scoreRound({
      action: 'short',
      confidence: 'low',
      currentBankroll: 10000,
      actualReturnPercent: 0.5,
    });
    expect(result.stakeAmount).toBe(1000);
    expect(result.pnlAmount).toBe(-500);
    expect(result.newBankroll).toBe(9500);
    expect(result.signalScoreDelta).toBe(-1);
    expect(result.wasCorrect).toBe(false);
  });

  // Case 5: Pass
  it('scores a pass', () => {
    const result = scoreRound({
      action: 'pass',
      currentBankroll: 10000,
      actualReturnPercent: 0.25,
    });
    expect(result.stakeAmount).toBe(0);
    expect(result.pnlAmount).toBe(0);
    expect(result.newBankroll).toBe(10000);
    expect(result.signalScoreDelta).toBe(-0.25);
    expect(result.smartPassAwarded).toBe(false);
    expect(result.wasCorrect).toBe(null);
  });

  it('awards Smart Pass only when curator metadata marks the card eligible', () => {
    const eligible = scoreRound({
      action: 'pass',
      currentBankroll: 10000,
      actualReturnPercent: -0.2,
      smartPassEligible: true,
    });
    expect(eligible.signalScoreDelta).toBe(1);
    expect(eligible.smartPassAwarded).toBe(true);
    expect(eligible.newBankroll).toBe(10000);

    const ineligible = scoreRound({
      action: 'pass',
      currentBankroll: 10000,
      actualReturnPercent: -0.2,
      smartPassEligible: false,
    });
    expect(ineligible.signalScoreDelta).toBe(-0.25);
    expect(ineligible.smartPassAwarded).toBe(false);
  });

  it('does not apply Smart Pass metadata to Long or Short', () => {
    const result = scoreRound({
      action: 'long',
      confidence: 'low',
      currentBankroll: 10000,
      actualReturnPercent: 0.1,
      smartPassEligible: true,
    });
    expect(result.signalScoreDelta).toBe(1);
    expect(result.smartPassAwarded).toBe(false);
  });

  // Case 6: All-In win
  it('scores an All-In win', () => {
    const result = scoreRound({
      action: 'long',
      confidence: 'all_in',
      currentBankroll: 10000,
      actualReturnPercent: 0.35,
    });
    expect(result.stakeAmount).toBe(10000);
    expect(result.pnlAmount).toBe(3500);
    expect(result.newBankroll).toBe(13500);
    expect(result.signalScoreDelta).toBe(5);
    expect(result.wasCorrect).toBe(true);
  });

  // Case 7: All-In loss
  it('scores an All-In loss', () => {
    const result = scoreRound({
      action: 'long',
      confidence: 'all_in',
      currentBankroll: 10000,
      actualReturnPercent: -0.4,
    });
    expect(result.stakeAmount).toBe(10000);
    expect(result.pnlAmount).toBe(-10000);
    expect(result.newBankroll).toBe(0);
    expect(result.signalScoreDelta).toBe(-5);
    expect(result.wasCorrect).toBe(false);
  });

  // Case 8: Bankruptcy via capped short (All-In short on +150% return)
  it('handles bankruptcy via capped short', () => {
    const result = scoreRound({
      action: 'short',
      confidence: 'all_in',
      currentBankroll: 10000,
      actualReturnPercent: 1.5,
    });
    expect(result.stakeAmount).toBe(10000);
    expect(result.pnlAmount).toBe(-10000);
    expect(result.newBankroll).toBe(0);
    expect(result.signalScoreDelta).toBe(-5);
    expect(result.wasCorrect).toBe(false);
  });

  // Case 9: Short loss capped at stake
  it('caps short loss at stake', () => {
    const result = scoreRound({
      action: 'short',
      confidence: 'medium',
      currentBankroll: 10000,
      actualReturnPercent: 3.0,
    });
    expect(result.stakeAmount).toBe(4000);
    expect(result.pnlAmount).toBe(-4000);
    expect(result.newBankroll).toBe(6000);
    expect(result.signalScoreDelta).toBe(-2);
    expect(result.wasCorrect).toBe(false);
  });

  // Case 10: calculateStake all levels
  it('calculates stake correctly for all levels', () => {
    const bankroll = 8000;
    expect(calculateStake(bankroll, 'low')).toBe(800);
    expect(calculateStake(bankroll, 'medium')).toBe(3200);
    expect(calculateStake(bankroll, 'high')).toBe(5600);
    expect(calculateStake(bankroll, 'all_in')).toBe(8000);
  });

  // Case 11: Missing confidence throws
  it('throws when confidence is missing for long/short', () => {
    expect(() =>
      scoreRound({
        action: 'long',
        currentBankroll: 10000,
        actualReturnPercent: 0.1,
      }),
    ).toThrow('Confidence is required');
  });

  // Case 12: Correct guess bonus
  it('adds the correct guess bonus', () => {
    const result = scoreRound({
      action: 'long',
      confidence: 'medium',
      currentBankroll: 10000,
      actualReturnPercent: 0.25,
      companyGuessCorrect: true,
    });
    expect(result.stakeAmount).toBe(4000);
    expect(result.pnlAmount).toBe(1000);
    expect(result.newBankroll).toBe(11000);
    expect(result.signalScoreDelta).toBe(4);
    expect(result.wasCorrect).toBe(true);
  });

  // Case 13: Wrong guess penalty
  it('subtracts the wrong guess penalty', () => {
    const result = scoreRound({
      action: 'long',
      confidence: 'medium',
      currentBankroll: 10000,
      actualReturnPercent: 0.25,
      companyGuessCorrect: false,
    });
    expect(result.stakeAmount).toBe(4000);
    expect(result.pnlAmount).toBe(1000);
    expect(result.newBankroll).toBe(11000);
    expect(result.signalScoreDelta).toBe(1);
    expect(result.wasCorrect).toBe(true);
  });

  // Case 14: Pass + correct guess
  it('adds the correct guess bonus to a pass', () => {
    const result = scoreRound({
      action: 'pass',
      currentBankroll: 10000,
      actualReturnPercent: 0.25,
      companyGuessCorrect: true,
    });
    expect(result.stakeAmount).toBe(0);
    expect(result.pnlAmount).toBe(0);
    expect(result.newBankroll).toBe(10000);
    expect(result.signalScoreDelta).toBe(1.75);
    expect(result.wasCorrect).toBe(null);
  });

  // Case 15: All-In win + wrong guess
  it('subtracts the wrong guess penalty from an All-In win', () => {
    const result = scoreRound({
      action: 'long',
      confidence: 'all_in',
      currentBankroll: 10000,
      actualReturnPercent: 0.35,
      companyGuessCorrect: false,
    });
    expect(result.stakeAmount).toBe(10000);
    expect(result.pnlAmount).toBe(3500);
    expect(result.newBankroll).toBe(13500);
    expect(result.signalScoreDelta).toBe(4);
    expect(result.wasCorrect).toBe(true);
  });

  // Case 16: exact 0 return is incorrect for Long and Short
  it('treats actualReturnPercent 0 as incorrect for long and short', () => {
    const longResult = scoreRound({
      action: 'long',
      confidence: 'medium',
      currentBankroll: 10000,
      actualReturnPercent: 0,
    });
    expect(longResult.wasCorrect).toBe(false);
    expect(longResult.signalScoreDelta).toBe(-2);
    expect(longResult.pnlAmount).toBe(0);
    expect(longResult.newBankroll).toBe(10000);

    const shortResult = scoreRound({
      action: 'short',
      confidence: 'low',
      currentBankroll: 10000,
      actualReturnPercent: 0,
    });
    expect(shortResult.wasCorrect).toBe(false);
    expect(shortResult.signalScoreDelta).toBe(-1);
    // short * 0 can yield -0 in IEEE floats; value is still zero dollars
    expect(shortResult.pnlAmount).toBeCloseTo(0, 10);
    expect(shortResult.newBankroll).toBe(10000);
  });
});
