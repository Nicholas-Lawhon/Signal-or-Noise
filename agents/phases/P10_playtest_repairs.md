# Phase 10 — First Playtest Repairs

**Status:** complete
**Risk:** normal
**Owner:** GPT 5.6 Luna, xHigh, dedicated Codex thread
**Branch/worktree:** dedicated non-main branch in the project checkout

## Outcome

Resolve the actionable findings from the first structured playtest so the mobile
guest journey is polished, accessible, and honest about saved/competitive play,
while preserving the locked game rules and reveal boundary.

## Starting Context

- `soul.md`
- `progress.md` Current Status, How to Run, and Blocked/Questions
- `agents/roles/playtester.md`
- Relevant UI under `apps/web`; discover exact entry points with `rg`

Discover other implementation context on demand. Do not preload legacy history.

## Delegated Authority

- Make reversible UI, copy, accessibility, encoding, and test changes needed to
  meet acceptance.
- Spawn up to five subagents concurrently for bounded implementation or
  verification tasks. The Phase Owner remains responsible for integration and
  acceptance.
- Add or adjust focused browser/unit tests and repair adjacent regressions found
  while verifying this phase.

## Stop Conditions

- A fix requires changing locked game rules, product identity, or settled
  architecture.
- Completion requires external credentials, production-data mutation, deployment,
  spending, pushing, or another outward/irreversible action.
- Existing unrelated changes conflict with the phase work and cannot be preserved.

## Exclusions

- Do not change the primary landing CTA or shorten the path to the first decision
  in this phase. Record this as a deferred action item to revisit after more
  behavioral playtest data.
- Do not seed artificial official leaderboard results.
- Do not redesign modes or scoring.

## Acceptance Criteria

1. Scenario and reveal text render normal Unicode punctuation with no mojibake in
   the active player journey; add regression coverage at the owning data/UI
   boundary.
2. Settings switches use stable preference names compatible with their checked
   state, and focused accessibility verification passes.
3. Guest Classic entry explains before a run that guest results are unofficial
   and what signing in enables, using concise game-like copy.
4. Empty competitive leaderboards provide an inviting contextual empty state and
   an appropriate path to play, without fake entries.
5. Locking a valid decision transitions directly to the result reveal; the
   redundant `Call locked` / `Reveal Result` confirmation step is removed while
   double-submission protection, reveal privacy, and scoring remain correct.
6. Every app page has a keyboard-usable skip-to-content link and a stable main
   landmark target.
7. Rules and Settings remain discoverable on mobile without crowding the four-item
   primary navigation; the owner may choose the smallest coherent UI treatment.
8. At approximately 375px, landing, mode selection, Classic setup, one complete
   decision/reveal cycle, Settings, and an empty leaderboard have no horizontal
   overflow or bottom-navigation obstruction and satisfy the changed behavior.
9. The deferred direct-to-first-decision funnel idea is recorded in the phase
   closeout or current-state action items, but not implemented.

## Final Verification

```powershell
pnpm test
pnpm typecheck
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web test:browser
```

Run focused tests first. If the browser script name differs, discover and run the
repository's current integrated browser suite. Perform an interactive mobile
browser check for the changed journeys.

## Closeout

When all criteria pass, update `progress.md` current state and write one concise
closeout in `agents/phase-closeouts/`. Do not create internal handoffs or reports.
