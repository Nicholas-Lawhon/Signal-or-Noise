# progress.md - Signal or Noise?

This is the live operational dashboard. Keep Current Status, How to Run, and
Blocked/Questions accurate. Git history and one phase closeout preserve history.

## Current Status

- **Phase:** Phase 11 - Strategic Pass and Portfolio Draft Expansion is in
  progress on `phase/11-strategic-pass-draft-expansion`. Smart Pass, weighted
  Classic/Quick/Era Drafts, format-separated solo leaderboards, and invite-based
  Draft Battles are implemented locally. The Phase 11 migration (with playtest
  repairs: it now also drops the stale D052 six-card and three-pick check
  constraints that blocked Quick Drafts) is applied to the dev database and
  content is reimported; all draft formats verified end-to-end via the API and
  the full database suite (51 tests) is green. Final independent review remains
  before the phase can be ready for acceptance. Phase 10 - First Playtest
  Repairs is accepted and complete. Phases 0-9 are complete. Phase 9 - Competitive
  Expansion and MVP Polish was
  accepted on 2026-07-10 after independent high-risk review, focused shared-
  visual integration, and the final merged acceptance suite. Phase 8 - Daily
  Challenge was accepted on 2026-07-10
  (archived charter: `agents/history/phase_8/P08_daily_challenge.md`; closeout:
  `agents/phase-closeouts/P08_daily_challenge.md`). Phase 7 - Leaderboards was
  accepted on 2026-07-10 (archived charter:
  `agents/history/phase_7/P07_leaderboards.md`; closeout:
  `agents/phase-closeouts/P07_leaderboards.md`). Phase 6 - Auth & Guest Play was accepted on 2026-07-10 (closeout:
  `agents/phase-closeouts/P06_auth_guest_play.md`).
  Phase 5 - Database closed on 2026-07-10. Phase 4B closed under **D045** with
  40 active cards at the
  D034 24 famous / 12 moderate / 4 obscure mix, 10 daily pools, and 10 market
  eras.
- **App state:** Classic Run is fully server-backed: the web UI plays through
  route handlers under `apps/web/app/api/` onto `packages/database`, with the
  Phase 5 reveal boundary intact end to end. Clerk (Hobby, D047) provides
  optional public-by-default auth behind a server-only identity boundary
  (`apps/web/lib/server/`); guests play via an httpOnly UUID cookie and can
  explicitly claim one completed Classic Run after sign-in (transactional,
  cookie-bound, one-time), including runs ended by bankruptcy. Daily Challenge
  entry is login-gated (D048) with
  unlimited immutable attempts (D049); the Phase 5 single-attempt constraint
  is removed by migration `20260710200000_phase6_auth_guest_play` (deployed to
  Neon). Saved runs/stats appear at `/profile`. Phase 7 adds leaderboards; Daily
  gameplay, deterministic UTC scheduling, immutable pool snapshots, resume, and
  replay now ship in Phase 8. Each UTC date lazily publishes one 10-round mixed
  challenge from the ordered pool rotation; concurrent publication converges on
  the same snapshot, and a user can resume their one in-progress attempt even
  across a UTC-day rollover while every terminal attempt remains immutable. Migration
  `20260711120000_phase8_daily_challenge` is deployed to Neon. Daily setup and
  gameplay are mobile-first at `/play/daily`; guests remain gated, while the
  app's code-only Clerk sign-in route uses email OTP rather than magic links,
  and its validated local redirects reject encoded or backslash external paths.
  Phase 7 adds public Daily, difficulty-separated Classic, and cumulative Signal
  leaderboards from canonical official finished runs, plus stable generated
  aliases and optional unique public display names. Current tests: game engine
  61, content 77, database 42 (including 20 competitive Neon integration
  tests), web 26. Integrated browser smoke coverage has 20 passing checks across
  Chromium and mobile WebKit. Content
  and Gate 2 remain at 0 errors / 40 non-blocking WARNs / 0 missing variants.
