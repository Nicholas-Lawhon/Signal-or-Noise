import type {
  BattleInvitePreviewPayload,
  BattleListEntryPayload,
  BattleStatePayload,
  BattleTimer,
  DraftBattleInvitePreviewPayload,
  DraftBattleStatePayload,
  CompletedDraftPayload,
  CurrentDraftPayload,
  CurrentRunPayload,
  DailyChallengePayload,
  DraftPayload,
  LeaderboardPagePayload,
  DraftLeaderboardPagePayload,
  PlayerStatsPayload,
  PublicIdentityPayload,
  RevealPayload,
  RunSummaryPayload,
} from '@signal-or-noise/shared-types';
import type { CompletedRound } from '@signal-or-noise/game-engine';
import { normalizeMojibakeDeep } from '@signal-or-noise/content/textEncoding';

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

export type DraftLeaderboardApiPayload = DraftLeaderboardPagePayload & {
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
  // Older imported scenario rows may contain UTF-8 text decoded as Windows-1252.
  // Normalize at the API/UI boundary so existing guest runs and fresh imports
  // render the same readable player-facing copy.
  return normalizeMojibakeDeep(body) as T;
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
  dailyStatus: () =>
    apiFetch<{
      challenge: DailyChallengePayload;
      run: CurrentRunPayload | null;
      completedAttempts: number;
      context: ApiContext;
    }>('/api/daily/attempts'),
  leaderboard: (query: LeaderboardApiQuery | { board: 'draft'; format: 'classic' | 'quick' | 'era'; page?: number }) => {
    const params = new URLSearchParams();
    params.set('board', query.board);
    if (query.board === 'daily') params.set('date', query.date);
    if (query.board === 'classic') params.set('difficulty', query.difficulty);
    if (query.board === 'draft') params.set('format', query.format);
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
  // Portfolio Draft (D052)
  draftEras: () =>
    apiFetch<{ eras: Array<{ id: string; name: string; description: string }> }>('/api/draft/eras'),
  draftHistory: () =>
    apiFetch<{ history: Array<{ id: string; format: 'classic' | 'quick' | 'era'; finalValue: number; gapFromOptimal: number; completedAt: string }>; context: ApiContext }>('/api/draft/history'),
  createDraft: (format: 'classic' | 'quick' | 'era' = 'classic', eraId?: string) =>
    apiFetch<{ draft: CurrentDraftPayload; context: ApiContext }>('/api/draft', {
      method: 'POST',
      body: JSON.stringify({ format, ...(eraId ? { eraId } : {}) }),
    }),
  currentDraft: () =>
    apiFetch<{ draft: CurrentDraftPayload | null; context: ApiContext }>('/api/draft'),
  draft: (draftId: string) =>
    apiFetch<{ draft: DraftPayload; context: ApiContext }>(
      `/api/draft/${encodeURIComponent(draftId)}`,
    ),
  submitDraftSelections: (draftId: string, slots: number[], allocations: number[]) =>
    apiFetch<{ draft: CompletedDraftPayload; context: ApiContext }>(
      `/api/draft/${encodeURIComponent(draftId)}/selections`,
      { method: 'POST', body: JSON.stringify({ slots, ...(allocations ? { allocations } : {}) }) },
    ),
  createDraftBattle: (format: 'classic' | 'quick' | 'era', timerSeconds: 120 | 300 | null, eraId?: string) =>
    apiFetch<{ battle: DraftBattleStatePayload; context: ApiContext }>('/api/draft-battles', {
      method: 'POST',
      body: JSON.stringify({ format, timerSeconds, ...(eraId ? { eraId } : {}) }),
    }),
  draftBattleInvite: (code: string) =>
    apiFetch<{ invite: DraftBattleInvitePreviewPayload; context: ApiContext }>(`/api/draft-battles/invite/${encodeURIComponent(code)}`),
  joinDraftBattle: (code: string) =>
    apiFetch<{ battle: DraftBattleStatePayload; context: ApiContext }>(`/api/draft-battles/invite/${encodeURIComponent(code)}/join`, { method: 'POST' }),
  draftBattleState: (battleId: string) =>
    apiFetch<{ battle: DraftBattleStatePayload; context: ApiContext }>(`/api/draft-battles/${encodeURIComponent(battleId)}`),
  submitDraftBattle: (battleId: string, slots: number[], allocations: number[]) =>
    apiFetch<{ battle: DraftBattleStatePayload; context: ApiContext }>(`/api/draft-battles/${encodeURIComponent(battleId)}/submissions`, {
      method: 'POST',
      body: JSON.stringify({ slots, allocations }),
    }),
  // Friend Battle (D052)
  createBattle: (difficulty: 'easy' | 'medium' | 'hard', timerSeconds: BattleTimer) =>
    apiFetch<{ battle: BattleStatePayload; context: ApiContext }>('/api/battles', {
      method: 'POST',
      body: JSON.stringify({ difficulty, timerSeconds }),
    }),
  listBattles: () =>
    apiFetch<{ battles: BattleListEntryPayload[]; context: ApiContext }>('/api/battles'),
  battleInvite: (code: string) =>
    apiFetch<{ invite: BattleInvitePreviewPayload; context: ApiContext }>(
      `/api/battles/invite/${encodeURIComponent(code)}`,
    ),
  joinBattle: (code: string) =>
    apiFetch<{ battle: BattleStatePayload; context: ApiContext }>(
      `/api/battles/invite/${encodeURIComponent(code)}/join`,
      { method: 'POST' },
    ),
  battleState: (battleId: string) =>
    apiFetch<{ battle: BattleStatePayload; context: ApiContext }>(
      `/api/battles/${encodeURIComponent(battleId)}`,
    ),
  battleReady: (battleId: string, round: number) =>
    apiFetch<{ battle: BattleStatePayload; context: ApiContext }>(
      `/api/battles/${encodeURIComponent(battleId)}/ready`,
      { method: 'POST', body: JSON.stringify({ round }) },
    ),
  submitBattleDecision: (
    battleId: string,
    payload: {
      roundIndex: number;
      action: 'long' | 'short' | 'pass';
      confidence?: 'low' | 'medium' | 'high' | 'all_in';
      companyGuess?: string;
    },
  ) =>
    apiFetch<{ battle: BattleStatePayload; context: ApiContext }>(
      `/api/battles/${encodeURIComponent(battleId)}/decisions`,
      { method: 'POST', body: JSON.stringify(payload) },
    ),
};
