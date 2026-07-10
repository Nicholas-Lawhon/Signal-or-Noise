# H016 — H015 Build Fix: Bundle-Safe Content Exports

**Role:** Implementor
**Phase:** 3 — Scenario Schema & Content Pipeline fix-up
**Status:** complete
**Model:** grok-4.5
**Risk:** high
**Audit:** required — continues H015 content-pipeline validation domain
**Depends on:** H015, R011 rejection
**Estimated scope:** small — fix content package exports/build failure, no new features

## Context

H015 implemented the content package and web integration, and the required
verification commands mostly pass. However orchestrator review found a production
build blocker:

```powershell
pnpm build
```

fails because `apps/web/lib/sampleScenarios.ts` imports `getActiveScenarios` from
`@signal-or-noise/content`. The package root `packages/content/src/index.ts`
also re-exports `loadScenarios.ts`, which imports Node-only modules
`node:fs`, `node:path`, and `node:url`. Next then tries to bundle those Node-only
modules into the app route import graph.

The fix must make the content package's root export safe for the web bundle while
keeping the filesystem loader available to the validation CLI and tests.

## Objective

Fix the H015 build failure without changing the scenario schema, sample content,
gameplay rules, scoring, or UI behavior.

## Prescriptive Instructions

1. Reproduce the blocker first:

   ```powershell
   pnpm build
   ```

   Confirm the error mentions `node:fs`, `node:path`, or `node:url` through
   `../../packages/content/src/loadScenarios.ts`.

2. Update `packages/content/src/index.ts` so the package root exports only
   browser/bundle-safe APIs:
   - types
   - schemas
   - `validateScenario`
   - `validateScenarioOrThrow`
   - `DIRECTIONAL_SENTIMENT_TERMS`
   - `textContainsTerm`
   - `ACTIVE_SCENARIOS`
   - `getActiveScenarios`

   Do **not** export `loadAllScenarioFiles`, `getScenariosRoot`,
   `ScenarioFolder`, or `LoadedScenarioFile` from `src/index.ts`.

3. Preserve the filesystem loader for the CLI:
   - Keep `packages/content/src/loadScenarios.ts` as the Node-only module.
   - Keep `packages/content/src/validate.ts` importing directly from
     `./loadScenarios`.
   - If tests need the loader later, they can import from `../src/loadScenarios`
     directly.

4. Add this short comment at the top of `loadScenarios.ts`:

   ```ts
   // Node-only helpers for the validation CLI. Do not re-export from the package root.
   ```

5. Do not change JSON scenario content, validation rules, web UI labels, or
   `apps/web/lib/sampleScenarios.ts` unless necessary to resolve the build.

6. Write a new report `agents/reports/R012_H016.md`. Do not rewrite R011 except
   if you need to reference that it was rejected by the orchestrator.

7. Update `progress.md` with an H016 session entry.

## Do NOT

- Reintroduce Node filesystem imports into anything imported by the web app.
- Change scenario schema or validation semantics.
- Change sample scenario JSON content.
- Change scoring math, D025 run lengths, or game-engine code.
- Implement database/auth/Daily Challenge/leaderboards/admin UI.
- Commit or push.
- Anything on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `pnpm build` passes.
2. `pnpm typecheck` passes.
3. `pnpm test` passes.
4. `pnpm --filter @signal-or-noise/content validate` passes.
5. `rg -n "from './loadScenarios'|loadAllScenarioFiles|getScenariosRoot" packages/content/src/index.ts`
   returns no matches.
6. `apps/web/lib/sampleScenarios.ts` still imports from `@signal-or-noise/content`
   and Classic Run still uses JSON-backed scenarios.
7. `agents/reports/R012_H016.md` exists and `progress.md` is updated.

## Verification Steps for the Implementor

Run from repo root:

```powershell
pnpm build
pnpm typecheck
pnpm test
pnpm --filter @signal-or-noise/content validate
rg -n "from './loadScenarios'|loadAllScenarioFiles|getScenariosRoot" packages/content/src/index.ts
```

For the final `rg` command, no output is the expected result.

## Reporting

On completion: set Status to `complete`, append a session entry to `progress.md`,
and write `agents/reports/R012_H016.md` per `agents/reports/TEMPLATE.md`.
**Do NOT commit or push anything** — the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).
If blocked: log the question under Blocked/Questions in `progress.md` and stop.
