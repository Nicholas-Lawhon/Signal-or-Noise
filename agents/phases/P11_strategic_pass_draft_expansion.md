# Phase 11 — Strategic Pass and Portfolio Draft Expansion

**Status:** in_progress
**Risk:** high
**Owner:** multi-track dedicated Codex threads with Orchestrator integration
**Branch/worktree:** `phase/11-strategic-pass-draft-expansion` in the project checkout

## Outcome

Make Pass a deliberate read in every Classic-style loop and turn Portfolio Draft
into a replayable strategic and competitive mode through three weighted formats,
official all-time leaderboards, and synchronized invite-based Draft Battles,
while preserving server-owned truth, answer privacy, and mobile-first play.

## Starting Context

- `soul.md` (D055 controls), Phase 11 in `roadmap.md`, and `progress.md`.
- `packages/game-engine/src/`, `packages/content/`, and
  `packages/database/src/draftService.ts` are the primary logic entry points.
- Existing leaderboard and Friend Battle services are the persistence/security
  models; `apps/web/app/play/draft/` is the current Draft journey.

Discover other implementation context on demand. Do not preload legacy history.

## Delegated Authority

- Choose reversible schema, service, API, validation, component, polling, and
  migration structure consistent with D055.
- Add one checked-in Prisma migration, pure engine logic, reviewed content
  metadata, validators, tests, routes, and responsive UI required by the phase.
- Split implementation into coordinated Smart Pass, Draft, and integration tracks;
  each track may use bounded subagents while its owner remains responsible.
- Repair adjacent regressions found during verification.

## Stop Conditions

- A required behavior conflicts with D055, another locked rule, or answer privacy.
- Completion requires production migration/deployment, external credentials,
  pushing, spending, or another outward/irreversible action.
- Unrelated worktree changes conflict with the phase and cannot be preserved.

## Exclusions

- Private leagues, public matchmaking, friend graphs, chat, or notifications.
- Draft trading, rebalancing after reveal, weights outside D055, paid formats, or
  dynamic AI-generated production scenarios.
- Portfolio Draft Signal Score or battle results on solo Draft leaderboards.
- Production deployment or migration execution without separate authorization.

## Acceptance Criteria

1. Every active scenario has reviewed Smart Pass eligibility and a reveal-safe
   explanation; validation rejects missing/invalid metadata and the eligible share
   remains within the approved 10%-20% calibration range.
2. Pure game-engine Smart Pass scoring awards +1 only for an eligible Pass and
   preserves all other locked Pass behavior across Classic, Daily, voluntary
   Friend Battle Passes, and deadline-generated Passes.
3. Eligibility and explanation never appear in pre-decision API/client payloads;
   official server scoring never trusts eligibility or awards from the client.
4. Rules, setup guidance, Pass controls, and reveal feedback teach Smart Pass
   without signaling eligible cards before settlement.
5. Classic Draft (6/3), Quick Draft (4/2), and Era Draft (6/3) enforce D055's
   format, compatibility, allocation, and immutable-snapshot rules server-side.
6. Pure engine logic calculates weighted final value, optimal valid selection and
   allocation, and gap for every format, with deterministic tie and edge coverage.
7. Each format has a separate all-time leaderboard containing each authenticated
   player's best completed solo result, ranked by final value, then smaller gap,
   then earlier completion; guests, incomplete runs, and battles are excluded.
8. Exactly two signed-in players can use an opaque invite for one immutable Draft
   Battle; both receive the same cards/format, choices remain private until settle,
   timers/forfeits/expiry/reconnect work under D055, and final value decides or draws.
9. Draft setup, allocation, reveal, history/profile, rules, analytics, and
   leaderboard UI accurately distinguish format and solo/battle context.
10. At approximately 375px and desktop width, changed journeys have no overflow,
    navigation obstruction, inaccessible control, or answer leakage.
11. Database concurrency and ownership tests cover replay/best-result selection,
    simultaneous completion, invite claiming, duplicate submission, deadline
    settlement, reconnect, expiry, and tampered payloads.
12. Existing Classic, Daily, leaderboard, Friend Battle, Draft, content, and
    privacy behavior remains covered; the full suite passes without weakened tests.
13. `progress.md` is current and one concise Phase 11 closeout exists.

## Final Verification

```powershell
pnpm test
pnpm typecheck
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/database test
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web test:e2e
```

Run focused suites first. Perform interactive mobile checks of Smart Pass, all
three weighted solo formats and leaderboards, and a two-user Draft Battle. Phase
closure requires independent strong-model review because scoring, database trust,
leaderboard integrity, and competitive privacy are high risk.

## Closeout

When all criteria pass, update `progress.md` current state and write one concise
closeout in `agents/phase-closeouts/`. Do not create internal handoffs or reports.
