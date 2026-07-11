# Phase 9A — Competitive Modes Closeout

**Status:** ready for independent high-risk review

## Delivered

- Portfolio Draft deals six distinct active Medium scenarios from one compatible
  historical window, accepts exactly three slot-based picks, and computes the
  equal-weight $10,000 result, optimal three, and gap in pure game-engine logic.
- Draft payloads stay answer-free until immutable selection. Guests complete
  locally; signed-in drafts persist as official results; no leaderboard exists.
- Friend Battle supports unlimited opaque invites, exactly two signed-in
  players, Classic difficulty settings, `off|30|60|120` timers, immutable ordered
  scenarios, synchronized ready barriers, server deadlines, auto-Pass, safe
  opponent progress, reconnect, expiry, bankruptcy, and bankroll/Signal tiebreaks.
- PostgreSQL constraints enforce Draft ownership/terminal invariants, valid
  Battle configuration/state, and decision membership in one of two player rows.
  Expiry clears any stale round deadline.
- Feature-local Draft/Battle screens cover loading, waiting, timer, reveal,
  retry, expiry, bankruptcy, result, and summary states with accessible control
  state and error/status semantics.

## Verification

- Migration `20260712090000_phase9a_competitive_modes` deployed successfully;
  `prisma migrate status` reports the shared Neon schema up to date.
- `pnpm test`: 61 game-engine, 77 content, 42 database, and 22 web tests pass;
  zero skips. The 20 competitive integration tests cover creation, ownership,
  concurrency, immutable submission, leakage, readiness, deadlines/auto-Pass,
  reconnect, expiry, bankruptcy, simultaneous bankruptcy, and full completion.
- `pnpm typecheck`, `pnpm build`, Prisma validation, content validation, and Gate
  2 pass. Content remains at 0 failures / 40 accepted warnings / 0 missing variants.
- Browser QA: guest Draft completed at approximately 375px, revealed all six
  outcomes and optimal gap, resumed the immutable summary after reload, and
  rendered without horizontal overflow at mobile/desktop widths. Battle sign-in
  and unauthorized-room gates also pass responsively.

## Known Limitation

The available in-app browser had no signed-in Clerk identity, and no second
browser was available, so the two-authenticated-session Battle UI walkthrough
could not run. No auth bypass was introduced. The same two-user live Neon state
machine is exercised end to end by the 20 passing competitive integration tests;
the boundary reviewer may add a visual two-session walkthrough when sessions are
available.
