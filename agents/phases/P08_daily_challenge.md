# Phase 8 — Daily Challenge

**Status:** draft — awaiting user approval

**Risk:** high

**Default owner:** GPT 5.6 Luna, max reasoning, new Codex task/thread

**Branch/worktree:** dedicated Phase 8 branch; preserve unrelated changes

## Outcome

Ship the complete authenticated Daily Challenge: every player receives the same
10-round curated mixed-difficulty challenge for the current UTC date, may make
unlimited immutable attempts, and sees their best completed result reflected on
the existing Daily leaderboard.

## Proposed Phase Decisions

Approval of this charter approves these operating rules:

1. **Day boundary:** Daily Challenges use UTC calendar dates everywhere: schedule,
   API lookup, UI label/countdown, runs, and leaderboard selection.
2. **Schedule:** the 10 validated MVP pools rotate deterministically by UTC date.
   A published `DailyChallenge` row snapshots the selected pool and starting
   bankroll; published dates are immutable so retries and later content imports
   cannot change what players received.
3. **Fairness:** every attempt for a date uses the pool's exact scenario order,
   per-entry difficulty, and $10,000 starting bankroll. The client cannot choose
   a pool, date, scenario, difficulty, score, or official status.
4. **Replay:** authenticated players may start unlimited attempts and may resume
   their latest in-progress Daily run. Every terminal attempt remains immutable;
   the Phase 7 board continues to select the best full-tiebreaker result.

These clarify implementation of the already locked D048/D049 rules; they do not
change scoring, reveal timing, or leaderboard ordering.

## Starting Context

- Locked rules: `soul.md` Daily Challenge and scoring sections.
- Roadmap scope: Phase 8 in `roadmap.md`; D048-D050 in `decisions.md`.
- Validated pools: `packages/content/data/daily-challenge-pools.json`.
- Existing foundations: `packages/database/src/dailyChallengeService.ts`,
  `packages/database/src/runService.ts`, `apps/web/app/api/daily/attempts/route.ts`,
  and `apps/web/app/play/daily/`.
- Daily leaderboard: `packages/database/src/leaderboardService.ts` and
  `apps/web/app/leaderboards/`.

Discover other implementation context on demand; do not preload legacy history.

## Delegated Authority

- Add an idempotent UTC scheduling/materialization service and Windows-compatible
  script or safe lazy-publication path for current/future challenges.
- Extend Daily route handlers and mobile UI by reusing the server-backed Classic
  gameplay/reveal components where practical.
- Add resume, replay, completion, bankruptcy, best-score, loading, empty,
  unavailable, and auth-expiry states.
- Add reversible migrations/indexes only if needed for immutable schedule
  snapshots or concurrency guarantees.
- Repair stale Daily-specific documentation that conflicts with D048/D049, but
  do not broaden product scope.

## Stop Conditions

- A choice would change locked scoring/reveal rules, admit guest Daily play,
  limit attempts, expose future outcomes or unpublished schedules, or let the
  client select authoritative challenge inputs.
- The phase requires paid scheduling infrastructure, destructive migration,
  production deployment, credentials beyond the configured Clerk/Neon setup,
  or a push.

## Exclusions

- Weekly/monthly/seasonal challenges, streak rewards, notifications, friends,
  sharing, badges, moderation, admin UI, new content, and Phase 9 visual polish.
- Changes to Classic Run, leaderboard policy, or public-profile scope except
  focused fixes required by Daily integration.

## Acceptance Criteria

1. `/play/daily` is a polished mobile start/resume/replay flow showing the UTC
   challenge date, 10 rounds, mixed difficulty, $10,000 bankroll, and best-score
   rule; guests remain login-gated without losing access to Classic.
2. The same UTC date resolves to one immutable published challenge under
   concurrent/retried scheduling, and every player receives the same ordered
   scenario/difficulty sequence.
3. Only authenticated server-verified users can create or resume Daily runs;
   request-supplied identity/date/pool/scenario/difficulty/score/official fields
   are rejected or impossible.
4. Daily gameplay completes the full hidden-card → server lock → reveal loop with
   no answer, outcome, or future-chart leakage before each decision persists.
5. Unlimited attempts work without overwriting prior terminal runs; refresh
   resumes the latest in-progress Daily attempt and replay starts a distinct run.
6. Completion and bankruptcy are official, update saved stats, and appear once in
   cumulative Signal and the correct UTC Daily board; the board selects only the
   user's best completed attempt for that date using D050 ordering.
7. Missing/unpublished challenge, auth expiry, request failure, loading, reveal,
   terminal, and retry states are understandable and recoverable at about 375px.
8. Tests cover UTC boundaries, deterministic rotation, idempotent/concurrent
   publication, immutable snapshots, mixed variants/order, auth/spoof rejection,
   resume/replay, scoring/reveal privacy, completion/bankruptcy, and leaderboard
   integration. Full workspace tests, typecheck, content gates, database tests,
   production build, and browser acceptance pass.

## Final Verification

```powershell
pnpm test
pnpm typecheck
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter web build
pnpm --filter @signal-or-noise/database test
```

Also verify at 375×812: guest gate, signed-in start, same-date consistency,
refresh resume, replay, all mixed difficulties, pre-decision privacy, terminal
summary, best Daily leaderboard result, empty/unavailable/error states, and the
UTC date rollover boundary with controlled time.

## Closeout

When every criterion passes, update `progress.md`, write one concise closeout in
`agents/phase-closeouts/`, and request the independent high-risk phase-boundary
review. Do not create internal handoffs or reports.
