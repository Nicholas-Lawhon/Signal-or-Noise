'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import type { BattleListEntryPayload, BattleTimer } from '@signal-or-noise/database';
import { api, ApiRequestError } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import { capture } from '@/lib/analytics';

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', rounds: 10, bankroll: 12500 },
  { value: 'medium', label: 'Medium', rounds: 15, bankroll: 10000 },
  { value: 'hard', label: 'Hard', rounds: 20, bankroll: 7500 },
] as const;

const TIMER_OPTIONS: Array<{ value: BattleTimer; label: string }> = [
  { value: null, label: 'Off' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
  { value: 120, label: '120s' },
];

const STATUS_LABEL: Record<BattleListEntryPayload['status'], string> = {
  awaiting_opponent: 'Waiting for a friend',
  awaiting_ready: 'Ready check',
  in_progress: 'In progress',
  completed: 'Finished',
  expired: 'Expired',
};

function outcomeChip(entry: BattleListEntryPayload): { text: string; classes: string } {
  if (entry.status === 'expired') {
    return { text: 'Expired', classes: 'border-son-borderSubtle text-son-textMuted' };
  }
  if (entry.outcome === 'you_won') {
    return { text: 'You won', classes: 'border-son-green/50 bg-son-green/10 text-son-green' };
  }
  if (entry.outcome === 'you_lost') {
    return { text: 'You lost', classes: 'border-son-red/50 bg-son-red/10 text-son-red' };
  }
  if (entry.outcome === 'draw') {
    return { text: 'Draw', classes: 'border-son-amber/50 bg-son-amber/10 text-son-amber' };
  }
  return {
    text: STATUS_LABEL[entry.status],
    classes: 'border-son-signalCyan/40 bg-son-signalCyan/5 text-son-signalCyan',
  };
}

export default function BattleHomePage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [battles, setBattles] = useState<BattleListEntryPayload[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [timerSeconds, setTimerSeconds] = useState<BattleTimer>(60);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await api.listBattles();
      setBattles(result.battles);
      setLoadError(null);
    } catch (error) {
      if (error instanceof ApiRequestError && error.status === 401) return;
      setLoadError(error instanceof Error ? error.message : 'Could not load your battles.');
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn) void load();
  }, [isLoaded, isSignedIn, load]);

  const createBattle = async () => {
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await api.createBattle(difficulty, timerSeconds);
      capture({ name: 'battle_invite_created', properties: {} });
      router.push(`/play/battle/${encodeURIComponent(created.battle.id)}`);
    } catch (error) {
      setCreateError(
        error instanceof ApiRequestError && error.status !== 500
          ? error.message
          : 'Could not create the battle. Try again.',
      );
      setCreating(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-son-signalCyan">
          Same cards. Same clock. One winner.
        </p>
        <h1 className="mt-1 text-3xl font-bold text-son-text">Friend Battle</h1>
        <p className="mt-2 text-sm leading-relaxed text-son-textSecondary">
          Challenge one friend to the same scenarios in the same order, round by round.
          Highest final bankroll takes it; Signal Score breaks ties.
        </p>

        {!isLoaded ? (
          <div className="mt-6 animate-pulse rounded-2xl border border-son-border bg-son-card p-5">
            <div className="h-5 w-40 rounded bg-son-surface" />
            <div className="mt-3 h-4 w-full rounded bg-son-surface" />
          </div>
        ) : !isSignedIn ? (
          <div className="mt-6 rounded-2xl border border-son-border bg-son-card p-5">
            <p className="text-sm leading-relaxed text-son-textSecondary">
              Friend Battles are head-to-head between two signed-in players, so an account is
              required on both sides.
            </p>
            <Link
              href="/sign-in?redirect_url=%2Fplay%2Fbattle"
              className="mt-4 block w-full rounded-lg bg-son-signalBlue px-6 py-3 text-center text-base font-semibold text-son-textInverse transition-colors hover:brightness-110"
            >
              Sign in to battle
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 rounded-2xl border border-son-border bg-son-card p-5">
              <h2 className="text-base font-semibold text-son-text">Start a new battle</h2>

              <p className="mb-2 mt-4 text-sm font-semibold text-son-text">Difficulty</p>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTY_OPTIONS.map((option) => {
                  const isSelected = difficulty === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setDifficulty(option.value)}
                      className={`rounded-lg border p-3 text-left transition-colors ${
                        isSelected
                          ? 'border-son-signalCyan bg-son-signalCyan/10'
                          : 'border-son-border bg-son-surface hover:border-son-borderStrong'
                      }`}
                    >
                      <p className={`text-sm font-semibold ${isSelected ? 'text-son-signalCyan' : 'text-son-text'}`}>
                        {option.label}
                      </p>
                      <p className="mt-0.5 text-xs text-son-textMuted">{option.rounds} rounds</p>
                      <p className="text-xs tabular-nums text-son-textMuted">
                        {formatMoney(option.bankroll)}
                      </p>
                    </button>
                  );
                })}
              </div>

              <p className="mb-2 mt-4 text-sm font-semibold text-son-text">Round timer</p>
              <div className="grid grid-cols-4 gap-2">
                {TIMER_OPTIONS.map((option) => {
                  const isSelected = timerSeconds === option.value;
                  return (
                    <button
                      key={option.label}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setTimerSeconds(option.value)}
                      className={`min-h-11 rounded-lg border px-2 py-2.5 text-sm font-semibold transition-colors ${
                        isSelected
                          ? 'border-son-signalCyan bg-son-signalCyan/10 text-son-signalCyan'
                          : 'border-son-border bg-son-surface text-son-textSecondary hover:border-son-borderStrong'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-son-textMuted">
                Miss the clock and that round becomes a Pass. Server time is final.
              </p>

              {createError ? (
                <p role="alert" className="mt-4 rounded-lg border border-son-red/40 bg-son-red/10 px-3 py-2 text-sm text-son-red">
                  {createError}
                </p>
              ) : null}

              <button
                type="button"
                disabled={creating}
                onClick={() => void createBattle()}
                className="mt-5 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? 'Creating...' : 'Create battle & get invite link'}
              </button>
              <p className="mt-2 text-center text-xs text-son-textMuted">
                Battles expire 24 hours after creation if unfinished.
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-base font-semibold text-son-text">Your battles</h2>
              {loadError ? (
                <div role="alert" className="mt-3 rounded-lg border border-son-red/40 bg-son-red/10 px-3 py-2 text-sm text-son-red">
                  <p>{loadError}</p>
                  <button
                    type="button"
                    onClick={() => void load()}
                    className="mt-2 rounded-md border border-son-red/50 px-3 py-1.5 text-xs font-semibold text-son-text"
                  >
                    Retry
                  </button>
                </div>
              ) : battles === null ? (
                <div className="mt-3 animate-pulse rounded-lg border border-son-border bg-son-card p-4">
                  <div className="h-4 w-2/3 rounded bg-son-surface" />
                </div>
              ) : battles.length === 0 ? (
                <p className="mt-3 rounded-lg border border-son-border bg-son-card px-4 py-3 text-sm text-son-textMuted">
                  No battles yet. Create one and send the invite to a friend.
                </p>
              ) : (
                <div className="mt-3 space-y-2">
                  {battles.map((entry) => {
                    const chip = outcomeChip(entry);
                    return (
                      <Link
                        key={entry.id}
                        href={`/play/battle/${encodeURIComponent(entry.id)}`}
                        className="block rounded-lg border border-son-border bg-son-card px-4 py-3 transition-colors hover:border-son-borderStrong"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-son-text">
                              {entry.opponentName ? `vs ${entry.opponentName}` : 'Awaiting opponent'}
                            </p>
                            <p className="mt-0.5 text-xs text-son-textMuted">
                              {DIFFICULTY_OPTIONS.find((o) => o.value === entry.difficulty)?.label}
                              {' · '}
                              {entry.totalRounds} rounds
                              {' · '}
                              {entry.timerSeconds ? `${entry.timerSeconds}s timer` : 'no timer'}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${chip.classes}`}
                          >
                            {chip.text}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
