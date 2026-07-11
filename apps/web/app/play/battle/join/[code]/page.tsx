'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import type { BattleInvitePreviewPayload } from '@signal-or-noise/database';
import { api, ApiRequestError } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { capture } from '@/lib/analytics';

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; invite: BattleInvitePreviewPayload }
  | { kind: 'error'; message: string };

export default function JoinBattlePage() {
  const router = useRouter();
  const params = useParams<{ code: string }>();
  const code = typeof params.code === 'string' ? params.code : '';
  const { isLoaded, isSignedIn } = useUser();
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const result = await api.battleInvite(code);
      setState({ kind: 'ready', invite: result.invite });
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) {
        // Signed-out visitors see the sign-in card below instead.
        setState({ kind: 'error', message: '' });
        return;
      }
      setState({
        kind: 'error',
        message:
          error instanceof ApiRequestError && error.status === 404
            ? 'This invite link is not valid. Ask your friend for a fresh one.'
            : error instanceof Error
              ? error.message
              : 'Could not load this invite.',
      });
    }
  }, [code]);

  useEffect(() => {
    if (isLoaded && isSignedIn && code) void load();
  }, [isLoaded, isSignedIn, code, load]);

  const join = async () => {
    if (joining) return;
    setJoining(true);
    setJoinError(null);
    try {
      const joined = await api.joinBattle(code);
      capture({ name: 'battle_joined', properties: {} });
      router.push(`/play/battle/${encodeURIComponent(joined.battle.id)}`);
    } catch (error) {
      setJoinError(
        error instanceof ApiRequestError && error.status !== 500
          ? error.message
          : 'Could not join the battle. Try again.',
      );
      setJoining(false);
    }
  };

  const signInHref = `/sign-in?redirect_url=${encodeURIComponent(`/play/battle/join/${code}`)}`;

  return (
    <main id="main-content" tabIndex={-1} className="page-shell">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-son-signalCyan">
          You&apos;ve been challenged
        </p>
        <h1 className="mt-1 text-3xl font-bold text-son-text">Friend Battle invite</h1>

        {!isLoaded ? (
          <div className="mt-6 animate-pulse rounded-2xl border border-son-border bg-son-card p-5">
            <div className="h-5 w-40 rounded bg-son-surface" />
            <div className="mt-3 h-4 w-full rounded bg-son-surface" />
          </div>
        ) : !isSignedIn ? (
          <div className="mt-6 rounded-2xl border border-son-border bg-son-card p-5">
            <p className="text-sm leading-relaxed text-son-textSecondary">
              Friend Battles are head-to-head between two signed-in players. Sign in to see
              the challenge and join.
            </p>
            <Link
              href={signInHref}
              className="mt-4 block w-full rounded-lg bg-son-signalBlue px-6 py-3 text-center text-base font-semibold text-son-textInverse transition-colors hover:brightness-110"
            >
              Sign in to accept
            </Link>
          </div>
        ) : state.kind === 'loading' ? (
          <div className="mt-6 animate-pulse rounded-2xl border border-son-border bg-son-card p-5">
            <div className="h-5 w-40 rounded bg-son-surface" />
            <div className="mt-3 h-4 w-full rounded bg-son-surface" />
          </div>
        ) : state.kind === 'error' ? (
          <div className="mt-6 rounded-2xl border border-son-red/40 bg-son-red/10 p-5">
            <p className="text-sm leading-relaxed text-son-textSecondary">
              {state.message || 'Could not load this invite.'}
            </p>
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
            <p className="text-sm text-son-textSecondary">
              <span className="font-semibold text-son-text">{state.invite.creatorName}</span>{' '}
              wants to battle.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-lg bg-son-surface px-2 py-3">
                <p className="font-bold capitalize text-son-text">{state.invite.difficulty}</p>
                <p className="mt-1 text-son-textMuted">{state.invite.totalRounds} rounds</p>
              </div>
              <div className="rounded-lg bg-son-surface px-2 py-3">
                <p className="font-bold tabular-nums text-son-text">
                  {formatMoney(state.invite.startingBankroll)}
                </p>
                <p className="mt-1 text-son-textMuted">Bankroll</p>
              </div>
              <div className="rounded-lg bg-son-surface px-2 py-3">
                <p className="font-bold tabular-nums text-son-text">
                  {state.invite.timerSeconds ? `${state.invite.timerSeconds}s` : 'Off'}
                </p>
                <p className="mt-1 text-son-textMuted">Round timer</p>
              </div>
            </div>

            {joinError ? (
              <p role="alert" className="mt-4 rounded-lg border border-son-red/40 bg-son-red/10 px-3 py-2 text-sm text-son-red">
                {joinError}
              </p>
            ) : null}

            {state.invite.joinable ? (
              <button
                type="button"
                disabled={joining}
                onClick={() => void join()}
                className="mt-5 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {joining ? 'Joining...' : 'Accept the challenge'}
              </button>
            ) : (
              <div className="mt-5 rounded-lg border border-son-border bg-son-surface px-4 py-3 text-sm text-son-textSecondary">
                {state.invite.status === 'expired'
                  ? 'This invite expired — battles last 24 hours. Ask for a new one.'
                  : state.invite.status === 'awaiting_opponent'
                    ? 'This is your own battle. Share the invite link with a friend instead.'
                    : 'This battle already has two players.'}
              </div>
            )}

            <Link
              href="/play/battle"
              className="mt-3 block rounded-lg border border-son-border bg-son-card px-4 py-3 text-center text-sm font-semibold text-son-textSecondary transition-colors hover:border-son-borderStrong"
            >
              Go to my battles
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
