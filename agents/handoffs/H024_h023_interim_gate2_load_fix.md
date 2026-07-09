# H024 - Interim Gate 2 Load Fix

**Role:** Implementor
**Phase:** 4 Part A - Content rules & validator hardening
**Status:** complete
**Model:** grok-4.5
**Risk:** high (content validation boundary and web build stability)
**Audit:** orchestrator review + cheap verification before commit
**Depends on:** H023, R022, R023
**Estimated scope:** small - load-boundary/test adjustments only; no content rewrite
**Context budget:** small - review note, active-scenario loader, validation tests, current failing results
**Output budget:** report <= 700 words

## Context

H023 wrote honest blind Gate 2 results into active scenario JSON. Those raw
results show the six current active seeds fail medium/hard identity thresholds,
which is useful content-quality evidence. However, storing failing results on
active JSON now breaks the web build and default tests because app/runtime fixture
loading uses full validation.

This handoff is an interim load-boundary fix only. Keep `validate` and
`gate2 check` failing loudly on the stored results; restore `pnpm build` and
`pnpm test` so the repo remains usable while a later content rewrite handoff fixes
the cards.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D024, D031, D032
- Docs: none
- Prior artifacts: `agents/reports/R022_H023.md`, `agents/reports/R023_R022_review.md`
- Source files:
  - `packages/content/src/validation.ts`
  - `packages/content/src/activeScenarios.ts`
  - `packages/content/tests/validation.test.ts`
  - `packages/content/scenarios/active/*.json`
  - `apps/web/lib/sampleScenarios.ts`
- Commands for discovery:
  - `rg -n "validateScenarioOrThrow|validateScenario\\(|getActiveScenarios|skipGate2|gate2" packages/content/src packages/content/tests apps/web`

If broader context seems necessary, stop and log the requested expansion under
Blocked/Questions.

## Objective

Preserve the H023 stored raw Gate 2 results while restoring the default build and
test workflow. App fixture loading and tests that need a structurally valid
sample scenario may bypass Gate 2 stored-result checks explicitly with
`skipGate2`; content gate commands must continue to fail until the cards are
rewritten.

## Prescriptive Instructions

1. Make active scenario fixture loading explicit.
   - Update `packages/content/src/activeScenarios.ts` so active scenarios are
     loaded with structural/business validation but skip stored Gate 2 result
     threshold checks.
   - Prefer extending `validateScenarioOrThrow(input, options)` to accept the
     existing `ValidateScenarioOptions`, then call it with
     `{ skipGate2: true }`.
   - Add a comment explaining this is an interim prototype load path while
     failing H023 raw results drive content rewrite work; `validate` /
     `gate2 check` remain the authoritative content gates.

2. Repair unit tests without hiding the gate.
   - Update only tests that need a structurally valid active fixture to call
     `validateScenario(..., { skipGate2: true })` or
     `validateScenarioOrThrow(..., { skipGate2: true })`.
   - Keep tests that assert stored Gate 2 failures fail full validation.
   - Do not delete the H021/H022 Gate 2 failure tests.

3. Preserve content evidence.
   - Do not edit any `review.gate2` stored result values except if formatting
     changes are unavoidable.
   - Do not rewrite scenario hidden-card prose, likely guesses, reveal, market
     data, sources, or thresholds.
   - Do not make missing/failing Gate 2 validation non-blocking for
     `pnpm --filter @signal-or-noise/content validate` or `gate2 check`.

4. Update state.
   - Set this handoff status to `complete`.
   - Append a concise session entry to `progress.md`.
   - Write `agents/reports/R024_H024.md`.

## Do NOT

- Do not change D031 thresholds.
- Do not remove or alter H023 blind judgment raw results.
- Do not rewrite scenario content.
- Do not make `validate` or `gate2 check` pass by skipping Gate 2 globally.
- Do not add APIs, SDKs, auth, database, mobile, or anything on the MVP exclusion list.
- Do not edit `soul.md`, `roadmap.md`, or `decisions.md`.
- Do not commit or push.

## Acceptance Criteria

1. `pnpm build` passes.
2. `pnpm --filter @signal-or-noise/content test` passes.
3. `pnpm test` passes.
4. `pnpm typecheck` passes.
5. `pnpm --filter @signal-or-noise/content validate` still fails on the current
   active seeds with Gate 2 identity errors.
6. `pnpm --filter @signal-or-noise/content gate2 -- check` still fails with
   stored-result Gate 2 errors and 0 missing variants.
7. `git diff -- packages/content/scenarios/active` shows no changes beyond the
   existing H023 `review.gate2` additions.

## Verification Steps for the Executor

Run from repo root:

```powershell
pnpm build
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
git diff -- packages/content/scenarios/active
git status --short
```

For the expected failing commands, report counts and confirm failures are Gate 2
identity results from H023, not stale hash/schema/import/runtime errors.

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R024_H024.md` per
`agents/reports/TEMPLATE.md`.

**Do NOT commit or push anything** - the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).

If blocked: set Status note, log the question in `progress.md` Blocked/Questions,
and stop.
