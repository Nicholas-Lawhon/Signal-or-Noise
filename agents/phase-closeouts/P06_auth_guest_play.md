# Phase 6 Closeout — Auth & Guest Play

**Owner:** autonomous Phase Owner
**Date:** 2026-07-10
**Status:** accepted

## Delivered

Clerk (Hobby tier, D047) is integrated with the Next.js App Router: themed
prebuilt sign-in/sign-up/sign-out UI, public-by-default `clerkMiddleware`, and
a server-only identity boundary (`apps/web/lib/server/`) that verifies the
Clerk session, idempotently maps `externalAuthId` to the internal `User`, and
falls back to guest on provider failure. No route accepts a request-supplied
user ID, guest ID, external auth ID, or official flag; strict mutation schemas
reject extra data with 400.

Classic Run now plays entirely through route handlers backed by
`packages/database`: create, current-run resume, round submission with
post-persistence reveal, completion, bankruptcy, and owner-checked summaries.
Guests get a stable httpOnly UUID cookie, are never blocked by auth, and stay
unofficial. The finished guest summary offers **Save this run**: an explicit,
transactional, cookie-bound, one-time claim (`claimedAt` + guarded update +
Serializable retry), including bankruptcy results, that attaches decisions to
the account, marks the run official, and refreshes saved stats. Signing in alone never claims anything;
cancellation and failures leave a retryable guest result. Daily Challenge
entry is login-gated at both the web boundary and the database service (D048);
authenticated users may create unlimited immutable attempts (D049) — the
Phase 5 single-attempt unique constraint was removed by migration
`20260710200000_phase6_auth_guest_play` (deployed to Neon), which also adds
`claimedAt` and a best-result index. `/profile` shows saved stats.

## Verification

Full suite green: `pnpm test` (141 tests: engine 38, content 77, database 15
incl. Neon integration, web 11), `pnpm typecheck`, content validate (0
failures/40 WARNs), Gate 2 check (0 errors/40 WARNs/0 missing), `pnpm --filter
web build`, database tests re-run, `git diff --check`. Integration tests cover
identity mapping, guest-Daily rejection, repeated immutable Daily attempts and
mode-scoped resume,
claim in-progress/cross-owner/failed-then-retry/concurrent/double paths, stats
refresh, reveal isolation, and summary ownership.

Runtime evidence: 34 HTTP checks against the live dev server (guest cookies,
spoof rejection, ownership denial, reveal timing, real Clerk Backend-API
sessions, claim races, Daily gate) plus 20 Playwright Chromium checks at
375×812 — guest play, refresh continuity, locked→reveal timing, post-game
sign-in and claim, modal cancel/retry, saved stats, sign-out, guest Daily
gate, cross-owner denial in-browser, and a network monitor proving no
pre-decision response carried reveal fields.

## Known limitations (non-blocking)

- Clerk dashboard currently enables password sign-up with bot-protection
  CAPTCHA; the memo's email-code-first setup is a dashboard setting, not code.
  Automated browser checks therefore verified sign-in + claim with a
  Backend-API test user; sign-up UI was verified visually.
- Daily gameplay/scheduling and leaderboards remain Phases 7-8; the attempt
  endpoint 404s until a challenge row exists.
- The Phase 5 importer retirement limitation stands (catalog unchanged).
- During verification the Neon dev database was unintentionally reset by a
  `migrate diff` misstep; it was fully restored from migrations plus the
  idempotent JSON import (only regenerable test data existed), and counts were
  re-verified.
