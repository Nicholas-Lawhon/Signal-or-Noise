# progress.md - Signal or Noise?

This is the live operational dashboard. Keep Current Status, How to Run, and
Blocked/Questions accurate. Git history and one phase closeout preserve history.

## Current Status

- **Phase:** 0-6 COMPLETE. **Phase 7 - Leaderboards implementation and its
  independent high-risk phase-boundary review are complete; Phase 7 is awaiting
  user acceptance** under
  `agents/phases/P07_leaderboards.md` (closeout:
  `agents/phase-closeouts/P07_leaderboards.md`). Phase 6 - Auth & Guest Play was accepted on
  2026-07-10** (closeout: `agents/phase-closeouts/P06_auth_guest_play.md`).
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
  gameplay and challenge scheduling remain for Phase 8. Phase 7 adds public
  Daily, difficulty-separated Classic, and cumulative Signal leaderboards from
  canonical official finished runs, plus stable generated aliases and optional
  unique public display names. Migration `20260711010000_phase7_leaderboards`
  is deployed to Neon. Current tests: game engine 41, content 77, database 16
  (including Neon integration), web 14. Content
  and Gate 2 remain at 0 errors / 40 non-blocking WARNs / 0 missing variants.
- **Next task:** Obtain user acceptance for Phase 7. After acceptance, use the
  DeepSeek v4 Pro git-operator workflow to archive/commit/push as authorized,
  then prepare Phase 8.
- **Workflow state:** D043 is active: one charter, one autonomous Phase Owner,
  one closeout, and one phase-boundary review. Legacy H/R artifacts remain
  evidence only under `agents/history/`.
- **Blocked/Questions:** None.

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
The web app additionally needs `apps/web/.env.local` (never committed) holding
`DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and
`CLERK_SECRET_KEY` copied from the ignored root `.env`.

## Archived History

Detailed history is under `agents/history/`; read it only for a concrete
provenance question. Phase closeouts live in `agents/phase-closeouts/`
(latest: `P06_auth_guest_play.md`).
