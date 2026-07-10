# Phase 6 — Auth & Guest Play

**Status:** approved — ready for implementation
**Approved by:** user
**Approved:** 2026-07-10
**Risk:** high
**Owner:** autonomous Phase Owner
**Branch/worktree:** dedicated Phase 6 branch; preserve unrelated changes

## Outcome

Add optional Clerk authentication while keeping gameplay public and immediate.
Wire Classic Run to the Phase 5 server persistence boundary so guests play
unofficially with a stable client-held session ID and authenticated users receive
saved runs/stats and future official eligibility.

## Starting Context

- Locked product rules: `soul.md`.
- Roadmap scope: Phase 6 in `roadmap.md`.
- Approved provider and continuity decision:
  `docs/consultant_memo_phase_6.md`.
- Persistence contracts and known limitations: `packages/database` and
  `agents/phase-closeouts/P05_database.md`.
- Auth/security boundaries: `docs/07_technical_architecture.md`.
- Current game flow: `apps/web/app/play/classic/`.

Discover other implementation context on demand; do not preload legacy history.

## Delegated Authority

- Add and configure Clerk's Next.js SDK, themed prebuilt auth UI, middleware,
  route handlers, and server-only identity adapter.
- Add reversible web/service structure, cookies, validation, tests, and minimal
  schema migration needed for identity synchronization.
- Add a transactional, one-time completed Classic Run claim operation and its
  post-game conversion UI.
- Replace the Phase 5 single-attempt Daily storage constraint with repeatable,
  immutable authenticated attempts and best-result-ready indexing.
- Wire the existing Classic Run UI to Phase 5 persistence operations without
  changing locked game rules or duplicating scoring math.
- Repair the Phase 5 importer retirement limitation if Phase 6 changes the
  production catalog; otherwise leave the documented limitation explicit.

## Stop Conditions

- Clerk project keys or required provider access are unavailable.
- A decision would change locked game rules, allow bulk/automatic guest-run
  claiming, expose official leaderboards/Daily Challenge, or require paid
  provider features.
- A destructive migration, production deployment, or push is proposed.

## Exclusions

- Public leaderboards, Daily Challenge gameplay, payments, roles/organizations,
  custom password auth, bulk guest-history migration, and account deletion/export
  product flows beyond provider defaults. The Daily login gate is in scope, but
  Daily gameplay is not.
- New content, scoring changes, or broad visual polish.

## Acceptance Criteria

1. Clerk is integrated with the Next.js App Router using documented environment
   variables, public-by-default middleware, optional sign-in/sign-up/sign-out UI,
   and a game-consistent mobile presentation.
2. A server-only identity boundary verifies the Clerk session, idempotently maps
   `externalAuthId` to the internal `User`, and never accepts a request-supplied
   user ID or official-status flag.
3. Guests receive a stable UUID client session, can start/resume/complete Classic
   Runs without login, remain unofficial, and are never blocked by auth loading
   or provider failure.
4. Classic Run uses server route handlers backed by `packages/database` for run
   creation, current-run retrieval, round submission, reveal, completion, and
   bankruptcy. Pre-decision payloads retain the Phase 5 reveal boundary.
5. The completed guest Classic summary offers **Save this run** and explains the
   benefits without blocking result access. Successful sign-up/sign-in claims
   that run exactly once, attaches its decisions to the internal user, marks it
   official and future-Classic-leaderboard-eligible, refreshes saved stats, and
   returns to the saved summary. Cancellation or failure preserves a retryable
   guest result.
6. Claims are transactional and secure: the run must be completed, Classic,
   unclaimed, and owned by the guest-session cookie present before authentication.
   User and guest identifiers are derived server-side, concurrent/double claims
   fail safely, and signing in alone never claims an in-progress run.
7. Authenticated runs persist directly to the internal user and update saved
   stats. Daily Challenge entry requires a verified account before run creation;
   guest Daily creation is rejected by both the web boundary and database service.
   Authenticated users may create unlimited Daily attempts, each stored as a
   separate immutable run; the Phase 5 one-run-per-user/challenge constraint and
   duplicate-attempt rejection are removed.
8. Ownership is enforced end to end: one guest/user cannot read or mutate another
   run, guests cannot create official entries, and the Phase 5 leaderboard helper
   remains server-internal.
9. Authenticated and guest states have clear loading, error, sign-in prompt, and
   sign-out behavior at approximately 375px without turning login into a gameplay
   gate.
10. Unit/integration/browser tests cover guest continuity, verified-user mapping,
    spoofed-user rejection, ownership isolation, sign-in during a guest run,
    successful/cancelled/double/cross-owner claims, guest Daily creation rejection,
    multiple authenticated Daily attempts, immutable completed attempts,
    authenticated return to the Daily start flow, saved stats, reveal isolation,
    and provider-unavailable fallback. The full workspace suite and production
    build pass.

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

Also complete mobile browser checks for guest play, post-game sign-up and claim,
cancel/retry, sign-out, refresh, cross-owner denial, and reveal timing.

## Closeout

When all criteria pass, update `progress.md` current state and write one concise
closeout in `agents/phase-closeouts/`. Do not create internal handoffs or reports.
