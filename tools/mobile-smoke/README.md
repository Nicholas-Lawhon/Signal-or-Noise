# @signal-or-noise/mobile-smoke

Guards the **mobile shared surface** — the set of workspace modules the future
Expo/React Native app will import:

- `@signal-or-noise/shared-types` (API contracts, leaderboard queries/payloads)
- `@signal-or-noise/game-engine` (pure scoring/draft/battle logic)
- `@signal-or-noise/content/types`, `/schema`, `/textEncoding` (platform-neutral
  content subpaths — **not** the full content index, whose scenario catalog and
  reveal data must never ship in a client bundle)

Two checks, both run by `pnpm mobile:smoke` (and by `pnpm test` via the
workspace):

1. **`check-imports.mjs`** — statically walks the import graph from each
   surface entry point and fails on any external import outside the allowlist
   (currently `zod`), any Node builtin, and any forbidden workspace import
   (`@signal-or-noise/database`, the full `@signal-or-noise/content` index).
   New workspace subpaths must be added to `WORKSPACE_EXPORTS` deliberately.
2. **`bundle.cjs`** — bundles `entry.ts` with Metro (platform `ios`) using the
   React Native Babel preset, proving the surface actually builds for RN, then
   greps the output for catalog/Prisma fingerprints.

If either check fails after your change, you have coupled the shared surface to
web- or server-only code; move the dependency behind the API or out of the
shared packages instead of weakening the check.
