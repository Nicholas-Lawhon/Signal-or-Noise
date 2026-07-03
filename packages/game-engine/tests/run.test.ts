import { describe, expect, it } from 'vitest';
import { createRunState, applyRoundResult, isBankrupt, summarizeRun } from '../src/run';

describe('createRunState', () => {
  it('creates a medium run with correct defaults', () => {
    const run = createRunState({ difficulty: 'medium' });
    expect(run.currentBankroll).toBe(10000);
    expect(run.totalRounds).toBe(20);
    expect(run.currentRoundIndex).toBe(0);
    expect(run.status).toBe('in_progress');
    expect(run.rounds).toHaveLength(0);
  });

  it('creates an easy run with 12500 bankroll', () => {
    const run = createRunState({ difficulty: 'easy' });
    expect(run.currentBankroll).toBe(12500);
  });

  it('creates a hard run with 7500 bankroll', () => {
    const run = createRunState({ difficulty: 'hard' });
    expect(run.currentBankroll).toBe(7500);
  });
});

describe('applyRoundResult', () => {
  it('sets status bankrupt after a bankrupting result', () => {
    const run = createRunState({ difficulty: 'medium' });
    const next = applyRoundResult(run, {
      scenarioId: 'test',
      action: 'short',
      confidence: 'all_in',
      actualReturnPercent: 1.5,
    });
    expect(next.status).toBe('bankrupt');
    expect(next.currentBankroll).toBe(0);
    expect(() =>
      applyRoundResult(next, {
        scenarioId: 'test2',
        action: 'long',
        confidence: 'low',
        actualReturnPercent: 0.1,
      }),
    ).toThrow('Cannot apply round to a run that is not in_progress.');
  });

  it('sets status completed after totalRounds non-bankrupting results', () => {
    const run = createRunState({ difficulty: 'medium', totalRounds: 3 });
    let state = run;
    for (let i = 0; i < 3; i++) {
      state = applyRoundResult(state, {
        scenarioId: `test_${i}`,
        action: 'long',
        confidence: 'low',
        actualReturnPercent: 0.1,
      });
    }
    expect(state.status).toBe('completed');
    expect(state.rounds).toHaveLength(3);
  });

  it('does not mutate its input', () => {
    const run = createRunState({ difficulty: 'medium' });
    const originalBankroll = run.currentBankroll;
    const originalRoundsLength = run.rounds.length;
    const originalStatus = run.status;

    const next = applyRoundResult(run, {
      scenarioId: 'test',
      action: 'long',
      confidence: 'medium',
      actualReturnPercent: 0.25,
    });

    expect(run.currentBankroll).toBe(originalBankroll);
    expect(run.rounds).toHaveLength(originalRoundsLength);
    expect(run.status).toBe(originalStatus);
    expect(next.currentBankroll).not.toBe(originalBankroll);
  });

  it('sets status bankrupt when bankroll falls below the floor', () => {
    const run = createRunState({ difficulty: 'medium', startingBankroll: 2, totalRounds: 5 });
    const next = applyRoundResult(run, {
      scenarioId: 'floor_test',
      action: 'long',
      confidence: 'high',
      actualReturnPercent: -0.9,
    });

    expect(next.rounds[0].stakeAmount).toBeCloseTo(1.4, 6);
    expect(next.rounds[0].pnlAmount).toBeCloseTo(-1.26, 6);
    expect(next.currentBankroll).toBeCloseTo(0.74, 6);
    expect(next.status).toBe('bankrupt');
    expect(isBankrupt(next)).toBe(true);
  });
});

describe('summarizeRun', () => {
  it('computes correct summary stats', () => {
    let run = createRunState({ difficulty: 'medium' });

    // Correct long (+0.25, medium)
    run = applyRoundResult(run, {
      scenarioId: 's1',
      action: 'long',
      confidence: 'medium',
      actualReturnPercent: 0.25,
    });
    // Wrong long (-0.20, low)
    run = applyRoundResult(run, {
      scenarioId: 's2',
      action: 'long',
      confidence: 'low',
      actualReturnPercent: -0.2,
    });
    // Pass
    run = applyRoundResult(run, {
      scenarioId: 's3',
      action: 'pass',
      actualReturnPercent: 0.1,
    });

    const summary = summarizeRun(run);
    expect(summary.correctCalls).toBe(1);
    expect(summary.wrongCalls).toBe(1);
    expect(summary.passes).toBe(1);
    expect(summary.signalScore).toBeCloseTo(2 - 1 - 0.25, 6);
    expect(summary.bestTrade).toBeTruthy();
    expect(summary.bestTrade!.scenarioId).toBe('s1');
    expect(summary.worstTrade).toBeTruthy();
    expect(summary.worstTrade!.scenarioId).toBe('s2');
  });

  it('counts only correct company calls', () => {
    let run = createRunState({ difficulty: 'medium' });

    run = applyRoundResult(run, {
      scenarioId: 's1',
      action: 'long',
      confidence: 'medium',
      actualReturnPercent: 0.25,
      companyGuess: 'Right Co',
      companyGuessCorrect: true,
    });
    run = applyRoundResult(run, {
      scenarioId: 's2',
      action: 'long',
      confidence: 'medium',
      actualReturnPercent: 0.25,
      companyGuess: 'Wrong Co',
      companyGuessCorrect: false,
    });
    run = applyRoundResult(run, {
      scenarioId: 's3',
      action: 'long',
      confidence: 'medium',
      actualReturnPercent: 0.25,
    });

    expect(summarizeRun(run).companiesCalled).toBe(1);
  });
});
