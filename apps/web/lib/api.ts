import type {
  CurrentRunPayload,
  PlayerStatsPayload,
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
};
