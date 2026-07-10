# Phase 7 — Leaderboards

**Status:** accepted and archived

**Accepted:** 2026-07-10
**Approved by:** user
**Approved:** 2026-07-10
**Risk:** high
**Owner:** autonomous Phase Owner
**Branch/worktree:** dedicated Phase 7 branch; preserve unrelated changes

## Outcome

Ship a public, mobile-first leaderboard hub for Daily Challenge Bankroll, Best
Classic Run Bankroll, and All-Time Signal Score. Rankings are server-authoritative,
exclude unofficial guest play, update from immutable saved results, and never
accept client-calculated scores or identity.

## Approved Decisions (D050)

1. **Classic fairness:** separate Easy, Medium, and Hard rankings because their
   starting bankrolls and run lengths differ; expose them as tabs/filters.
2. **Public identity:** use a stable generated `Player-XXXX` alias by default and
   allow an optional unique public display name. Never publish Clerk full name or
   email without the player's explicit choice.
3. **All-Time Signal Score:** rank the cumulative Signal Score from official
   finished runs, with total correct calls, fewer passes, then earlier attainment
   as deterministic tiebreakers.
4. **Ties:** use competition ranking (`1, 2, 2, 4`).

## Starting Context

- Locked product rules: `soul.md`.
- Roadmap scope: Phase 7 in `roadmap.md`; D049 in `decisions.md`.
- Ranking math: `packages/game-engine/src/leaderboard.ts`.
- Persistence foundation: `packages/database/prisma/schema.prisma` and
  `packages/database/src/runService.ts`.
- Auth/ownership boundary: `apps/web/lib/server/` and the Phase 6 closeout.
- Target routes: leaderboard section of `docs/07_technical_architecture.md`.

Discover other implementation context on demand; do not preload legacy history.

## Delegated Authority

- Add reversible schema migrations, server-only ranking services, route handlers,
  public-safe identity support, pagination, caching, tests, and mobile UI.
- Repair or replace the unused Phase 5 `LeaderboardEntry` helper/schema when
  needed to guarantee idempotent best-entry updates and authoritative queries.
- Materialize rankings transactionally or query canonical runs directly, provided
  retries, concurrency, and completed-run immutability remain correct.
- Add empty, loading, error, signed-in-player, and out-of-range rank states.

## Stop Conditions

- A choice would expose private Clerk/profile data, change locked scoring or
  tiebreakers, admit guest/unofficial runs, or make the client authoritative.
- Phase 7 would require Daily gameplay/scheduling, paid infrastructure, a
  destructive migration, production deployment, or a push.

## Exclusions

- Daily Challenge gameplay/scheduling, weekly/monthly/seasonal boards, friends,
  follows, challenges, leagues, moderation systems, badges, and notifications.
- Full public profile pages; leaderboard rows remain non-clickable in this phase.
- New scoring rules, content, or broad visual polish.

## Acceptance Criteria

1. `/leaderboards` provides public mobile views for Daily, Classic, and Signal
   Score with clear score meaning, rank, player identity, and current-user state.
2. Classic rankings show each user's best official finished run per difficulty;
   authenticated and explicitly claimed guest runs qualify, unofficial runs do not.
3. Daily rankings show one best completed attempt per user/date under D049 and
   are Phase 8-ready without implementing Daily gameplay.
4. All-Time Signal Score aggregates only official finished runs and updates after
   authenticated completion or a successful one-time guest claim.
5. Bankroll boards use the locked order: bankroll, Signal Score, correct calls,
   fewer passes, then faster completion. Signal ranking follows approved Decision 3.
6. Rank generation is idempotent and concurrency-safe: retries cannot duplicate a
   player/board/period entry, worse results cannot replace better ones, and result
   edits or client score submission are impossible.
7. Server responses expose only public aliases/display names and leaderboard
   metrics; Clerk IDs, internal user IDs, emails, guest IDs, and private stats stay
   server-only.
8. Guests can view leaderboards but cannot create official entries. Signed-in
   users can locate their rank even when outside the first page.
9. Empty/loading/error states and all three boards work at approximately 375px
   without displacing gameplay as the primary product experience.
10. Unit, integration, and browser tests cover ordering/ties, difficulty isolation,
    best-of replacement, repeat Daily attempts, claims, spoof rejection, privacy,
    pagination/current-user rank, empty boards, and concurrent updates. The full
    workspace suite and production build pass.

## Final Verification

```powershell
pnpm test
pnpm typecheck
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter web build
pnpm --filter @signal-or-noise/database test
git diff --check
```

Also complete mobile browser checks for all leaderboard types, difficulty/date
selection, signed-out viewing, current-player rank, ties, empty/error states, and
privacy of response payloads.

## Closeout

When all criteria pass, update `progress.md` current state and write one concise
closeout in `agents/phase-closeouts/`. Do not create internal handoffs or reports.
