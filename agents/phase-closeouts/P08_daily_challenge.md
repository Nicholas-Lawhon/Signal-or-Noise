# Phase 8 — Daily Challenge Closeout

**Status:** Accepted and integrated (2026-07-10)

Delivered the authenticated Daily Challenge end to end. UTC-day lazy
publication deterministically selects an ordered pool, snapshots its ten
scenario/difficulty entries and $10,000 bankroll, and converges safely under
concurrent requests. Daily runs use only that server-owned snapshot; guests
cannot create or resume them. A user has one resumable in-progress attempt,
including across a UTC-day rollover, while every completed or bankrupt replay
remains immutable. Existing official leaderboard selection receives Daily
terminal results through the canonical run path.

`/play/daily` provides mobile start, resume, replay, loading, unavailable,
error, and terminal states; gameplay reuses the server-backed hidden-card →
lock → reveal loop. Sign-in uses an explicit email-code flow that never
requests a magic-link strategy; the user confirmed a real Clerk email-code
sign-in succeeds. Classic guest access and all server identity, scoring, and
reveal protections remain unchanged.

The focused repair validates all sign-in redirects as local-only and rejects
encoded or backslash external paths. It also preserves the active Daily run
when the UTC date changes, with controlled integration coverage, and corrects
Daily replay copy and architecture documentation.

Migration `20260711120000_phase8_daily_challenge` is deployed to Neon.
Verification passed: `pnpm test` (game-engine 41, content 77, database 22
including Neon integration, web 16), `pnpm typecheck`, content validation and
Gate 2 (0 errors, 40 existing warnings), and `pnpm --filter web build`. At
375×812, guest Daily setup, date/round/bankroll presentation, sign-in access,
encoded-redirect protection, updated replay copy, and Classic fallback passed.
Local API smoke checks verified guest Daily POST returns 401 and public
metadata has no pool, scenario, or reveal leakage.

Known limitations: none. The approved Neon migration and Phase 8 application
changes are integrated into the project history.
