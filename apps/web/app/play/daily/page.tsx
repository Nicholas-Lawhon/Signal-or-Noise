'use client';

import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DailyChallengePayload } from '@signal-or-noise/database';
import { api, ApiRequestError } from '@/lib/api';
import { formatMoney } from '@/lib/format';

type DailyStatus = {
  challenge: DailyChallengePayload;
  hasRun: boolean;
  completedAttempts: number;
};

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; status: DailyStatus }
  | { kind: 'unavailable'; message: string }
  | { kind: 'error'; message: string };

function utcLabel(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'full',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`));
}

export default function DailyChallengePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    setStartError(null);
    try {
      const result = await api.dailyStatus();
      setState({
        kind: 'ready',
        status: {
          challenge: result.challenge,
          hasRun: result.run !== null,
          completedAttempts: result.completedAttempts,
        },
      });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 404) {
        setState({ kind: 'unavailable', message: error.message });
        return;
      }
      setState({
        kind: 'error',
        message: error instanceof Error ? error.message : 'Could not load today\'s Daily Challenge.',
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const start = async () => {
    if (starting) return;
    setStarting(true);
    setStartError(null);
    try {
      await api.createDailyAttempt();
      router.push('/play/daily/run');
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        setStartError('Your session ended. Sign in again, then start your Daily Challenge.');
      } else {
        setStartError(
          error instanceof ApiRequestError && error.status !== 500
            ? error.message
            : 'Could not start the Daily Challenge. Try again.',
        );
      }
    } finally {
      setStarting(false);
    }
  };

  const details = state.kind === 'ready' ? state.status : null;

  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-son-signalCyan">
          Same card. Same order.
        </p>
        <h1 className="mt-1 text-3xl font-bold text-son-text">Daily Challenge</h1>
        <p className="mt-2 text-sm leading-relaxed text-son-textSecondary">
          10 mixed-difficulty rounds. Replay freely; your best completed attempt is the one
          that counts today.
        </p>

        {state.kind === 'loading' || !isLoaded ? (
          <div className="mt-6 animate-pulse rounded-2xl border border-son-border bg-son-card p-5">
            <div className="h-5 w-40 rounded bg-son-surface" />
            <div className="mt-3 h-4 w-full rounded bg-son-surface" />
            <div className="mt-2 h-4 w-3/4 rounded bg-son-surface" />
          </div>
        ) : state.kind === 'unavailable' ? (
          <div className="mt-6 rounded-2xl border border-son-border bg-son-card p-5">
            <h2 className="text-base font-semibold text-son-text">Today&apos;s challenge is not ready</h2>
            <p className="mt-1 text-sm leading-relaxed text-son-textSecondary">{state.message}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 w-full rounded-lg border border-son-border bg-son-surface px-4 py-3 text-sm font-semibold text-son-textSecondary"
            >
              Check again
            </button>
          </div>
        ) : state.kind === 'error' ? (
          <div className="mt-6 rounded-2xl border border-son-red/40 bg-son-red/10 p-5">
            <h2 className="text-base font-semibold text-son-red">Could not load the Daily</h2>
            <p className="mt-1 text-sm leading-relaxed text-son-textSecondary">{state.message}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 w-full rounded-lg border border-son-red/50 px-4 py-3 text-sm font-semibold text-son-text"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-son-border bg-son-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-son-textMuted">UTC challenge date</p>
            <h2 className="mt-1 text-xl font-bold text-son-text">{utcLabel(details?.challenge.date ?? '')}</h2>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-son-surface px-2 py-3">
                <p className="font-bold tabular-nums text-son-text">{details?.challenge.totalRounds}</p>
                <p className="mt-1 text-son-textMuted">Rounds</p>
              </div>
              <div className="rounded-lg bg-son-surface px-2 py-3">
                <p className="font-bold text-son-text">Mixed</p>
                <p className="mt-1 text-son-textMuted">Difficulty</p>
              </div>
              <div className="rounded-lg bg-son-surface px-2 py-3">
                <p className="font-bold tabular-nums text-son-text">
                  {formatMoney(details?.challenge.startingBankroll ?? 0)}
                </p>
                <p className="mt-1 text-son-textMuted">Bankroll</p>
              </div>
            </div>

            {!isSignedIn ? (
              <>
                <p className="mt-5 text-sm leading-relaxed text-son-textSecondary">
                  Daily Challenge scores are official, so an account is required. Classic Run
                  stays open to everyone.
                </p>
                <Link
                  href="/sign-in?redirect_url=%2Fplay%2Fdaily"
                  className="mt-4 block w-full rounded-lg bg-son-signalBlue px-6 py-3 text-center text-base font-semibold text-son-textInverse transition-colors hover:brightness-110"
                >
                  Sign in to play the Daily
                </Link>
                <Link
                  href="/play/classic"
                  className="mt-3 block rounded-lg border border-son-border bg-son-card px-4 py-3 text-center text-sm font-semibold text-son-textSecondary"
                >
                  Play Classic as a guest instead
                </Link>
              </>
            ) : details?.hasRun ? (
              <>
                <p className="mt-5 text-sm leading-relaxed text-son-textSecondary">
                  Your latest attempt is waiting. Pick up exactly where you left off.
                </p>
                <Link
                  href="/play/daily/run"
                  className="mt-4 block w-full rounded-lg bg-son-signalBlue px-6 py-3 text-center text-base font-semibold text-son-textInverse"
                >
                  Resume Daily Challenge
                </Link>
              </>
            ) : (
              <>
                <p className="mt-5 text-sm leading-relaxed text-son-textSecondary">
                  {details?.completedAttempts
                    ? 'Start a distinct replay. Your best finished result stays on today\'s board.'
                    : 'Make the call. Every player gets this exact ordered challenge.'}
                </p>
                {startError ? (
                  <p className="mt-3 rounded-lg border border-son-red/40 bg-son-red/10 px-3 py-2 text-sm text-son-red">
                    {startError}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={starting}
                  onClick={() => void start()}
                  className="mt-4 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {starting
                    ? 'Starting...'
                    : details?.completedAttempts
                      ? 'Replay today\'s challenge'
                      : 'Start Daily Challenge'}
                </button>
              </>
            )}
          </div>
        )}

        {details ? (
          <Link
            href={`/leaderboards?board=daily&date=${encodeURIComponent(details.challenge.date)}`}
            className="mt-4 block rounded-lg border border-son-border bg-son-card px-4 py-3 text-center text-sm font-semibold text-son-textSecondary"
          >
            View today&apos;s leaderboard
          </Link>
        ) : null}
      </div>
    </main>
  );
}
