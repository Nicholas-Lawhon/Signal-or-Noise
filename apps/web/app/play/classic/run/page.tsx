'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  createRunState,
  applyRoundResult,
  summarizeRun,
  calculateStake,
  CONFIDENCE_CONFIG,
} from '@signal-or-noise/game-engine';
import type {
  RunState,
  Difficulty,
  RoundAction,
  Confidence,
  CompletedRound,
} from '@signal-or-noise/game-engine';
import { buildRunScenarioList } from '@/lib/sampleScenarios';
import type { PrototypeScenario } from '@/lib/sampleScenarios';
import { formatMoney, formatSignedMoney, formatPercent, formatSignalScore } from '@/lib/format';
import { normalizeGuess } from '@/lib/guess';
import Sparkline from '@/components/Sparkline';

const CONFIDENCE_COLORS: Record<Confidence, string> = {
  low: 'son-signalCyan',
  medium: 'son-green',
  high: 'son-amber',
  all_in: 'son-violet',
};

const DECISION_COLORS: Record<RoundAction, string> = {
  long: 'son-green',
  short: 'son-red',
  pass: 'son-textSecondary',
};

export default function ClassicRunClient() {
  const searchParams = useSearchParams();
  const difficultyParam = searchParams.get('difficulty');
  const difficulty: Difficulty =
    difficultyParam === 'easy' || difficultyParam === 'medium' || difficultyParam === 'hard'
      ? difficultyParam
      : 'medium';

  const [mounted, setMounted] = useState(false);
  const [run, setRun] = useState<RunState | null>(null);
  const [scenarios, setScenarios] = useState<PrototypeScenario[]>([]);
  const [view, setView] = useState<'round' | 'locked' | 'reveal' | 'summary'>('round');
  const [lastRound, setLastRound] = useState<CompletedRound | null>(null);
  const [action, setAction] = useState<RoundAction | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [companyGuess, setCompanyGuess] = useState('');

  useEffect(() => {
    const initialRun = createRunState({ difficulty });
    setRun(initialRun);
    setScenarios(buildRunScenarioList(initialRun.totalRounds));
    setMounted(true);
  }, [difficulty]);

  if (!mounted || !run) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-son-bg">
        <p className="text-son-textMuted">Loading...</p>
      </main>
    );
  }

  const scenario = scenarios[run.currentRoundIndex];
  if (!scenario && (view === 'round' || view === 'locked')) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-son-bg">
        <p className="text-son-textMuted">No scenario available.</p>
      </main>
    );
  }

  const handleLockIn = () => {
    if (!scenario) return;

    const trimmedGuess = companyGuess.trim();
    const submittedGuess = trimmedGuess.length > 0 ? trimmedGuess : null;
    const companyGuessCorrect = submittedGuess
      ? scenario.acceptedNames.map(normalizeGuess).includes(normalizeGuess(submittedGuess))
      : null;

    const next = applyRoundResult(run, {
      scenarioId: scenario.id,
      action: action!,
      confidence: action === 'pass' ? undefined : confidence ?? undefined,
      actualReturnPercent: scenario.actualReturnPercent,
      companyGuess: submittedGuess,
      companyGuessCorrect,
    });

    setLastRound(next.rounds[next.rounds.length - 1]);
    setRun(next);
    setView('locked');
  };

  const handleReveal = () => {
    setView('reveal');
  };

  const handleNext = () => {
    if (run.status === 'in_progress') {
      setAction(null);
      setConfidence(null);
      setCompanyGuess('');
      setView('round');
    } else {
      setView('summary');
    }
  };

  const canLockIn = action !== null && (action === 'pass' || confidence !== null);

  const summary = summarizeRun(run);

  const scenarioByLookup = Object.fromEntries(scenarios.map((s) => [s.id, s]));

  const confidenceColorClass = (level: Confidence, selected: boolean, disabled: boolean) => {
    if (disabled) return 'cursor-not-allowed border-son-borderSubtle/50 bg-son-surface/30 text-son-textMuted';
    const color = CONFIDENCE_COLORS[level];
    if (selected) return `border-${color} bg-${color}/10 text-${color} shadow-[0_0_16px_rgba(var(--tw-color-shadow),0.15)]`;
    return `border-son-border bg-son-card text-son-textSecondary hover:border-son-borderStrong`;
  };

  const decisionColorClass = (a: RoundAction, selected: boolean) => {
    if (selected) {
      const color = DECISION_COLORS[a];
      return `border-${color} bg-${color}/10 font-semibold`;
    }
    return 'border-son-border bg-son-card text-son-textSecondary hover:border-son-borderStrong';
  };

  // ---- Round View ----
  if (view === 'round' && scenario) {
    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-6">
        <div className="w-full max-w-md">
          {/* Top bar */}
          <div className="mb-4 rounded-lg border border-son-border bg-son-card px-4 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-son-textSecondary">
                Round {run.currentRoundIndex + 1}/{run.totalRounds}
              </span>
              <span className="font-semibold text-son-text tabular-nums">
                Bankroll: {formatMoney(run.currentBankroll)}
              </span>
              <span className="font-semibold text-son-signalCyan tabular-nums">
                Signal Score: {formatSignalScore(run.signalScore)}
              </span>
            </div>
          </div>

          {/* Scenario card */}
          <div className="mb-6 rounded-2xl border border-son-border bg-son-card p-5">
            <div className="mb-3 inline-block rounded-full border border-son-borderSubtle px-3 py-0.5 text-xs text-son-textSecondary">
              {scenario.era}
            </div>

            <p className="mb-1 text-xs text-son-textMuted">
              {scenario.decisionDateLabel} &middot; {scenario.holdingPeriodLabel}
            </p>

            <h2 className="mb-1 text-lg font-semibold text-son-text">{scenario.title}</h2>

            <p className="mb-2 text-sm leading-relaxed text-son-textSecondary">
              {scenario.companyDescription}
            </p>

            <p className="mb-4 text-sm leading-relaxed text-son-textMuted">
              {scenario.macroContext}
            </p>

            {/* Lookback sparkline */}
            <div className="mb-4">
              <p className="mb-1 text-xs text-son-textMuted">Lookback chart</p>
              <Sparkline prices={scenario.lookbackPrices} height={96} variant="lookback" />
            </div>

            {/* Clues */}
            <ol className="mb-0 list-inside list-decimal space-y-1 text-sm text-son-textSecondary">
              {scenario.clues.map((clue, i) => (
                <li key={i}>{clue}</li>
              ))}
            </ol>
          </div>

          {/* Call the Company */}
          <div className="mb-4">
            <label htmlFor="company-guess" className="mb-2 block text-sm font-semibold text-son-text">
              Call the Company (optional)
            </label>
            <input
              id="company-guess"
              type="text"
              value={companyGuess}
              onChange={(event) => setCompanyGuess(event.target.value)}
              placeholder="Name the hidden company"
              className="w-full rounded-lg border border-son-border bg-son-card px-4 py-3 text-sm text-son-text outline-none transition-colors placeholder:text-son-textMuted focus:border-son-signalBlue"
            />
            <p className="mt-1 text-xs text-son-textMuted">
              Right: +2 Signal &middot; Wrong: &minus;1 Signal &middot; Blank: no change
            </p>
          </div>

          {/* Make the Call */}
          <div className="mb-4">
            <p className="mb-2 text-sm font-semibold text-son-text">Make the Call</p>
            <div className="flex gap-2">
              {(['long', 'short', 'pass'] as RoundAction[]).map((a) => {
                const isSelected = action === a;
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => {
                      setAction(a);
                      if (a === 'pass') setConfidence(null);
                    }}
                    className={`flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                      isSelected
                        ? `border-${DECISION_COLORS[a]} bg-${DECISION_COLORS[a]}/10 text-${DECISION_COLORS[a]} font-semibold`
                        : 'border-son-border bg-son-card text-son-textSecondary hover:border-son-borderStrong'
                    }`}
                  >
                    {a.charAt(0).toUpperCase() + a.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confidence */}
          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold text-son-text">Confidence</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CONFIDENCE_CONFIG) as Confidence[]).map((level) => {
                const config = CONFIDENCE_CONFIG[level];
                const stake = calculateStake(run.currentBankroll, level);
                const disabled = action === 'pass' || action === null;
                const pct = (config.bankrollPercent * 100).toFixed(0);
                const color = CONFIDENCE_COLORS[level];
                const selected = confidence === level;

                let classes = '';
                if (disabled) {
                  classes = 'cursor-not-allowed border-son-borderSubtle/50 bg-son-surface/30 text-son-textMuted';
                } else if (selected) {
                  classes = `border-${color} bg-${color}/10`;
                } else {
                  classes = 'border-son-border bg-son-card hover:border-son-borderStrong';
                }

                return (
                  <button
                    key={level}
                    type="button"
                    disabled={disabled}
                    onClick={() => setConfidence(level)}
                    className={`rounded-lg border p-3 text-left transition-colors ${classes}`}
                  >
                    <div className={`text-xs ${disabled ? '' : selected ? `text-${color}` : 'text-son-textSecondary'}`}>
                      {config.label} ({pct}%)
                    </div>
                    <div className={`mt-0.5 text-lg font-bold tabular-nums ${disabled ? '' : selected ? `text-${color}` : 'text-son-text'}`}>
                      {formatMoney(stake)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lock In */}
          <button
            type="button"
            disabled={!canLockIn}
            onClick={handleLockIn}
            className={`w-full rounded-lg px-6 py-3 text-base font-semibold transition-colors ${
              canLockIn
                ? 'bg-son-signalBlue text-son-textInverse hover:brightness-110'
                : 'cursor-not-allowed bg-son-surface text-son-textMuted'
            }`}
          >
            Lock In
          </button>
        </div>
      </main>
    );
  }

  // ---- Locked View ----
  if (view === 'locked' && lastRound) {
    const isPass = lastRound.action === 'pass';
    const confLabel = lastRound.confidence ? CONFIDENCE_CONFIG[lastRound.confidence].label : null;
    const pct = lastRound.confidence
      ? (CONFIDENCE_CONFIG[lastRound.confidence].bankrollPercent * 100).toFixed(0)
      : null;

    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-son-borderStrong bg-son-cardElevated p-8 text-center">
          <h2 className="text-2xl font-bold text-son-text">Call locked.</h2>

          <div className="mt-6 space-y-2 text-sm">
            <p className="text-son-textSecondary">
              Your call:{' '}
              <span className="font-semibold text-son-text">
                {lastRound.action.charAt(0).toUpperCase() + lastRound.action.slice(1)}
              </span>
            </p>
            {isPass ? (
              <p className="text-son-textSecondary">Nothing at risk.</p>
            ) : (
              <>
                <p className="text-son-textSecondary">
                  Confidence:{' '}
                  <span className="font-semibold text-son-text">
                    {confLabel} ({pct}%)
                  </span>
                </p>
                <p className="text-son-textSecondary">
                  At risk:{' '}
                  <span className="font-semibold text-son-text">
                    {formatMoney(lastRound.stakeAmount)}
                  </span>
                </p>
              </>
            )}
            {lastRound.companyGuess && (
              <p className="text-son-textSecondary">
                Company call:{' '}
                <span className="font-semibold text-son-text">{lastRound.companyGuess}</span>
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleReveal}
            className="mt-8 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110"
          >
            Reveal Result
          </button>
        </div>
      </main>
    );
  }

  // ---- Reveal View ----
  if (view === 'reveal' && lastRound) {
    const revealScenario = scenarioByLookup[lastRound.scenarioId];
    const isPass = lastRound.action === 'pass';

    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-son-border bg-son-card p-5">
            <h2 className="text-2xl font-bold text-son-text">
              That was {revealScenario?.companyName ?? '?'}.
            </h2>

            <div className="mt-3 space-y-1 text-sm text-son-textSecondary">
              <p>{revealScenario?.ticker}</p>
              <p>{revealScenario?.outcomeLabel}</p>
              <p>Actual return: {formatPercent(revealScenario?.actualReturnPercent ?? 0)}</p>
            </div>

            {/* Outcome sparkline */}
            {revealScenario && (
              <div className="mt-3">
                <Sparkline prices={revealScenario.outcomePrices} height={96} variant="outcome" />
              </div>
            )}

            <div className="mt-4 border-t border-son-border pt-4 space-y-1 text-sm">
              {isPass ? (
                <p className="text-son-textSecondary">You passed.</p>
              ) : (
                <>
                  <p className="text-son-textSecondary">
                    Your call:{' '}
                    <span className="text-son-text font-medium">
                      {lastRound.action.charAt(0).toUpperCase() + lastRound.action.slice(1)}
                    </span>
                  </p>
                  <p className="text-son-textSecondary">
                    Confidence:{' '}
                    <span className="text-son-text font-medium">
                      {lastRound.confidence
                        ? CONFIDENCE_CONFIG[lastRound.confidence].label
                        : '\u2014'}
                    </span>
                  </p>
                  <p className="text-son-textSecondary">
                    Stake:{' '}
                    <span className="text-son-text font-medium">
                      {formatMoney(lastRound.stakeAmount)}
                    </span>
                  </p>
                </>
              )}
              <p className="text-son-textSecondary">
                {lastRound.pnlAmount >= 0 ? 'Gain' : 'Loss'}:{' '}
                <span
                  className={`font-medium tabular-nums ${
                    lastRound.pnlAmount > 0
                      ? 'text-son-green'
                      : lastRound.pnlAmount < 0
                        ? 'text-son-red'
                        : 'text-son-textSecondary'
                  }`}
                >
                  {lastRound.pnlAmount !== 0
                    ? formatSignedMoney(lastRound.pnlAmount)
                    : '$0'}
                </span>
              </p>
              <p className="text-son-textSecondary">
                New bankroll:{' '}
                <span className="text-son-text font-medium">
                  {formatMoney(lastRound.bankrollAfter)}
                </span>
              </p>
              <p className="text-son-textSecondary">
                Signal Score:{' '}
                <span
                  className={`font-medium tabular-nums ${
                    lastRound.signalScoreDelta > 0
                      ? 'text-son-green'
                      : lastRound.signalScoreDelta < 0
                        ? 'text-son-red'
                        : 'text-son-textSecondary'
                  }`}
                >
                  {formatSignalScore(lastRound.signalScoreDelta)}
                </span>
              </p>
              {lastRound.companyGuess && revealScenario && lastRound.companyGuessCorrect === true && (
                <p className="text-son-green">
                  You called it &mdash; it was {revealScenario.companyName}. +2 Signal
                </p>
              )}
              {lastRound.companyGuess && lastRound.companyGuessCorrect === false && (
                <p className="text-son-red">
                  Your company call: &quot;{lastRound.companyGuess}&quot; &mdash; not quite.
                  &minus;1 Signal
                </p>
              )}
            </div>

            {revealScenario && (
              <div className="mt-4 border-t border-son-border pt-4">
                <p className="text-sm leading-relaxed text-son-textSecondary">
                  {revealScenario.revealShortText}
                </p>
                {revealScenario.funFact && (
                  <p className="mt-2 text-xs leading-relaxed text-son-textMuted">
                    <span className="font-semibold text-son-textSecondary">Fun fact:</span>{' '}
                    {revealScenario.funFact}
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="mt-4 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110"
          >
            {run.status === 'in_progress' ? 'Next Round' : 'See Summary'}
          </button>
        </div>
      </main>
    );
  }

  // ---- Summary View ----
  if (view === 'summary') {
    const bestCompany =
      summary.bestTrade && scenarioByLookup[summary.bestTrade.scenarioId]?.companyName;
    const worstCompany =
      summary.worstTrade && scenarioByLookup[summary.worstTrade.scenarioId]?.companyName;

    return (
      <main className="flex min-h-screen flex-col items-center px-4 py-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-son-border bg-son-card p-6">
            {summary.wentBankrupt ? (
              <>
                <h1 className="text-3xl font-bold text-son-red">Bankrupt.</h1>
                <p className="mt-2 text-sm text-son-textSecondary">
                  Your bankroll hit $0 &mdash; the run is over.
                </p>
              </>
            ) : (
              <h1 className="text-3xl font-bold text-son-text">Run Complete.</h1>
            )}

            <div className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Final Bankroll</span>
                <span className="font-semibold text-son-text tabular-nums">
                  {formatMoney(summary.finalBankroll)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Signal Score</span>
                <span className="font-semibold text-son-signalCyan tabular-nums">
                  {formatSignalScore(summary.signalScore)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Correct Calls</span>
                <span className="font-semibold text-son-text">{summary.correctCalls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Wrong Calls</span>
                <span className="font-semibold text-son-text">{summary.wrongCalls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Passes</span>
                <span className="font-semibold text-son-text">{summary.passes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Companies Called</span>
                <span className="font-semibold text-son-text">{summary.companiesCalled}</span>
              </div>
              {summary.bestTrade && (
                <div className="flex justify-between">
                  <span className="text-son-textSecondary">Best Trade</span>
                  <span className="font-semibold text-son-green">
                    {formatSignedMoney(summary.bestTrade.pnlAmount)}
                    {bestCompany ? ` on ${bestCompany}` : ''}
                  </span>
                </div>
              )}
              {summary.worstTrade && (
                <div className="flex justify-between">
                  <span className="text-son-textSecondary">Worst Trade</span>
                  <span className="font-semibold text-son-red">
                    {formatSignedMoney(summary.worstTrade.pnlAmount)}
                    {worstCompany ? ` on ${worstCompany}` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <a
              href="/play/classic"
              className="flex-1 rounded-lg border border-son-border bg-son-card px-4 py-3 text-center text-sm font-semibold text-son-textSecondary transition-colors hover:border-son-borderStrong"
            >
              Play Again
            </a>
            <a
              href="/"
              className="flex-1 rounded-lg border border-son-border bg-son-card px-4 py-3 text-center text-sm font-semibold text-son-textSecondary transition-colors hover:border-son-borderStrong"
            >
              Home
            </a>
          </div>
        </div>
      </main>
    );
  }

  return null;
}
