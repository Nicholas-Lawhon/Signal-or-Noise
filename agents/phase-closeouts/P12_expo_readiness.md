# Phase 12 — Shared Package Cleanup for Expo Readiness Closeout

**Owner:** Claude Fable (Orchestrator session, user-assigned)
**Date:** 2026-07-13
**Status:** accepted (2026-07-13)

## Delivered

- Created `packages/shared-types` (zod-only): `contracts.ts` moved wholesale
  from `packages/database`, plus leaderboard query schemas and page payload
  types extracted from `leaderboardService.ts`. A duplicate
  `DraftLeaderboardPagePayload` that existed in both files was collapsed to the
  contracts version. `packages/database` keeps thin re-export shims, so its
  internal imports and server consumers are unchanged.
- All web client code (play pages, components, `lib/api.ts`) now imports
  contract types from `@signal-or-noise/shared-types`; the database package no
  longer appears in client-side imports. The fragile deep import
  `@signal-or-noise/content/src/textEncoding` became a proper `exports` subpath.
- Added `exports` maps to game-engine, content (`.`, `/types`, `/schema`,
  `/textEncoding`), and shared-types.
- Added `tools/mobile-smoke`: a static import-constraint check (allowlist:
  `zod`; forbids Node builtins, Prisma, database package, and the full content
  catalog index) plus a real Metro/React Native bundle of the mobile shared
  surface with catalog/Prisma leak fingerprint checks. Runs via
  `pnpm mobile:smoke` and inside `pnpm test`.
- Documented the mobile shared surface in `docs/07_technical_architecture.md`
  and package READMEs. No web runtime behavior, API, schema, or content change.

## Acceptance Evidence

| Criterion | Result | Evidence |
|---|---|---|
| Platform-neutral shared surface exists | pass | `packages/shared-types`, content subpaths; import graph walks clean (15 modules, zod-only externals) |
| Automated constraint checks enforce it | pass | `tools/mobile-smoke/check-imports.mjs` in `pnpm test` / `pnpm mobile:smoke` |
| Metro/RN bundling smoke test passes | pass | 292 KiB ios dev bundle, no catalog/Prisma fingerprints |
| Web unchanged; full suite green | pass | see Verification |
| Docs and progress current | pass | this file, `docs/07`, `progress.md` |

## Verification

- `pnpm typecheck` — all 7 workspace projects pass.
- `pnpm test` — engine 67, content 81, database 51 (Neon integration), web 27,
  mobile-smoke check + bundle; exit 0, no skips.
- Content validate and Gate 2 check — 0 errors / 40 known warnings / 0 missing.
- `pnpm --filter web lint` and production `next build` — pass.
- `pnpm --filter web test:e2e` — 24 passed (Chromium + mobile WebKit).

## Material Decisions or Deviations

- Repaired an adjacent pre-existing e2e failure: two Draft allocation specs
  still assumed the auto-rebalance behavior removed on `main` by `ad4612b`
  (authored after the last e2e run); they now balance allocations explicitly.

## Known Limitations

- The Metro smoke test uses the legacy standalone
  `metro-react-native-babel-preset/transformer`; when the real Expo app is
  created, its own Babel/Metro config supersedes this harness.
- The mobile API client itself (fetch wrapper equivalent of `apps/web/lib/api.ts`)
  is deliberately deferred to the Expo app phase, since its shape depends on the
  app's auth/session handling.
