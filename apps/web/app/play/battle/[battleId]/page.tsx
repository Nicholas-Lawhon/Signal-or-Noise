'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { CONFIDENCE_CONFIG, calculateStake } from '@signal-or-noise/game-engine';
import type { Confidence, RoundAction } from '@signal-or-noise/game-engine';
import type { BattleDecisionPayload, BattleStatePayload } from '@signal-or-noise/database';
import { api, ApiRequestError } from '@/lib/api';
import { formatMoney, formatPercent, formatSignalScore, formatSignedMoney } from '@/lib/format';
import Sparkline from '@/components/Sparkline';
import { capture } from '@/lib/analytics';

const POLL_INTERVAL_MS = 2500;

// Fully-literal class strings so Tailwind's JIT compiler emits them.
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

function actionLabel(action: RoundAction): string {
  return action.charAt(0).toUpperCase() + action.slice(1);
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function callLabel(action: RoundAction, confidence: Confidence | null): string {
  if (action === 'pass') return 'Pass';
  const pct = confidence ? (CONFIDENCE_CONFIG[confidence].bankrollPercent * 100).toFixed(0) : null;
  return pct ? `${actionLabel(action)} (${pct}%)` : actionLabel(action);
}

function DecisionLine({ label, decision }: { label: string; decision: BattleDecisionPayload }) {
  return (
    <div className="rounded-lg border border-son-border bg-son-surface/50 px-3 py-2.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-son-text">{label}</span>
        <span className="text-son-textSecondary">
          {callLabel(decision.action, decision.confidence)}
          {decision.wasAutoPass ? ' · timed out' : ''}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-son-textSecondary">
        <span>
          {decision.action === 'pass' ? 'Nothing at risk' : `Stake ${formatMoney(decision.stakeAmount)}`}
          {decision.companyGuess ? (
            <>
              {' · called '}
              <span className={decision.companyGuessCorrect ? 'text-son-green' : 'text-son-red'}>
                &quot;{decision.companyGuess}&quot;
              </span>
            </>
          ) : null}
        </span>
        <span
          className={`font-semibold tabular-nums ${
            decision.pnlAmount > 0
              ? 'text-son-green'
              : decision.pnlAmount < 0
                ? 'text-son-red'
                : 'text-son-textSecondary'
          }`}
        >
          {decision.pnlAmount !== 0 ? formatSignedMoney(decision.pnlAmount) : '$0'}
        </span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-xs text-son-textMuted">
        <span>Bankroll {formatMoney(decision.bankrollAfter)}</span>
        <span className="tabular-nums">Signal {formatSignalScore(decision.signalScoreDelta)}</span>
      </div>
    </div>
  );
}

function BattleRoom() {
  const params = useParams<{ battleId: string }>();
  const battleId = typeof params.battleId === 'string' ? params.battleId : '';

  const [battle, setBattle] = useState<BattleStatePayload | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nowTick, setNowTick] = useState(() => Date.now());

  const [action, setAction] = useState<RoundAction | null>(null);
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [companyGuess, setCompanyGuess] = useState('');

  const clockOffsetRef = useRef(0);
  const latestServerNowRef = useRef(0);
  const formRoundRef = useRef<number | null>(null);
  const deadlineFetchRef = useRef(0);
  const latestStatusRef = useRef<BattleStatePayload['status'] | null>(null);
  const completionCapturedRef = useRef(false);

  /** Applies a payload unless an older concurrent response arrives late. */
  const applyState = useCallback((next: BattleStatePayload) => {
    const serverNow = new Date(next.serverNow).getTime();
    if (serverNow < latestServerNowRef.current) return;
    latestServerNowRef.current = serverNow;
    clockOffsetRef.current = serverNow - Date.now();
    setBattle((previous) => {
      const newDecidingRound =
        next.status === 'in_progress' &&
        next.roundPhase === 'deciding' &&
        formRoundRef.current !== next.currentRoundIndex;
      if (newDecidingRound) {
        formRoundRef.current = next.currentRoundIndex;
        setAction(null);
        setConfidence(null);
        setCompanyGuess('');
      }
      return previous && JSON.stringify(previous) === JSON.stringify(next) ? previous : next;
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const result = await api.battleState(battleId);
      applyState(result.battle);
      setFatalError(null);
      setConnectionError(null);
    } catch (error) {
      if (error instanceof ApiRequestError && (error.status === 403 || error.status === 404 || error.status === 401)) {
        setFatalError(
          error.status === 401
            ? 'Sign in to view this battle.'
            : 'This battle is not yours to watch.',
        );
      } else {
        setConnectionError('Connection lost. Retrying automatically...');
      }
      // Transient network/server errors: keep the last known state and let
      // the next poll retry — the server deadline is authoritative anyway.
    }
  }, [battleId, applyState]);

  // Boot + poll while the battle is live.
  useEffect(() => {
    if (!battleId) return;
    void refresh();
    const interval = setInterval(() => {
      const status = latestStatusRef.current;
      if (status === 'completed' || status === 'expired') return;
      void refresh();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [battleId, refresh]);

  useEffect(() => {
    latestStatusRef.current = battle?.status ?? null;
  }, [battle]);

  useEffect(() => {
    if (completionCapturedRef.current || battle?.status !== 'completed' || !battle.summary) return;
    completionCapturedRef.current = true;
    const outcome = battle.summary.outcome === 'you_won' ? 'win' : battle.summary.outcome === 'you_lost' ? 'loss' : 'draw';
    capture({ name: 'battle_completed', properties: { outcome } });
  }, [battle]);

  // Countdown ticker; when the deadline passes, ask the server to settle.
  useEffect(() => {
    const ticker = setInterval(() => {
      setNowTick(Date.now());
      const deadline = battle?.roundDeadlineAt ? new Date(battle.roundDeadlineAt).getTime() : null;
      if (
        deadline !== null &&
        battle?.status === 'in_progress' &&
        battle.roundPhase === 'deciding' &&
        Date.now() + clockOffsetRef.current >= deadline &&
        Date.now() - deadlineFetchRef.current > 1500
      ) {
        deadlineFetchRef.current = Date.now();
        void refresh();
      }
    }, 500);
    return () => clearInterval(ticker);
  }, [battle, refresh]);

  const ready = async (round: number) => {
    if (busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const result = await api.battleReady(battleId, round);
      applyState(result.battle);
    } catch (error) {
      if (error instanceof ApiRequestError && (error.status === 409 || error.status === 422)) {
        await refresh();
      } else {
        setActionError(
          error instanceof ApiRequestError && error.status !== 500
            ? error.message
            : 'Could not ready up. Try again.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const lockIn = async () => {
    if (!battle || !action || busy) return;
    const trimmedGuess = companyGuess.trim();
    setBusy(true);
    setActionError(null);
    try {
      const result = await api.submitBattleDecision(battleId, {
        roundIndex: battle.currentRoundIndex,
        action,
        confidence: action === 'pass' ? undefined : confidence ?? undefined,
        companyGuess: trimmedGuess.length > 0 ? trimmedGuess : undefined,
      });
      applyState(result.battle);
    } catch (error) {
      if (error instanceof ApiRequestError && (error.status === 409 || error.status === 422)) {
        // Deadline hit or double tap: the server settled it — resync.
        await refresh();
      } else {
        setActionError(
          error instanceof ApiRequestError && error.status !== 500
            ? error.message
            : 'Could not lock your call. Check your connection and try again.',
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const copyInvite = async () => {
    if (!battle?.inviteCode) return;
    const url = `${window.location.origin}/play/battle/join/${battle.inviteCode}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setActionError('Could not copy — long-press the link below to copy it.');
    }
  };

  if (fatalError) {
    return (
      <main id="main-content" tabIndex={-1} className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-sm text-son-textSecondary">{fatalError}</p>
        <Link
          href="/play/battle"
          className="rounded-lg border border-son-border bg-son-card px-4 py-2 text-sm font-semibold text-son-textSecondary hover:border-son-borderStrong"
        >
          Back to Friend Battles
        </Link>
      </main>
    );
  }

  if (!battle) {
    return (
      <main id="main-content" tabIndex={-1} className="flex min-h-screen flex-col items-center justify-center gap-3 bg-son-bg px-4">
        <p role="status" aria-live="polite" className="text-son-textMuted">
          {connectionError ?? 'Loading the battle...'}
        </p>
        {connectionError ? (
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-lg border border-son-border bg-son-card px-4 py-2 text-sm font-semibold text-son-textSecondary hover:border-son-borderStrong"
          >
            Retry now
          </button>
        ) : null}
      </main>
    );
  }

  const opponentName = battle.opponent?.name ?? 'your opponent';
  const deadlineMs = battle.roundDeadlineAt ? new Date(battle.roundDeadlineAt).getTime() : null;
  const remainingSeconds =
    deadlineMs !== null
      ? Math.max(0, Math.ceil((deadlineMs - (nowTick + clockOffsetRef.current)) / 1000))
      : null;

  const scoreBar = (
    <div className="mb-4 rounded-lg border border-son-border bg-son-card px-4 py-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-son-textSecondary">
          Round {Math.min(battle.currentRoundIndex + 1, battle.totalRounds)}/{battle.totalRounds}
        </span>
        {battle.status === 'in_progress' && battle.roundPhase === 'deciding' && (
          remainingSeconds !== null ? (
            <span
              role="timer"
              aria-label={`${remainingSeconds} seconds remaining`}
              className={`font-bold tabular-nums ${
                remainingSeconds <= 10 ? 'text-son-red' : 'text-son-amber'
              }`}
            >
              {formatCountdown(remainingSeconds)}
            </span>
          ) : (
            <span className="text-xs text-son-textMuted">No timer</span>
          )
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-son-surface px-3 py-2">
          <p className="font-semibold text-son-text">You</p>
          <p className="mt-0.5 tabular-nums text-son-textSecondary">
            {formatMoney(battle.you.bankroll)}
            {' · '}
            <span className="text-son-signalCyan">{formatSignalScore(battle.you.signalScore)}</span>
          </p>
        </div>
        <div className="rounded-lg bg-son-surface px-3 py-2">
          <p className="truncate font-semibold text-son-text">
            {battle.opponent ? battle.opponent.name : 'Waiting...'}
            {battle.status === 'in_progress' &&
              battle.roundPhase === 'deciding' &&
              battle.opponent?.hasDecidedCurrentRound && (
                <span className="ml-1.5 rounded-full border border-son-green/50 bg-son-green/10 px-1.5 py-px text-[10px] font-semibold text-son-green">
                  locked in
                </span>
              )}
          </p>
          {battle.opponent ? (
            <p className="mt-0.5 tabular-nums text-son-textSecondary">
              {formatMoney(battle.opponent.bankroll)}
              {' · '}
              <span className="text-son-signalCyan">
                {formatSignalScore(battle.opponent.signalScore)}
              </span>
            </p>
          ) : (
            <p className="mt-0.5 text-son-textMuted">Share your invite</p>
          )}
        </div>
      </div>
      {battle.opponent?.lastCall && battle.status === 'in_progress' && (
        <p className="mt-2 text-xs text-son-textMuted">
          {opponentName}&apos;s last call:{' '}
          <span className="text-son-textSecondary">
            {callLabel(battle.opponent.lastCall.action, battle.opponent.lastCall.confidence)}
          </span>
          {battle.opponent.lastCall.companyGuess
            ? ` · guessed "${battle.opponent.lastCall.companyGuess}"`
            : ''}
        </p>
      )}
    </div>
  );

  const errorBanner = actionError || connectionError ? (
    <div
      role={actionError ? 'alert' : 'status'}
      aria-live={actionError ? 'assertive' : 'polite'}
      className="mb-3 rounded-lg border border-son-red/40 bg-son-red/10 px-4 py-2 text-sm text-son-red"
    >
      <p>{actionError ?? connectionError}</p>
      {connectionError ? (
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-2 rounded-md border border-son-red/50 px-3 py-1.5 text-xs font-semibold text-son-text"
        >
          Retry now
        </button>
      ) : null}
    </div>
  ) : null;

  // ---- Waiting for an opponent ----
  if (battle.status === 'awaiting_opponent') {
    const inviteUrl = battle.inviteCode
      ? `/play/battle/join/${battle.inviteCode}`
      : null;
    return (
      <main id="main-content" tabIndex={-1} className="page-shell">
        <div className="mx-auto w-full max-w-3xl">
          <h1 className="text-2xl font-bold text-son-text">Battle created.</h1>
          <p className="mt-2 text-sm leading-relaxed text-son-textSecondary">
            Send this invite to one friend. The first signed-in player to accept becomes your
            opponent, and the battle starts once you both ready up.
          </p>
          <div className="mt-6 rounded-2xl border border-son-border bg-son-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-son-textMuted">
              Invite link
            </p>
            {inviteUrl ? (
              <>
                <p className="mt-2 break-all rounded-lg bg-son-surface px-3 py-2 font-mono text-xs text-son-textSecondary">
                  {typeof window === 'undefined' ? inviteUrl : `${window.location.origin}${inviteUrl}`}
                </p>
                <button
                  type="button"
                  onClick={() => void copyInvite()}
                  className="mt-3 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110"
                >
                  {copied ? 'Copied!' : 'Copy invite link'}
                </button>
              </>
            ) : null}
            {errorBanner}
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-son-textMuted">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-son-signalCyan" />
              Waiting for a friend to accept... this page updates automatically.
            </p>
            <p className="mt-2 text-center text-xs text-son-textMuted">
              Unfinished battles expire 24 hours after creation.
            </p>
          </div>
          <Link
            href="/play/battle"
            className="mt-4 block rounded-lg border border-son-border bg-son-card px-4 py-3 text-center text-sm font-semibold text-son-textSecondary transition-colors hover:border-son-borderStrong"
          >
            Back to my battles
          </Link>
        </div>
      </main>
    );
  }

  // ---- Ready check ----
  if (battle.status === 'awaiting_ready') {
    const youReady = battle.you.readyRound >= 0;
    const opponentReady = (battle.opponent?.readyRound ?? -1) >= 0;
    return (
      <main id="main-content" tabIndex={-1} className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-son-borderStrong bg-son-cardElevated p-8 text-center">
          <h1 className="text-2xl font-bold text-son-text">
            {opponentName} is in.
          </h1>
          <p className="mt-2 text-sm text-son-textSecondary">
            {battle.totalRounds} rounds &middot; {formatMoney(battle.startingBankroll)} each
            &middot; {battle.timerSeconds ? `${battle.timerSeconds}s per round` : 'no timer'}.
            Round 1 starts when you&apos;re both ready.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 text-sm">
            <div
              className={`rounded-lg border px-3 py-2 ${
                youReady ? 'border-son-green/50 bg-son-green/10 text-son-green' : 'border-son-border bg-son-surface text-son-textSecondary'
              }`}
            >
              You {youReady ? '· ready' : '· not ready'}
            </div>
            <div
              className={`rounded-lg border px-3 py-2 ${
                opponentReady ? 'border-son-green/50 bg-son-green/10 text-son-green' : 'border-son-border bg-son-surface text-son-textSecondary'
              }`}
            >
              {battle.opponent?.name ?? 'Opponent'} {opponentReady ? '· ready' : '· not ready'}
            </div>
          </div>
          {errorBanner}
          {youReady ? (
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-son-textMuted">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-son-signalCyan" />
              Waiting for {opponentName}...
            </p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void ready(0)}
              className="mt-6 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Readying...' : "I'm ready"}
            </button>
          )}
        </div>
      </main>
    );
  }

  // ---- Deciding ----
  if (battle.status === 'in_progress' && battle.roundPhase === 'deciding') {
    const round = battle.round;
    if (battle.you.hasDecidedCurrentRound || !round) {
      const call = battle.you.currentCall;
      return (
        <main id="main-content" tabIndex={-1} className="page-shell">
          <div className="mx-auto w-full max-w-3xl">
            {scoreBar}
            <div className="rounded-2xl border border-son-borderStrong bg-son-cardElevated p-8 text-center">
              <h2 className="text-2xl font-bold text-son-text">Call locked.</h2>
              {call ? (
                <p className="mt-3 text-sm text-son-textSecondary">
                  {callLabel(call.action, call.confidence)}
                  {call.companyGuess ? ` · called "${call.companyGuess}"` : ''}
                </p>
              ) : null}
              <p className="mt-6 flex items-center justify-center gap-2 text-sm text-son-textMuted">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-son-signalCyan" />
                {battle.opponent?.hasDecidedCurrentRound
                  ? 'Settling the round...'
                  : `Waiting for ${opponentName} to make the call...`}
              </p>
              {remainingSeconds !== null && !battle.opponent?.hasDecidedCurrentRound ? (
                <p className="mt-2 text-xs text-son-textMuted">
                  Their deadline hits in {formatCountdown(remainingSeconds)} — then
                  their round becomes a Pass.
                </p>
              ) : null}
            </div>
          </div>
        </main>
      );
    }

    const canLockIn = !busy && action !== null && (action === 'pass' || confidence !== null);
    return (
      <main id="main-content" tabIndex={-1} className="page-shell">
        <div className="mx-auto w-full max-w-3xl">
          {scoreBar}

          <div className="mb-6 rounded-2xl border border-son-border bg-son-card p-5">
            <p className="mb-1 text-xs text-son-textMuted">
              {round.decisionDateLabel} &middot; {round.holdingPeriodLabel}
            </p>
            <h2 className="mb-1 text-lg font-semibold text-son-text">{round.title}</h2>
            <p className="mb-2 text-sm leading-relaxed text-son-textSecondary">
              {round.companyDescription}
            </p>
            <p className="mb-4 text-sm leading-relaxed text-son-textMuted">{round.macroContext}</p>
            <div className="mb-4">
              <p className="mb-1 text-xs text-son-textMuted">Price path into this decision</p>
              <Sparkline
                prices={round.lookbackChart.map((point) => point.price)}
                height={96}
                variant="lookback"
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-son-text">Signal or Noise?</h3>
              <p className="text-sm leading-relaxed text-son-textSecondary">{round.situation}</p>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-son-textMuted">
                  Why it might work
                </p>
                <p className="text-sm leading-relaxed text-son-textSecondary">{round.longCase}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-son-textMuted">
                  What could break
                </p>
                <p className="text-sm leading-relaxed text-son-textSecondary">{round.shortCase}</p>
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

          <div className="mb-4">
            <label htmlFor="battle-company-guess" className="mb-2 block text-sm font-semibold text-son-text">
              Call the Company (optional)
            </label>
            <input
              id="battle-company-guess"
              type="text"
              value={companyGuess}
              maxLength={100}
              onChange={(event) => setCompanyGuess(event.target.value)}
              placeholder="Name the hidden company"
              className="w-full rounded-lg border border-son-border bg-son-card px-4 py-3 text-sm text-son-text outline-none transition-colors placeholder:text-son-textMuted focus:border-son-signalBlue"
            />
            <p className="mt-1 text-xs text-son-textMuted">
              Right: +2 Signal &middot; Wrong: &minus;1 Signal &middot; Blank: no change
            </p>
          </div>

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
                    {actionLabel(a)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-sm font-semibold text-son-text">Confidence</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CONFIDENCE_CONFIG) as Confidence[]).map((level) => {
                const config = CONFIDENCE_CONFIG[level];
                const stake = calculateStake(battle.you.bankroll, level);
                const disabled = action === 'pass' || action === null;
                const pct = (config.bankrollPercent * 100).toFixed(0);
                const isSelected = confidence === level;
                let classes = '';
                if (disabled) {
                  classes = 'cursor-not-allowed border-son-borderSubtle/50 bg-son-surface/30 text-son-textMuted';
                } else if (isSelected) {
                  classes = CONFIDENCE_SELECTED_BOX[level];
                } else {
                  classes = 'border-son-border bg-son-card hover:border-son-borderStrong';
                }
                return (
                  <button
                    key={level}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={disabled}
                    onClick={() => setConfidence(level)}
                    className={`min-h-16 rounded-lg border p-3 text-left transition-colors ${classes}`}
                  >
                    <div className={`text-xs ${disabled ? '' : isSelected ? CONFIDENCE_SELECTED_TEXT[level] : 'text-son-textSecondary'}`}>
                      {config.label} ({pct}%)
                    </div>
                    <div className={`mt-0.5 text-lg font-bold tabular-nums ${disabled ? '' : isSelected ? CONFIDENCE_SELECTED_TEXT[level] : 'text-son-text'}`}>
                      {formatMoney(stake)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {errorBanner}

          <button
            type="button"
            disabled={!canLockIn}
            onClick={() => void lockIn()}
            className={`w-full rounded-lg px-6 py-3 text-base font-semibold transition-colors ${
              canLockIn
                ? 'bg-son-signalBlue text-son-textInverse hover:brightness-110'
                : 'cursor-not-allowed bg-son-surface text-son-textMuted'
            }`}
          >
            {busy ? 'Locking...' : 'Lock In'}
          </button>
        </div>
      </main>
    );
  }

  // ---- Reveal (mid-battle or final) ----
  const reveal = battle.reveal;
  const finished = battle.status === 'completed' || battle.status === 'expired';
  const summary = battle.summary;

  return (
    <main id="main-content" tabIndex={-1} className="page-shell signal-enter" aria-live="polite">
      <div className="mx-auto w-full max-w-3xl">
        {scoreBar}

        {finished && summary ? (
          <div
            className={`mb-4 rounded-2xl border p-5 text-center ${
              summary.outcome === 'you_won'
                ? 'border-son-green/50 bg-son-green/10'
                : summary.outcome === 'you_lost'
                  ? 'border-son-red/50 bg-son-red/10'
                  : 'border-son-border bg-son-card'
            }`}
          >
            <h1
              className={`text-3xl font-bold ${
                summary.outcome === 'you_won'
                  ? 'text-son-green'
                  : summary.outcome === 'you_lost'
                    ? 'text-son-red'
                    : 'text-son-text'
              }`}
            >
              {summary.outcome === 'you_won'
                ? 'You won the battle.'
                : summary.outcome === 'you_lost'
                  ? `${opponentName} takes it.`
                  : summary.outcome === 'draw'
                    ? "It's a draw."
                    : 'Battle expired.'}
            </h1>
            {summary.outcome === 'expired' ? (
              <p className="mt-2 text-sm text-son-textSecondary">
                Unfinished battles end 24 hours after creation with no winner.
              </p>
            ) : summary.you.isBankrupt || summary.opponent?.isBankrupt ? (
              <p className="mt-2 text-sm text-son-textSecondary">
                {summary.you.isBankrupt && summary.opponent?.isBankrupt
                  ? 'You both went bankrupt — settled by bankroll, then Signal Score.'
                  : summary.you.isBankrupt
                    ? 'Your bankroll hit the floor — bankruptcy ends the battle immediately.'
                    : `${opponentName} went bankrupt — the battle ends immediately.`}
              </p>
            ) : null}
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg bg-son-surface/70 px-3 py-2.5">
                <p className="text-xs text-son-textMuted">You</p>
                <p className="font-bold tabular-nums text-son-text">
                  {formatMoney(summary.you.finalBankroll)}
                </p>
                <p className="text-xs tabular-nums text-son-signalCyan">
                  {formatSignalScore(summary.you.signalScore)} Signal
                </p>
              </div>
              <div className="rounded-lg bg-son-surface/70 px-3 py-2.5">
                <p className="truncate text-xs text-son-textMuted">
                  {battle.opponent?.name ?? 'Opponent'}
                </p>
                <p className="font-bold tabular-nums text-son-text">
                  {summary.opponent ? formatMoney(summary.opponent.finalBankroll) : '—'}
                </p>
                <p className="text-xs tabular-nums text-son-signalCyan">
                  {summary.opponent ? `${formatSignalScore(summary.opponent.signalScore)} Signal` : ''}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {reveal ? (
          <div className="rounded-2xl border border-son-border bg-son-card p-5">
            <p className="text-xs text-son-textMuted">
              Round {reveal.roundIndex + 1} reveal
            </p>
            <h2 className="mt-1 text-2xl font-bold text-son-text">
              That was {reveal.companyName}.
            </h2>
            <div className="mt-2 space-y-1 text-sm text-son-textSecondary">
              <p>{reveal.ticker}</p>
              <p>{reveal.outcomeLabel}</p>
              <p>Actual return: {formatPercent(reveal.actualReturnPercent)}</p>
            </div>
            <div className="mt-3">
              <Sparkline
                prices={reveal.outcomeChart.map((point) => point.price)}
                height={96}
                variant="outcome"
              />
            </div>

            <div className="mt-4 space-y-2">
              <DecisionLine label="You" decision={reveal.you} />
              <DecisionLine label={battle.opponent?.name ?? 'Opponent'} decision={reveal.opponent} />
            </div>

            <div className="mt-4 border-t border-son-border pt-4">
              <p className="text-sm leading-relaxed text-son-textSecondary">{reveal.shortText}</p>
              {reveal.funFact ? (
                <p className="mt-2 text-xs leading-relaxed text-son-textMuted">
                  <span className="font-semibold text-son-textSecondary">Fun fact:</span>{' '}
                  {reveal.funFact}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {errorBanner}

        {!finished && battle.status === 'in_progress' && battle.roundPhase === 'reveal' ? (
          battle.you.readyRound > battle.currentRoundIndex ? (
            <p className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-son-border bg-son-card px-4 py-3 text-sm text-son-textMuted">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-son-signalCyan" />
              Waiting for {opponentName} to continue...
            </p>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void ready(battle.currentRoundIndex + 1)}
              className="mt-4 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? 'Continuing...' : 'Continue to next round'}
            </button>
          )
        ) : null}

        {finished && summary && summary.rounds.length > 0 ? (
          <div className="mt-4 rounded-2xl border border-son-border bg-son-card p-5">
            <h2 className="text-base font-semibold text-son-text">Round by round</h2>
            <div className="mt-3 space-y-1.5">
              {summary.rounds.map((round) => (
                <div key={round.roundIndex} className="rounded-lg bg-son-surface/50 px-3 py-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-son-text">
                      {round.roundIndex + 1}. {round.companyName}
                    </span>
                    <span
                      className={`tabular-nums ${
                        round.actualReturnPercent > 0
                          ? 'text-son-green'
                          : round.actualReturnPercent < 0
                            ? 'text-son-red'
                            : 'text-son-textSecondary'
                      }`}
                    >
                      {formatPercent(round.actualReturnPercent)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-son-textSecondary">
                    <span>
                      You: {callLabel(round.you.action, round.you.confidence)}{' '}
                      <span className="tabular-nums">
                        ({round.you.pnlAmount !== 0 ? formatSignedMoney(round.you.pnlAmount) : '$0'})
                      </span>
                    </span>
                    <span>
                      Them: {callLabel(round.opponent.action, round.opponent.confidence)}{' '}
                      <span className="tabular-nums">
                        ({round.opponent.pnlAmount !== 0
                          ? formatSignedMoney(round.opponent.pnlAmount)
                          : '$0'})
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {finished ? (
          <div className="mt-4 flex gap-3">
            <Link
              href="/play/battle"
              className="flex-1 rounded-lg bg-son-signalBlue px-4 py-3 text-center text-sm font-semibold text-son-textInverse transition-colors hover:brightness-110"
            >
              New battle
            </Link>
            <Link
              href="/"
              className="flex-1 rounded-lg border border-son-border bg-son-card px-4 py-3 text-center text-sm font-semibold text-son-textSecondary transition-colors hover:border-son-borderStrong"
            >
              Home
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function BattleRoomPage() {
  return <BattleRoom />;
}
