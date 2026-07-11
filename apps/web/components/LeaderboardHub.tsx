'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { LeaderboardRowPayload } from '@signal-or-noise/database';
import { api } from '@/lib/api';
import type { LeaderboardApiPayload, LeaderboardApiQuery } from '@/lib/api';
import { formatMoney, formatSignalScore } from '@/lib/format';

type Board = 'daily' | 'classic' | 'signal';
type Difficulty = 'easy' | 'medium' | 'hard';
type LoadState =
  | { kind: 'loading' }
  | { kind: 'ready'; data: LeaderboardApiPayload }
  | { kind: 'error' };

type Props = {
  initialBoard: Board;
  initialDifficulty: Difficulty;
  initialDate: string;
  initialPage: number;
};

function scoreLabel(row: LeaderboardRowPayload, board: Board): string {
  return board === 'signal'
    ? formatSignalScore(row.signalScore)
    : formatMoney(row.bankroll ?? 0);
}

function detailLabel(row: LeaderboardRowPayload, board: Board): string {
  const parts = board === 'signal'
    ? [`${row.correctCalls} correct`, `${row.passes} passes`]
    : [
      `${formatSignalScore(row.signalScore)} Signal`,
      `${row.correctCalls} correct`,
      `${row.passes} passes`,
      row.completionTimeMs === null ? null : `${Math.max(1, Math.round(row.completionTimeMs / 1000))}s`,
    ];
  return parts.filter((part): part is string => part !== null).join(' · ');
}

