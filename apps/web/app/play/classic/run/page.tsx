'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { CONFIDENCE_CONFIG, calculateStake } from '@signal-or-noise/game-engine';
import type { Confidence, RoundAction } from '@signal-or-noise/game-engine';
import type { CurrentRunPayload, RunSummaryPayload } from '@signal-or-noise/database';
import { api, ApiRequestError } from '@/lib/api';
import type { SubmitDecisionResult } from '@/lib/api';
import { formatMoney, formatSignedMoney, formatPercent, formatSignalScore } from '@/lib/format';
import Sparkline from '@/components/Sparkline';
import AnimatedMoney from '@/components/AnimatedMoney';
import { capture } from '@/lib/analytics';
import { playRevealSound } from '@/lib/sound';

// Fully-literal class strings so Tailwind's JIT compiler emits them.
// Do NOT build these by interpolating color names at runtime.
const CONFIDENCE_SELECTED_BOX: Record<Confidence, string> = {
  low: 'border-son-signalCyan bg-son-signalCyan/10',
  medium: 'border-son-green bg-son-green/10',
  high: 'border-son-amber bg-son-amber/10',
  all_in: 'border-son-violet bg-son-violet/10',
};
const CONFIDENCE_SELECTED_TEXT: Record<Confidence, string> = {
  low: 'text-son-signalCyan',
  medium: 'text-son-green',
  high: 'text-son-amber',
  all_in: 'text-son-violet',
};
const DECISION_SELECTED: Record<RoundAction, string> = {
  long: 'border-son-green bg-son-green/10 text-son-green',
  short: 'border-son-red bg-son-red/10 text-son-red',
  pass: 'border-son-textSecondary bg-son-textSecondary/10 text-son-textSecondary',
};

/** sessionStorage key marking an explicit "Save this run" request (D047). */
const CLAIM_INTENT_KEY = 'son_claim_intent_run';

type View = 'loading' | 'error' | 'round' | 'reveal' | 'summary';

function ClassicRunClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useUser();
  const isDaily = pathname === '/play/daily/run';
  const startPath = isDaily ? '/play/daily' : '/play/classic';
  const runPath = isDaily ? '/play/daily/run' : '/play/classic/run';

  const [view, setView] = useState<View>('loading');
  const [run, setRun] = useState<CurrentRunPayload | null>(null);
  const [lastResult, setLastResult] = useState<SubmitDecisionResult | null>(null);
  const [summary, setSummary] = useState<RunSummaryPayload | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [claimPending, setClaimPending] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const [action, setAction] = useState<RoundAction | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [companyGuess, setCompanyGuess] = useState('');

  const bootedRef = useRef(false);

  const resetForm = () => {
    setAction(null);
    setConfidence(null);
    setCompanyGuess('');
  };

  const showSummary = useCallback(
    async (runId: string) => {
      const result = await api.runSummary(runId);
      setSummary(result.summary);
      setView('summary');
      router.replace(`${runPath}?runId=${encodeURIComponent(runId)}`);
    },
    [router, runPath],
  );

  const loadCurrentRun = useCallback(async (): Promise<CurrentRunPayload | null> => {
    if (isDaily) return (await api.dailyStatus()).run;
    return (await api.currentRun()).run;
  }, [isDaily]);

  // Boot exactly once: an explicit difficulty starts a fresh run; otherwise
  // resume the active run (guest cookie or account), or reload a finished
  // run's summary from the runId param after a refresh.
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const difficultyParam = searchParams.get('difficulty');
    const runIdParam = searchParams.get('runId');
    const difficulty =
      difficultyParam === 'easy' || difficultyParam === 'medium' || difficultyParam === 'hard'
        ? difficultyParam
        : null;

    void (async () => {
      try {
        if (isDaily) {
          if (runIdParam) {
            await showSummary(runIdParam);
            return;
          }
          const current = await loadCurrentRun();
          if (current) {
            setRun(current);
            setView('round');
            return;
          }
          router.replace(startPath);
          return;
        }
        if (difficulty) {
          const created = await api.createClassicRun(difficulty);
          setRun(created.run);
          setView('round');
          // Strip the param so a refresh resumes this run instead of starting over.
          router.replace('/play/classic/run');
          return;
        }
        const current = await loadCurrentRun();
        if (current) {
          setRun(current);
          setView('round');
          return;
        }
        if (runIdParam) {
          await showSummary(runIdParam);
          return;
        }
        router.replace(startPath);
      } catch (error) {
        setFatalError(error instanceof Error ? error.message : 'Something went wrong');
        setView('error');
      }
    })();
  }, [isDaily, loadCurrentRun, router, searchParams, showSummary, startPath]);

  const performClaim = useCallback(
    async (runId: string) => {
      setClaimPending(true);
      setClaimError(null);
      try {
        const claimed = await api.claimRun(runId);
        sessionStorage.removeItem(CLAIM_INTENT_KEY);
        setSummary(claimed.summary);
      } catch (error) {
        if (error instanceof ApiRequestError && error.status === 409) {
          // The claim may have landed already (double-click/retry) — reload the
          // summary; if it now belongs to this account it renders as saved.
          try {
            const reloaded = await api.runSummary(runId);
            setSummary(reloaded.summary);
            if (reloaded.summary.claimed) {
              sessionStorage.removeItem(CLAIM_INTENT_KEY);
              return;
            }
          } catch {
            // fall through to the retryable error state
          }
        }
        setClaimError(
          error instanceof ApiRequestError && error.status !== 500
            ? error.message
            : 'Saving failed — your guest result is untouched. Try again.',
        );
      } finally {
        setClaimPending(false);
      }
    },
    [],
  );

  // After an explicit "Save this run" sign-in completes, finish the claim.
  // A plain sign-in (header button) sets no intent and never claims anything.
  useEffect(() => {
    if (!isSignedIn || view !== 'summary' || !summary?.claimable || claimPending) return;
    if (sessionStorage.getItem(CLAIM_INTENT_KEY) === summary.id) {
      void performClaim(summary.id);
    }
  }, [isSignedIn, view, summary, claimPending, performClaim]);

  if (view === 'loading') {
    return (
      <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-son-bg">
        <p className="text-son-textMuted">Loading your run...</p>
      </main>
    );
  }

  if (view === 'error') {
    return (
      <main id="main-content" tabIndex={-1} className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-sm text-son-textSecondary">
          {fatalError ?? 'Something went wrong.'}
        </p>
        <a
          href={startPath}
          className="rounded-lg border border-son-border bg-son-card px-4 py-2 text-sm font-semibold text-son-textSecondary hover:border-son-borderStrong"
        >
          Back to Classic Run setup
        </a>
      </main>
    );
  }

  const handleLockIn = async () => {
    if (!run || !action || submitting) return;
    const trimmedGuess = companyGuess.trim();
    setSubmitting(true);
    setActionError(null);
    try {
      const result = await api.submitDecision(run.id, {
        roundIndex: run.round.roundIndex,
        action,
        confidence: action === 'pass' ? undefined : confidence ?? undefined,
        companyGuess: trimmedGuess.length > 0 ? trimmedGuess : undefined,
      });
      setLastResult(result);
      capture({ name: 'round_submitted', properties: { mode: isDaily ? 'daily' : 'classic', action, ...(action !== 'pass' && confidence ? { confidence } : {}) } });
      const revealResult = action === 'pass'
        ? 'pass'
        : result.round.pnlAmount > 0
          ? 'win'
          : result.round.pnlAmount < 0
            ? 'loss'
            : 'flat';
      playRevealSound(revealResult);
      capture({ name: 'reveal_viewed', properties: { mode: isDaily ? 'daily' : 'classic', result: revealResult } });
      setView('reveal');
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 409) {
        // This round was already submitted (double tap / stale tab): resync.
        try {
          const current = await loadCurrentRun();
          if (current) {
            setRun(current);
            resetForm();
            setActionError(null);
          } else {
            setActionError('This run already finished on another tab. Refresh to see the result.');
          }
        } catch {
          setActionError('Could not resync the run. Check your connection and try again.');
        }
      } else {
        setActionError(
          error instanceof ApiRequestError && error.status !== 500
            ? error.message
            : 'Could not lock your call. Check your connection and try again.',
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (!lastResult) return;
    if (lastResult.run.status === 'in_progress') {
      setView('loading');
      try {
        const current = await loadCurrentRun();
        if (current) {
          setRun(current);
          resetForm();
          setView('round');
        } else {
          await showSummary(lastResult.run.id);
        }
      } catch (error) {
        setFatalError(error instanceof Error ? error.message : 'Something went wrong');
        setView('error');
      }
    } else {
      setView('loading');
      try {
        await showSummary(lastResult.run.id);
      } catch (error) {
        setFatalError(error instanceof Error ? error.message : 'Something went wrong');
        setView('error');
      }
    }
  };

  // ---- Round View ----
  if (view === 'round' && run) {
    const round = run.round;
    const canLockIn =
      !submitting && action !== null && (action === 'pass' || confidence !== null);

    return (
      <main id="main-content" tabIndex={-1} className="page-shell">
        <div className="mx-auto w-full max-w-3xl">
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
            {isDaily && (
              <p className="mt-1 text-xs text-son-textMuted">
                Daily Challenge &middot; UTC day &middot; same 10 rounds for everyone
              </p>
            )}
            {!run.isOfficial && (
              <p className="mt-1 text-xs text-son-textMuted">
                Guest run — finish it to save the result with an account.
              </p>
            )}
          </div>

          {/* Scenario card */}
          <div className="mb-6 rounded-2xl border border-son-border bg-son-card p-5">
            <p className="mb-1 text-xs text-son-textMuted">
              {round.decisionDateLabel} &middot; {round.holdingPeriodLabel}
            </p>

            <h2 className="mb-1 text-lg font-semibold text-son-text">{round.title}</h2>

            <p className="mb-2 text-sm leading-relaxed text-son-textSecondary">
              {round.companyDescription}
            </p>

            <p className="mb-4 text-sm leading-relaxed text-son-textMuted">
              {round.macroContext}
            </p>

            {/* Lookback sparkline — demoted to context (D026) */}
            <div className="mb-4">
              <p className="mb-1 text-xs text-son-textMuted">
                Price path into this decision
              </p>
              <Sparkline
                prices={round.lookbackChart.map((point) => point.price)}
                height={96}
                variant="lookback"
              />
            </div>

            {/* Balanced Tension (D026) */}
            <div className="mb-0 space-y-3">
              <h3 className="text-sm font-semibold text-son-text">Signal or Noise?</h3>
              <p className="text-sm leading-relaxed text-son-textSecondary">
                {round.situation}
              </p>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-son-textMuted">
                  Why it might work
                </p>
                <p className="text-sm leading-relaxed text-son-textSecondary">
                  {round.longCase}
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-son-textMuted">
                  What could break
                </p>
                <p className="text-sm leading-relaxed text-son-textSecondary">
                  {round.shortCase}
                </p>
              </div>
              {round.setupHints.length > 0 ? (
                <ul className="list-inside list-disc space-y-1 text-sm text-son-textSecondary">
                  {round.setupHints.map((hint, i) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              ) : null}
            </div>
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
                    aria-pressed={isSelected}
                    onClick={() => {
                      setAction(a);
                      if (a === 'pass') setConfidence(null);
                    }}
                    className={`min-h-11 flex-1 rounded-lg border px-4 py-2.5 text-sm transition-colors ${
                      isSelected
                        ? `${DECISION_SELECTED[a]} font-semibold`
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
                const selected = confidence === level;

                let classes = '';
                if (disabled) {
                  classes = 'cursor-not-allowed border-son-borderSubtle/50 bg-son-surface/30 text-son-textMuted';
                } else if (selected) {
                  classes = CONFIDENCE_SELECTED_BOX[level];
                } else {
                  classes = 'border-son-border bg-son-card hover:border-son-borderStrong';
                }

                return (
                  <button
                    key={level}
                    type="button"
                    disabled={disabled}
                    aria-pressed={selected}
                    onClick={() => setConfidence(level)}
                    className={`min-h-16 rounded-lg border p-3 text-left transition-colors ${classes}`}
                  >
                    <div className={`text-xs ${disabled ? '' : selected ? CONFIDENCE_SELECTED_TEXT[level] : 'text-son-textSecondary'}`}>
                      {config.label} ({pct}%)
                    </div>
                    <div className={`mt-0.5 text-lg font-bold tabular-nums ${disabled ? '' : selected ? CONFIDENCE_SELECTED_TEXT[level] : 'text-son-text'}`}>
                      {formatMoney(stake)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {actionError && (
            <p className="mb-3 rounded-lg border border-son-red/40 bg-son-red/10 px-4 py-2 text-sm text-son-red">
              {actionError}
            </p>
          )}

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
            {submitting ? 'Locking...' : 'Lock In'}
          </button>
        </div>
      </main>
    );
  }

  // ---- Reveal View ----
  if (view === 'reveal' && lastResult) {
    const lastRound = lastResult.round;
    const reveal = lastResult.reveal;
    const isPass = lastRound.action === 'pass';

    return (
      <main id="main-content" tabIndex={-1} className="page-shell signal-enter" aria-live="polite">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-son-border bg-son-card p-5">
            {/* Win/loss/pass banner */}
            {lastRound.action === 'pass' ? (
              <div className="rounded-lg bg-son-surface px-4 py-3 mb-4 text-center text-lg font-bold text-son-textSecondary">
                You passed
              </div>
            ) : lastRound.pnlAmount > 0 ? (
              <div className="rounded-lg bg-son-green/15 px-4 py-3 mb-4 text-center text-lg font-bold text-son-green">
                You won {formatSignedMoney(lastRound.pnlAmount)}
              </div>
            ) : lastRound.pnlAmount < 0 ? (
              <div className="rounded-lg bg-son-red/15 px-4 py-3 mb-4 text-center text-lg font-bold text-son-red">
                You lost {formatSignedMoney(lastRound.pnlAmount)}
              </div>
            ) : (
              <div className="rounded-lg bg-son-surface px-4 py-3 mb-4 text-center text-lg font-bold text-son-textSecondary">
                Break-even
              </div>
            )}

            <h2 className="text-2xl font-bold text-son-text">
              That was {reveal.companyName}.
            </h2>

            <div className="mt-3 space-y-1 text-sm text-son-textSecondary">
              <p>{reveal.ticker}</p>
              <p>{reveal.outcomeLabel}</p>
              <p>Actual return: {formatPercent(reveal.actualReturnPercent)}</p>
            </div>

            {/* Outcome sparkline */}
            <div className="mt-3">
              <Sparkline
                prices={reveal.outcomeChart.map((point) => point.price)}
                height={96}
                variant="outcome"
              />
            </div>

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
                        : '—'}
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
                <span className="text-son-text font-medium"><AnimatedMoney from={lastRound.bankrollBefore} to={lastRound.bankrollAfter} /></span>
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
              {lastRound.companyGuess && lastRound.companyGuessCorrect === true && (
                <p className="text-son-green">
                  You called it &mdash; it was {reveal.companyName}. +2 Signal
                </p>
              )}
              {lastRound.companyGuess && lastRound.companyGuessCorrect === false && (
                <p className="text-son-red">
                  Your company call: &quot;{lastRound.companyGuess}&quot; &mdash; not quite.
                  &minus;1 Signal
                </p>
              )}
            </div>

            <div className="mt-4 border-t border-son-border pt-4">
              <p className="text-sm leading-relaxed text-son-textSecondary">
                {reveal.shortText}
              </p>
              {reveal.funFact && (
                <p className="mt-2 text-xs leading-relaxed text-son-textMuted">
                  <span className="font-semibold text-son-textSecondary">Fun fact:</span>{' '}
                  {reveal.funFact}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="mt-4 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110"
          >
            {lastResult.run.status === 'in_progress' ? 'Next Round' : 'See Summary'}
          </button>
        </div>
      </main>
    );
  }

  // ---- Summary View ----
  if (view === 'summary' && summary) {
    const wentBankrupt = summary.status === 'bankrupt';
    const saved = summary.isOfficial || summary.claimed;

    const claimCard = summary.claimable ? (
      <div className="mt-4 rounded-2xl border border-son-signalBlue/50 bg-son-card p-5">
        <h2 className="text-base font-semibold text-son-text">Save this run</h2>
        <p className="mt-1 text-sm leading-relaxed text-son-textSecondary">
          Keep this score and your stats, qualify for the future Classic
          leaderboard, and unlock profile features.
        </p>
        {claimError && (
          <p className="mt-3 rounded-lg border border-son-red/40 bg-son-red/10 px-3 py-2 text-sm text-son-red">
            {claimError}
          </p>
        )}
        {isSignedIn ? (
          <button
            type="button"
            disabled={claimPending}
            onClick={() => void performClaim(summary.id)}
            className="mt-4 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {claimPending ? 'Saving...' : claimError ? 'Retry save' : 'Save this run'}
          </button>
        ) : (
          <a
            href={`/sign-in?redirect_url=${encodeURIComponent(`/play/classic/run?runId=${summary.id}`)}`}
            onClick={() => sessionStorage.setItem(CLAIM_INTENT_KEY, summary.id)}
            className="mt-4 block w-full rounded-lg bg-son-signalBlue px-6 py-3 text-center text-base font-semibold text-son-textInverse transition-colors hover:brightness-110"
          >
            Save this run
          </a>
        )}
        <p className="mt-2 text-center text-xs text-son-textMuted">
          Your guest result stays right here if you change your mind.
        </p>
      </div>
    ) : null;

    return (
      <main id="main-content" tabIndex={-1} className="flex min-h-screen flex-col items-center px-4 py-6 pb-28 lg:pb-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-son-border bg-son-card p-6">
            {wentBankrupt ? (
              <>
                <h1 className="text-3xl font-bold text-son-red">Bankrupt.</h1>
                <p className="mt-2 text-sm text-son-textSecondary">
                  Your bankroll hit $0 &mdash; the run is over.
                </p>
              </>
            ) : (
              <h1 className="text-3xl font-bold text-son-text">
                {isDaily ? 'Daily Complete.' : 'Run Complete.'}
              </h1>
            )}

            {saved ? (
              <p className="mt-2 inline-block rounded-full border border-son-green/50 bg-son-green/10 px-3 py-0.5 text-xs font-semibold text-son-green">
                Saved to your account
              </p>
            ) : (
              <p className="mt-2 inline-block rounded-full border border-son-borderSubtle px-3 py-0.5 text-xs text-son-textMuted">
                Guest run &mdash; unofficial
              </p>
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
                    {formatSignedMoney(summary.bestTrade.pnlAmount)} on{' '}
                    {summary.bestTrade.companyName}
                  </span>
                </div>
              )}
              {summary.worstTrade && (
                <div className="flex justify-between">
                  <span className="text-son-textSecondary">Worst Trade</span>
                  <span className="font-semibold text-son-red">
                    {formatSignedMoney(summary.worstTrade.pnlAmount)} on{' '}
                    {summary.worstTrade.companyName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {claimCard}

          {isDaily && (
            <p className="mt-4 rounded-lg border border-son-signalCyan/30 bg-son-signalCyan/5 px-3 py-2 text-center text-xs leading-relaxed text-son-textSecondary">
              Your best completed attempt for this UTC date ranks on the Daily leaderboard.
            </p>
          )}

          {saved && (
            <a
              href="/profile"
              className="mt-4 block rounded-lg border border-son-border bg-son-card px-4 py-3 text-center text-sm font-semibold text-son-textSecondary transition-colors hover:border-son-borderStrong"
            >
              View my saved stats
            </a>
          )}

          <div className="mt-4 flex gap-3">
            <a
              href={startPath}
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

export default function ClassicRunPage() {
  return (
    <Suspense
      fallback={
        <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-son-bg">
          <p className="text-son-textMuted">Loading...</p>
        </main>
      }
    >
      <ClassicRunClient />
    </Suspense>
  );
}
