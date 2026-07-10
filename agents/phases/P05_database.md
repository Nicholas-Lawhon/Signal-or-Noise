# Phase 5 — Database

**Status:** accepted
**Risk:** high
**Owner:** autonomous Phase Owner
**Branch/worktree:** shared workspace; preserve unrelated dirty-worktree changes

## Outcome

Add the Prisma/PostgreSQL persistence foundation on Neon’s free tier. The phase
will import the 40 active production scenarios, persist runs and round
decisions, calculate and validate scores server-side, and establish anonymous
guest/user/profile, Daily Challenge, and leaderboard storage without starting
the Auth, Daily Challenge, or leaderboard product phases.

## Starting Context

- Locked product rules: `soul.md`.
- Roadmap scope: Phase 5 in `roadmap.md`.
- Approved provider and guest decision: `docs/consultant_memo_phase_5.md`.
- Conceptual entities and JSON mapping: `docs/06_data_model.md`.
- Server/API and anti-cheat boundaries: `docs/07_technical_architecture.md`.
- Current production content: `packages/content/scenarios/active/` and its catalogs.
- Scoring authority: `packages/game-engine`.

Discover other implementation context on demand; do not preload legacy history.

## Delegated Authority

- Refine the conceptual Prisma model into a normalized, migration-ready schema.
- Choose reversible package structure, repository/service boundaries, indexes,
  transaction boundaries, and Neon connection details.
- Add database scripts, fixtures, tests, and server operations needed by the
  acceptance criteria.
- Preserve JSON content as the reviewable source while making the importer
  validated and idempotent.
- Extend shared types and tests when required, without duplicating game math.

## Stop Conditions

- Neon credentials, project access, or a required external database action is
  unavailable.
- A decision would change locked game rules, expose secrets, select an Auth
  provider, or expand the phase into official leaderboard/Daily Challenge UX.
- A destructive migration or outward-facing deployment/push is proposed.

## Exclusions

- Auth provider integration, login UI, account linking, and official eligibility.
- Daily Challenge gameplay, duplicate-attempt product flow, or leaderboard UI.
- New scenario generation, content-policy changes, payments, Expo, or MVP polish.

## Acceptance Criteria

1. `packages/database` contains a strict Prisma schema, Neon-compatible client
   wrapper, environment documentation, and repeatable migration commands for
   the approved entities: users/profiles, guest sessions, scenarios/variants/
   sources/market points, runs, round decisions, Daily Challenges, leaderboard
   entries, stats, eras, and content packs.
2. A validated, idempotent scenario importer loads all 40 active scenarios,
   their 120 difficulty variants, catalogs, sources, and market data; invalid
   input fails before mutation and rerunning the import produces no duplicates.
3. Server-side run creation, current-run retrieval, round submission, and run
   completion/bankruptcy persist authoritative results in transactions and call
   `packages/game-engine` for scoring. Client bankroll, return, and score fields
   are never trusted.
4. Pre-decision server payloads exclude company identity, ticker, end price,
   actual return, reveal text, and outcome-chart data; reveal data is available
   only after a persisted decision.
5. Anonymous ownership is represented by a client-held guest session ID and
   remains unofficial; authenticated ownership fields are ready for Phase 6
   without implementing authentication in this phase.
6. Daily Challenge and leaderboard storage supports later phases, including
   challenge dates/pools, leaderboard type/period, score fields, and the locked
   tiebreaker inputs, without exposing an unimplemented public leaderboard.
7. Database unit/integration tests plus the full workspace validation suite pass,
   including migration, import idempotency, server scoring, guest restrictions,
   reveal-boundary, and invalid-client-input cases.

## Final Verification

```powershell
pnpm test
pnpm typecheck
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter web build
pnpm --filter @signal-or-noise/database test
git diff --check
```

## Closeout

When all criteria pass, update `progress.md` current state and write one concise
closeout in `agents/phase-closeouts/`. Do not create internal handoffs or reports.
