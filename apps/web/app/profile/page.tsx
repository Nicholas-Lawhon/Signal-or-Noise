'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import type { PlayerStatsPayload } from '@signal-or-noise/shared-types';
import { api } from '@/lib/api';
import { formatMoney, formatSignalScore } from '@/lib/format';
import PublicIdentityCard from '@/components/PublicIdentityCard';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; stats: PlayerStatsPayload | null }
  | { kind: 'error' };

/** Saved stats for the signed-in player; guests get a sign-in prompt. */
export default function ProfilePage() {
  const { isLoaded, isSignedIn } = useUser();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [draftHistory, setDraftHistory] = useState<Array<{ id: string; format: 'classic' | 'quick' | 'era'; finalValue: number; gapFromOptimal: number; completedAt: string }>>([]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    void api
      .stats()
      .then((result) => {
        if (!cancelled) setState({ kind: 'ready', stats: result.stats });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    void api.draftHistory().then((result) => {
      if (!cancelled) setDraftHistory(result.history);
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  return (
    <main id="main-content" tabIndex={-1} className="page-shell flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <h1 className="mb-1 text-2xl font-bold text-son-text">My Stats</h1>
        <p className="mb-8 text-sm text-son-textSecondary">
          Saved results from your account&apos;s runs.
        </p>

        {isLoaded && isSignedIn ? <PublicIdentityCard /> : null}

        {!isLoaded ? (
          <p className="text-sm text-son-textMuted">Loading...</p>
        ) : !isSignedIn ? (
          <div className="rounded-2xl border border-son-border bg-son-card p-5">
            <h2 className="text-base font-semibold text-son-text">Sign in to see saved stats</h2>
            <p className="mt-1 text-sm leading-relaxed text-son-textSecondary">
              Guest runs stay on this device and are unofficial. Sign in to keep
              your scores and stats with your account.
            </p>
            <Link
              href="/sign-in?redirect_url=%2Fprofile"
              className="mt-4 block w-full rounded-lg bg-son-signalBlue px-6 py-3 text-center text-base font-semibold text-son-textInverse transition-colors hover:brightness-110"
            >
              Sign in
            </Link>
          </div>
        ) : state.kind === 'loading' ? (
          <p className="text-sm text-son-textMuted">Loading your stats...</p>
        ) : state.kind === 'error' ? (
          <p className="rounded-lg border border-son-red/40 bg-son-red/10 px-4 py-3 text-sm text-son-red">
            Could not load stats. Refresh to try again.
          </p>
        ) : state.stats === null ? (
          <div className="rounded-2xl border border-son-border bg-son-card p-5">
            <p className="text-sm leading-relaxed text-son-textSecondary">
              No saved runs yet. Finish a Classic Run while signed in &mdash; or
              save a completed guest run &mdash; and your stats appear here.
            </p>
            <a
              href="/play/classic"
              className="mt-4 block rounded-lg bg-son-signalBlue px-6 py-3 text-center text-base font-semibold text-son-textInverse transition-colors hover:brightness-110"
            >
              Play Classic Run
            </a>
          </div>
        ) : (
          <div className="rounded-2xl border border-son-border bg-son-card p-6">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Completed Runs</span>
                <span className="font-semibold text-son-text">
                  {state.stats.completedRuns}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Best Run Bankroll</span>
                <span className="font-semibold text-son-text tabular-nums">
                  {state.stats.bestRunBankroll !== null
                    ? formatMoney(state.stats.bestRunBankroll)
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Total Signal Score</span>
                <span className="font-semibold text-son-signalCyan tabular-nums">
                  {formatSignalScore(state.stats.totalSignalScore)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Rounds Played</span>
                <span className="font-semibold text-son-text">{state.stats.totalRounds}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Correct Calls</span>
                <span className="font-semibold text-son-text">{state.stats.correctCalls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Wrong Calls</span>
                <span className="font-semibold text-son-text">{state.stats.wrongCalls}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Passes</span>
                <span className="font-semibold text-son-text">{state.stats.passes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-son-textSecondary">Best Streak</span>
                <span className="font-semibold text-son-text">{state.stats.bestStreak}</span>
              </div>
            </div>
          </div>
        )}
        {isLoaded && isSignedIn && draftHistory.length > 0 ? (
          <section className="mt-6 rounded-2xl border border-son-border bg-son-card p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold text-son-text">Draft history</h2><Link href="/leaderboards?board=draft" className="text-xs font-semibold text-son-signalCyan">View ranks</Link></div>
            <p className="mt-1 text-xs text-son-textMuted">Completed solo Drafts only. Battles never appear here.</p>
            <ul className="mt-4 space-y-2">{draftHistory.map((draft) => <li key={draft.id} className="flex items-center justify-between gap-3 rounded-lg bg-son-surface px-3 py-2 text-sm"><div><p className="font-semibold capitalize text-son-text">{draft.format} Draft</p><p className="text-xs text-son-textMuted">{new Date(draft.completedAt).toLocaleDateString()} · {formatMoney(draft.gapFromOptimal)} gap</p></div><span className="font-bold tabular-nums text-son-text">{formatMoney(draft.finalValue)}</span></li>)}</ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
