# progress.md - Signal or Noise?

This is the live operational dashboard. Keep Current Status, How to Run, and
Blocked/Questions accurate. Git history and one phase closeout preserve history.

## Current Status

- **Phase:** 0-8 COMPLETE. Phase 8 - Daily Challenge was accepted on 2026-07-10
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
  41, content 77, database 22 (including Neon integration), web 16. Content
  and Gate 2 remain at 0 errors / 40 non-blocking WARNs / 0 missing variants.
- **Next task:** Phase 9A Competitive Modes and Phase 9B Polish/Analytics proceed
  in parallel on isolated branches/worktrees; Growth Gate A/B remains separate.
- **Phase 9A track state:** Competitive mode engine, persistence, leakage-safe
  APIs, and feature-local Draft/Battle screens are implemented and audited.
  The production build, workspace typechecks, content gates, 61 game-engine
  tests, 22 web tests, and the existing 22 database tests pass. The Phase 9A
  competitive database suite now contains 20 tests, but all 20 correctly skip
  against shared Neon because migration
  `20260712090000_phase9a_competitive_modes` is the sole pending migration.
  Prisma schema validation passes; no local/isolated PostgreSQL runtime is
  available for a clean migration apply. Signed-out/error responsive browser
  checks pass at approximately 375px and desktop, while complete guest Draft
  and two-session authenticated Battle browser QA require the migrated schema.
- **Workflow state:** D051 is the user-approved Phase 9 exception to D043: two
  independent track charters/owners converge at one integrated phase boundary.
  D054 permits direct routine branch/worktree git operations while retaining
  Luna Low for broad diff and consequential integration work. Legacy H/R
  artifacts remain evidence only under `agents/history/`.
- **Blocked/Questions:** Phase 9A is not ready for phase-boundary review until
  `20260712090000_phase9a_competitive_modes` is applied to an approved isolated
  PostgreSQL target (not shared Neon), all 20 competitive integration tests run
  without skips, and schema-backed guest Draft plus two-authenticated-session
  Friend Battle browser QA completes. No Phase 9A closeout has been written.

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
provenance question. Phase closeouts live in `agents/phase-closeouts/`
(latest: `P08_daily_challenge.md`).
