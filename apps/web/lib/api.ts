import type {
  CurrentRunPayload,
  LeaderboardPagePayload,
  PlayerStatsPayload,
  PublicIdentityPayload,
  RevealPayload,
  RunSummaryPayload,
} from '@signal-or-noise/database';
import type { CompletedRound } from '@signal-or-noise/game-engine';

/** Shared context every gameplay endpoint returns alongside its payload. */
export type ApiContext = {
  isAuthenticated: boolean;
  hasGuestSession: boolean;
};

export type SubmitDecisionResult = {
  run: {
    id: string;
    status: 'in_progress' | 'completed' | 'bankrupt';
    currentBankroll: number;
    signalScore: number;
    completedRounds: number;
    totalRounds: number;
    currentStreak: number;
    bestStreak: number;
  };
  round: CompletedRound;
  reveal: RevealPayload;
};

export type LeaderboardApiPayload = LeaderboardPagePayload & {
  viewer: { isAuthenticated: boolean };
};

export type LeaderboardApiQuery =
  | { board: 'daily'; date: string; page?: number }
  | { board: 'classic'; difficulty: 'easy' | 'medium' | 'hard'; page?: number }
  | { board: 'signal'; page?: number };

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
  }
}

async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: { 'content-type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as { error?: { code?: string; message?: string } } | null)?.error;
    throw new ApiRequestError(
      response.status,
      error?.code ?? 'INTERNAL',
      error?.message ?? 'Something went wrong',
    );
  }
  return body as T;
}

export const api = {
  currentRun: () =>
    apiFetch<{ run: CurrentRunPayload | null; context: ApiContext }>('/api/runs/current'),
  createClassicRun: (difficulty: 'easy' | 'medium' | 'hard') =>
    apiFetch<{ run: CurrentRunPayload; context: ApiContext }>('/api/runs/classic', {
      method: 'POST',
      body: JSON.stringify({ difficulty }),
    }),
  submitDecision: (
    runId: string,
    payload: {
      roundIndex: number;
      action: 'long' | 'short' | 'pass';
      confidence?: 'low' | 'medium' | 'high' | 'all_in';
      companyGuess?: string;
    },
  ) =>
    apiFetch<SubmitDecisionResult>(`/api/runs/${encodeURIComponent(runId)}/decisions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  runSummary: (runId: string) =>
    apiFetch<{ summary: RunSummaryPayload; context: ApiContext }>(
      `/api/runs/${encodeURIComponent(runId)}/summary`,
    ),
  claimRun: (runId: string) =>
    apiFetch<{ summary: RunSummaryPayload; context: ApiContext }>(
      `/api/runs/${encodeURIComponent(runId)}/claim`,
      { method: 'POST' },
    ),
  stats: () =>
    apiFetch<{ stats: PlayerStatsPayload | null; context: ApiContext }>('/api/stats'),
  createDailyAttempt: () =>
    apiFetch<{ run: CurrentRunPayload; context: ApiContext }>('/api/daily/attempts', {
      method: 'POST',
    }),
  leaderboard: (query: LeaderboardApiQuery) => {
    const params = new URLSearchParams();
    params.set('board', query.board);
    if (query.board === 'daily') params.set('date', query.date);
    if (query.board === 'classic') params.set('difficulty', query.difficulty);
    if (query.page) params.set('page', String(query.page));
    return apiFetch<LeaderboardApiPayload>(`/api/leaderboards?${params.toString()}`);
  },
  publicIdentity: () =>
    apiFetch<{ identity: PublicIdentityPayload }>('/api/profile/public-identity'),
  updatePublicDisplayName: (displayName: string | null) =>
    apiFetch<{ identity: PublicIdentityPayload }>('/api/profile/public-identity', {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    }),
};