- **Phase 9A track state:** Competitive mode engine, persistence, leakage-safe
  APIs, and feature-local Draft/Battle screens are implemented and independently
  high-risk reviewed at the merged boundary. The review confirmed migration
  constraints, ownership, serializable concurrency/immutability, synchronized
  readiness, deadline auto-Pass/reconnect, opponent privacy, expiry, bankruptcy,
  tiebreaks, and viewer-scoped API responses against D052.
  Migration `20260712090000_phase9a_competitive_modes` is deployed to Neon and
  Prisma reports the schema up to date. The production build, workspace
  typechecks, content gates, 61 game-engine tests, 22 web tests, and all 42
  database tests pass with zero skips. Schema-backed guest Draft completes and
  reconnects correctly in browser QA at approximately 375px and desktop.
  Battle auth gates are responsive at both widths; the only available browser
  session was signed out, so a live two-authenticated-browser walkthrough was
  unavailable. Its synchronized/timed behavior is covered by 20 passing Neon
  integration tests using two distinct users, including leakage, auto-Pass,
  reconnect, expiry, bankruptcy, concurrency, and full completion paths.
- **Phase 9B track state:** Adds the responsive shared shell and visual system, polished public
  journey and gameplay reveal, accessible charts/interactions, persisted sound
  and analytics preferences, privacy-bounded optional PostHog instrumentation,
  complete rules/settings/disclaimer routes, and automated browser smoke QA.
  Draft/Battle are now first-class mode entries with integrated responsive
  styling, accurate rules, non-overlapping mobile controls, and typed D053-safe
  lifecycle events.
- **Growth Gate A status:** Growth Phase 1 - Foundation was accepted on
  2026-07-10. The five internal foundation artifacts are complete; no public
  launch, outreach, account creation, registration, spend, provider selection,
  or product-code change was performed. Growth Gate B preparation may proceed.
  D-01 public-name selection remains the first open decision and D-02 follows it.
  D-03, D-04, D-05, and D-07 have approved directions with implementation or
  external-review dependencies; D-06 formal tester recruitment is optional
  rather than a Gate B or launch requirement.
- **Next task:** Complete Phase 11 migrated PostgreSQL verification, resolve the
  independent high-risk review, and close the phase. Growth Gate B preparation
  may continue in parallel.
- **Phase 10 deferred action:** Revisit the shorter landing-to-first-decision
  funnel after more behavioral playtest data. It was intentionally not
  implemented in Phase 10.
- **Workflow state:** D051's two parallel Phase 9 tracks converged and were
  accepted at one integrated boundary under D043.
  D054 permits direct routine branch/worktree git operations while retaining
  Luna Low for broad diff and consequential integration work. Luna's
  maximum-intended Codex reasoning uses `xhigh`, while `max` currently resolves
  to Medium. Legacy H/R artifacts remain evidence only under `agents/history/`.
- **Blocked/Questions:** Phase 11's migration and new PostgreSQL integration cases
  require an authorized disposable/test database migration run (or authorization
  to deploy the checked-in migration to the shared Neon development database).
  No Phase 11 migration has been deployed. A live two-authenticated-browser
  Battle walkthrough remains desirable supplemental QA.

## How to Run

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/database db:migrate
pnpm --filter @signal-or-noise/database import:scenarios
pnpm --filter @signal-or-noise/database test
```

All commands run from the repo root. Requires Node.js LTS and pnpm 9.x.
Database commands also require repository-root `DATABASE_URL` and `DIRECT_URL`.
For direct Prisma CLI commands, export those values into the shell first; the
database test/import scripts load the root `.env` themselves.
The web app additionally needs `apps/web/.env.local` (never committed) holding
`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and
`CLERK_SECRET_KEY` copied from the ignored root `.env`.

## Archived History

Detailed history is under `agents/history/`; read it only for a concrete
provenance question. Phase closeouts live in `agents/phase-closeouts/` (latest:
`P09A_competitive_modes.md` and `P09B_polish_analytics.md`).
