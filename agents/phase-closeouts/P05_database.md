# Phase 5 Closeout — Database

**Owner:** autonomous Phase Owner
**Date:** 2026-07-10
**Status:** accepted

## Delivered

Added the Prisma/PostgreSQL persistence foundation and deployed its initial
migration to Neon. The validated importer synchronizes the 40 active scenarios,
120 variants, sources, chart data, content packs, ten eras, and ten Daily pools
without changing the JSON source of truth. Server operations now persist guest
and user runs, calculate every decision through `packages/game-engine`, enforce
ownership and Daily-attempt constraints, update stats, store locked leaderboard
inputs, and withhold reveal-only fields until the decision transaction commits.

## Acceptance Evidence

| Criterion | Result | Evidence |
|---|---|---|
| Schema, migration, client, docs | pass | Prisma validate/generate; Neon migration deployed |
| Validated idempotent import | pass | Two consecutive imports retain 40 scenarios / 120 variants with no duplicates |
| Authoritative run persistence | pass | Neon integration covers create/read/submit/completion/bankruptcy and rejects client score fields |
| Reveal boundary | pass | Pre-decision contract omits identity/outcome fields and identity-bearing scenario IDs; reveal follows persistence |
| Guest/user foundation | pass | UUID guest ownership is unofficial; user ownership and official eligibility persist |
| Daily/leaderboard storage | pass | Duplicate official Daily attempt rejected; locked five-field tiebreaker inputs stored |
| Full verification | pass | All commands below passed |

## Verification

`pnpm test` passed 127 tests, including 12 database tests (6 local and 6
Neon integration tests). `pnpm
typecheck`, content validation (40 scenarios, 0 failures), Gate 2 check (0 errors,
40 non-blocking warnings, 0 missing), `pnpm --filter web build`, a second
`pnpm --filter @signal-or-noise/database test`, and `git diff --check` passed.

## Material Decisions or Deviations

The importer normalizes legacy narrow authoring-era IDs into the approved
ten-era catalog while preserving scenario JSON. Identity-bearing scenario IDs
are deliberately absent from pre-decision payloads.

## Known Limitations

The Phase 4 UI still reads local content; database-backed web endpoints, auth
provider integration, public leaderboards, and Daily Challenge gameplay remain
scheduled for later phases. The importer does not yet retire stale active rows
when a future production catalog removes an ID; repair this before the first
catalog removal or replacement. Existing Gate 2 warnings remain non-blocking.
