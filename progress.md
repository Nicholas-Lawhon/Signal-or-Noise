# progress.md - Signal or Noise?

This is the live operational dashboard. Keep Current Status, How to Run, and
Blocked/Questions accurate. Git history and one phase closeout preserve history.

## Current Status

- **Phase:** 0-5 COMPLETE. Phase 6 - Auth & Guest Play is approved and ready for
  implementation under `agents/phases/P06_auth_guest_play.md`. Phase 5 -
  Database closed on 2026-07-10. Phase 4B closed under **D045** with 40 active cards
  at the D034 24 famous / 12 moderate / 4 obscure mix, 10 daily pools, and 10
  market eras. The next phase is **Phase 6 - Auth & Guest Play**.
- **App state:** Neon/PostgreSQL is migrated and contains the validated JSON
  production catalog: 40 scenarios, 120 difficulty variants, 10 daily pools,
  and 10 eras. `packages/database` now owns the Prisma client, idempotent import,
  guest/user persistence foundations, authoritative run/round operations,
  reveal isolation, Daily Challenge storage, leaderboard inputs, and stats.
  Classic Run still uses `ACTIVE_SCENARIOS` in the Phase 4 UI; server wiring and
  authentication belong to later phases. Current tests: game engine 38, content
  77, database 12 (including Neon integration). Content and Gate 2 remain at
  0 errors / 40 non-blocking WARNs / 0 missing variants.
- **Next task:** Dispatch the autonomous Phase 6 Owner against the approved
  charter. Clerk's required Next.js variables are present in the ignored root
  `.env`; the owner must make them available to `apps/web` without committing
  secrets. The provider and one-time completed Classic guest-run claim policy
  are approved under **D047**; Daily Challenge login is required under **D048**,
  with unlimited attempts and best-result ranking under **D049**.
- **Phase 4 evidence:** All 120 active difficulty variants have current opaque-ID
  Grok evidence; 122 judge executions were performed including two activation-time
  Easy rejudges for stale Roku and Target hashes. Final checks passed: 114 tests,
  workspace typecheck, production web build, content validation, and Gate 2
  coverage.
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

## Archived History

Detailed history is under `agents/history/`; read it only for a concrete
provenance question. The Phase 4B closeout is
`agents/phase-closeouts/P04B_content_expansion.md`.