function LeaderboardRow({ row, board }: { row: LeaderboardRowPayload; board: Board }) {
  return (
    <li
      className={`grid grid-cols-[2.25rem_minmax(0,1fr)_auto] items-center gap-2 rounded-xl border px-3 py-3 ${
        row.isCurrentUser
          ? 'border-son-signalCyan/70 bg-son-signalCyan/10'
          : 'border-son-borderSubtle bg-son-card'
      }`}
    >
      <span className="text-center text-sm font-bold tabular-nums text-son-textSecondary">
        {row.rank}
      </span>
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold text-son-text">{row.publicName}</span>
          {row.isCurrentUser ? (
            <span className="shrink-0 rounded-full bg-son-signalCyan/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-son-signalCyan">
              You
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-[11px] text-son-textMuted">
          {detailLabel(row, board)}
        </p>
      </div>
      <span className={`text-right text-sm font-bold tabular-nums ${
        board === 'signal' ? 'text-son-signalCyan' : 'text-son-text'
      }`}>
        {scoreLabel(row, board)}
      </span>
    </li>
  );
}

export default function LeaderboardHub({
  initialBoard,
  initialDifficulty,
  initialDate,
  initialPage,
}: Props) {
  const router = useRouter();
  const [board, setBoard] = useState<Board>(initialBoard);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [date, setDate] = useState(initialDate);
  const [page, setPage] = useState(initialPage);
  const [retryKey, setRetryKey] = useState(0);
  const [state, setState] = useState<LoadState>({ kind: 'loading' });

  const query = useMemo<LeaderboardApiQuery>(() => {
    if (board === 'daily') return { board, date, page };
    if (board === 'classic') return { board, difficulty, page };
    return { board, page };
  }, [board, date, difficulty, page]);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set('board', board);
    if (board === 'daily') params.set('date', date);
    if (board === 'classic') params.set('difficulty', difficulty);
    if (page > 1) params.set('page', String(page));
    router.replace(`/leaderboards?${params.toString()}`, { scroll: false });

    let cancelled = false;
    setState({ kind: 'loading' });
    void api.leaderboard(query)
      .then((data) => {
        if (cancelled) return;
        const lastPage = Math.max(1, data.pagination.totalPages);
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setState({ kind: 'ready', data });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [board, date, difficulty, page, query, retryKey, router]);

  const chooseBoard = (next: Board) => {
    setBoard(next);
    setPage(1);
  };

  const emptyState = board === 'daily'
    ? {
      title: 'No Daily scores yet',
      description: 'Be the first to finish this challenge and put a score on the board.',
      href: '/play/daily',
      action: 'Play Daily Challenge',
    }
    : board === 'classic'
      ? {
        title: `No ${difficulty} Classic scores yet`,
        description: 'Finish an official run to claim the first spot on this board.',
        href: '/play/classic',
        action: 'Play Classic',
      }
      : {
        title: 'No Signal scores yet',
        description: 'Make a few bold calls in Classic and start the all-time Signal ranking.',
        href: '/play/classic',
        action: 'Play Classic',
      };

  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-son-signalCyan">
          Find the signal
        </p>
        <h1 className="mt-1 text-2xl font-bold text-son-text">Leaderboards</h1>
        <p className="mt-1 text-sm leading-relaxed text-son-textSecondary">
          Official finished runs only. Classic difficulties rank separately.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-xl border border-son-border bg-son-surface p-1" role="tablist">
        {([
          ['daily', 'Daily'],
          ['classic', 'Classic'],
          ['signal', 'Signal'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={board === value}
            onClick={() => chooseBoard(value)}
            className={`rounded-lg px-2 py-2 text-xs font-semibold transition-colors ${
              board === value
                ? 'bg-son-cardElevated text-son-text'
                : 'text-son-textMuted hover:text-son-textSecondary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="my-4 min-h-10">
        {board === 'daily' ? (
          <label className="flex items-center justify-between gap-3 text-xs font-semibold text-son-textSecondary">
            Challenge date
            <input
              type="date"
              value={date}
              onChange={(event) => {
                setDate(event.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-son-border bg-son-card px-3 py-2 text-sm text-son-text [color-scheme:dark]"
            />
          </label>
        ) : board === 'classic' ? (
          <div className="grid grid-cols-3 gap-1 rounded-lg bg-son-surface p-1" aria-label="Classic difficulty">
            {(['easy', 'medium', 'hard'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={difficulty === value}
                onClick={() => {
                  setDifficulty(value);
                  setPage(1);
                }}
                className={`rounded-md px-2 py-2 text-xs font-semibold capitalize ${
                  difficulty === value
                    ? 'bg-son-signalBlue text-son-textInverse'
                    : 'text-son-textMuted hover:text-son-textSecondary'
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-son-borderSubtle bg-son-surface px-3 py-2 text-xs text-son-textSecondary">
            Cumulative Signal Score from every official finished run.
          </p>
        )}
      </div>

      {state.kind === 'loading' ? (
        <div className="space-y-2" aria-live="polite" aria-label="Loading leaderboard">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="h-[62px] animate-pulse rounded-xl border border-son-borderSubtle bg-son-card/70" />
          ))}
        </div>
      ) : state.kind === 'error' ? (
        <div className="rounded-xl border border-son-red/40 bg-son-red/10 p-4 text-sm text-son-red">
          <p>Could not load this leaderboard.</p>
          <button
            type="button"
            onClick={() => setRetryKey((value) => value + 1)}
            className="mt-3 rounded-lg border border-son-red/50 px-3 py-2 text-xs font-bold"
          >
            Retry
          </button>
        </div>
      ) : state.data.rows.length === 0 ? (
        <>
          <div className="rounded-2xl border border-son-border bg-son-card p-5 text-center">
            <h2 className="text-base font-semibold text-son-text">{emptyState.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-son-textSecondary">
              {state.data.pagination.totalEntries === 0
                ? emptyState.description
                : 'Use Previous to return to a populated leaderboard page.'}
            </p>
            {state.data.pagination.totalEntries === 0 ? (
              <Link href={emptyState.href} className="mt-4 inline-block rounded-lg bg-son-signalBlue px-5 py-2.5 text-sm font-bold text-son-textInverse">
                {emptyState.action}
              </Link>
            ) : null}
          </div>
          {state.data.currentUserRow ? (
            <div className="mt-5 border-t border-son-borderSubtle pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-son-signalCyan">Your rank</p>
              <LeaderboardRow row={state.data.currentUserRow} board={board} />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between px-3 text-[10px] font-bold uppercase tracking-wider text-son-textMuted">
            <span>Rank · Player</span>
            <span>{board === 'signal' ? 'Signal Score' : 'Bankroll'}</span>
          </div>
          <ol className="space-y-2">
            {state.data.rows.map((row, index) => (
              <LeaderboardRow key={`${row.rank}-${row.publicName}-${index}`} row={row} board={board} />
            ))}
          </ol>

          {state.data.currentUserRow
            && !state.data.rows.some((row) => row.isCurrentUser) ? (
              <div className="mt-5 border-t border-son-borderSubtle pt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-son-signalCyan">Your rank</p>
                <LeaderboardRow row={state.data.currentUserRow} board={board} />
              </div>
            ) : null}
        </>
      )}

      {state.kind === 'ready' && state.data.viewer.isAuthenticated && !state.data.currentUserRow ? (
        <p className="mt-4 rounded-lg border border-son-borderSubtle bg-son-surface px-3 py-2 text-xs leading-relaxed text-son-textSecondary">
          You are not ranked on this board yet. Finish an official qualifying run to appear.
        </p>
      ) : null}

      {state.kind === 'ready' && state.data.pagination.totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="rounded-lg border border-son-border px-3 py-2 text-xs font-semibold text-son-textSecondary disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs tabular-nums text-son-textMuted">
            Page {page} of {state.data.pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= state.data.pagination.totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="rounded-lg border border-son-border px-3 py-2 text-xs font-semibold text-son-textSecondary disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}

      {state.kind === 'ready' && !state.data.viewer.isAuthenticated ? (
        <p className="mt-6 text-center text-xs text-son-textMuted">
          Leaderboards are public. Sign in to highlight your rank.
        </p>
      ) : null}
    </div>
  );
}
