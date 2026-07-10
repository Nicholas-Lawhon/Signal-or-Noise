# Phase 7 — Leaderboards Closeout

**Status:** Independent phase-boundary review passed; awaiting user acceptance

**Date:** 2026-07-10

**Decision:** D050

## Delivered

- Added public `/leaderboards` views for Daily Challenge, Classic by difficulty,
  and cumulative All-Time Signal Score, with URL-synced filters, pagination,
  loading/error/empty states, signed-out viewing, and current-player rank support.
- Rankings query immutable canonical `Run` rows. Only official terminal runs
  qualify; Classic and Daily choose each player's best full-tiebreaker result,
  while Signal aggregates every qualifying run. Competition ranks use
  `1, 2, 2, 4`.
- Added stable `Player-XXXX` aliases and optional case-insensitively unique public
  names. Clerk identity, emails, internal IDs, guest IDs, and private stats are
  excluded from leaderboard responses.
- Removed the unsafe unused leaderboard-write helper. Rankings are derived, so
  retries, concurrent reads, and worse later results cannot create duplicates or
  overwrite a better result.
- Added migration `20260711010000_phase7_leaderboards` with public-identity
  backfill and leaderboard query indexes; it is applied to the shared Neon
  database.

## Verification

- `pnpm test`: 148 passed (41 game engine, 77 content, 16 database, 14 web).
- `pnpm typecheck`: passed.
- Content validation: 0 errors, 40 established warnings.
- Gate 2: 0 errors, 40 established warnings, 0 missing variants.
- `pnpm --filter web build`: passed.
- Live APIs: Classic, Signal, and empty Daily return 200; invalid dates and
  spoofed identity filters return 400; public payload allowlist verified.
- Mobile browser checks at 375×812 covered all boards, Classic difficulty and
  URL changes, Daily date/empty state, signed-out viewing, and overflow.
- Independent high-risk review passed after one focused repair: out-of-range page
  URLs now clamp to the final valid page without a fetch loop; focused web tests
  (14) and the full workspace typecheck passed after the repair.
- `git diff --check`: passed before staging; staged diff is checked separately.

## Known Limitations

- Daily gameplay/scheduling remains Phase 8 scope.
- Rankings are computed from canonical runs in memory; this is appropriate for
  MVP volume and should be revisited when leaderboard volume materially grows.
- Browser automation could not inspect the app after localhost was intentionally
  stopped because the browser safety layer blocks offline error pages; the retry
  error component remains implemented and the original runtime failure visibly
  exercised it.
