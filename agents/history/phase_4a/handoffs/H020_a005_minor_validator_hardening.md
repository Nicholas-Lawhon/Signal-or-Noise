# H020 - A005 MINOR Validator Hardening

**Role:** Implementor
**Phase:** 4 Part A - Content rules & validator hardening
**Status:** complete
**Model:** grok-4.5
**Risk:** high (production content-pipeline validation)
**Audit:** required before Part A close; orchestrator review + cheap verification before commit
**Depends on:** H018, C003, D031
**Estimated scope:** medium - focused content-package validator hardening plus active seed metadata cleanup
**Context budget:** medium - needs A005 findings, C003/D031 resolution, and the content package source/tests/seeds only
**Output budget:** completion report <= 800 words

## Context

Phase 4 Part A is hardening content quality before scenario generation at scale. H018 closed A005 MAJORs 1-3 and MINOR-3. This handoff closes the remaining A005 MINORs that do not require the automated Gate 2 model call: calendar-valid dates, price/return internal consistency, and likely-guess list quality.

Do not implement the Gate 2 model harness in this handoff. D031 resolves that future Gate 2 implementation will use Grok 4.5 as both executor and judge, and this handoff should prepare useful likely-guess metadata for that later overlap check.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D019, D022, D024, D026, D027, D031
- Docs: `docs/09_content_and_round_creation.md` sections "Gate 1 - Whole-Card Guessability Review", "Gate 2 - The Guessability Test", "Human Review Checklist", and "Scenario Validation Checklist"
- Prior artifacts: `agents/audits/A005_H015-H016.md` sections "Findings" and "Notes for Orchestrator"; `agents/consultations/C003_automated_guessability_check.md` sections "Q2 - Pass/fail semantics" and "Decision Points for the Orchestrator"
- Source files: `packages/content/src/schema.ts`, `packages/content/src/types.ts`, `packages/content/src/validation.ts`, `packages/content/tests/validation.test.ts`, `packages/content/scenarios/active/*.json`, `packages/content/package.json`
- Commands for discovery: `rg -n "LikelyGuesses|isoDate|actualReturnPercent|lookbackPrices|outcomePrices" packages/content`

If broader context seems necessary, stop and log the requested expansion under Blocked/Questions instead of reading unrelated history.

## Task Framing (micro-role)

You are tightening content validator business rules. Favor small pure helpers and explicit tests over broad schema rewrites. Keep the package browser-safe: Node-only loaders stay out of `src/index.ts`.

## Objective

Close A005 MINOR-1, MINOR-2, and MINOR-4 by adding offline validation checks and tests in `packages/content`, and update the six active prototype seeds so they pass the new rules.

## Prescriptive Instructions

1. Add calendar-date validity for every ISO date field already shaped as `YYYY-MM-DD`.
   - Reject impossible dates such as `2009-13-45`, `2020-02-30`, and malformed rollover dates.
   - Keep zero-padded `YYYY-MM-DD` strings as the accepted format.
   - Either implement this in `schema.ts` with a shared refined date schema, or in `validation.ts` as a business rule; choose the smaller clean change.

2. Add price/return internal-consistency checks in `validation.ts`.
   - Compute expected decimal return as `(endingPrice - startingPrice) / startingPrice`.
   - Error when `actualReturnPercent` differs from expected by more than `0.01` absolute tolerance.
   - Error when the last `lookbackPrices` value and first `outcomePrices` value differ by more than `0.05` absolute tolerance.
   - Keep the existing whole-percent-looking guard (`abs(actualReturnPercent) >= 20`) intact.
   - Do not add market-data sourcing or external price lookup.

3. Add likely-guess quality rules for `reviewed` and `active` scenarios only.
   - Easy must list at least 2 likely guesses.
   - Medium must list 2-4 likely guesses.
   - Hard must list at least 4 likely guesses.
   - Each likely guess must look like a named company or accepted company name, not a generic peer bucket. Reject placeholder phrases containing generic group words such as `peers`, `retailers`, `companies`, `sector`, `industry`, `competitors`, `infrastructure`, or `players` unless the string also contains a specific company name. Keep this conservative and test-driven.
   - Draft/inactive/archived scenarios are exempt from blocking likely-guess errors.

4. Update the six active scenario JSON files so they pass the new likely-guess rules.
   - Replace placeholder Hard lists like `"semiconductor peers"` with at least four named plausible companies.
   - Keep changes limited to `review.*LikelyGuesses` unless a seed fails the new price/return tolerance and needs a numeric correction.
   - Do not polish hidden-card copy or reveal copy in this handoff.

5. Add focused Vitest coverage in `packages/content/tests/validation.test.ts`.
   - Impossible calendar date fails.
   - Return mismatch fails.
   - Lookback/outcome continuity mismatch fails.
   - Active Hard likely guesses with a generic placeholder fail.
   - Active likely-guess count failure fails.
   - Draft with placeholder likely guesses remains non-blocking.
   - Existing passing sample still passes after seed updates.

6. Keep public exports intentional.
   - If you add helpers that should stay internal, do not export them from `packages/content/src/index.ts`.
   - Do not introduce Node-only imports into package-root exports.

## Do NOT

- Do not implement the Gate 2 API client, model calls, `gate2` CLI, `review.gate2` schema, or any network-dependent validation.
- Do not add new dependencies unless a standard-library or existing Zod/Vitest approach is genuinely insufficient.
- Do not touch `apps/web`, `packages/game-engine`, database/auth/leaderboard code, or `apps/mobile`.
- Do not alter scoring math, scenario hidden-card prose, reveal prose, or source URLs.
- Do not edit `soul.md`, `roadmap.md`, or `decisions.md`.
- Do not build anything on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `pnpm --filter @signal-or-noise/content test` passes and includes tests proving invalid calendar dates, return mismatches, chart continuity mismatches, and bad likely-guess metadata fail.
2. `pnpm --filter @signal-or-noise/content validate` passes for all six active scenarios with zero errors.
3. `pnpm test` passes from the repo root.
4. `pnpm typecheck` passes from the repo root.
5. `rg -n "\".*peers\"|\".*retailers\"|\".*companies\"|\".*sector\"|\".*industry\"|\".*competitors\"|\".*players\"" packages/content/scenarios/active` returns no likely-guess placeholder hits.
6. `git diff -- packages/content/src/index.ts` is empty, or any diff is justified in the report and does not export Node-only code.

## Verification Steps for the Executor

Run from repo root:

```powershell
pnpm --filter @signal-or-noise/content test
pnpm --filter @signal-or-noise/content validate
pnpm test
pnpm typecheck
rg -n "\".*peers\"|\".*retailers\"|\".*companies\"|\".*sector\"|\".*industry\"|\".*competitors\"|\".*players\"" packages/content/scenarios/active
```

The final `rg` command should return no output. If it returns hits outside likely-guess arrays, inspect them before treating it as failure.

## Reporting

On completion: set Status to `complete`, append a concise session entry to `progress.md`, and write a completion report to `agents/reports/R017_H020.md` per `agents/reports/TEMPLATE.md`.

**Do NOT commit or push anything** - the orchestrator reviews your report and uncommitted diff, then commits on approval (decision D012).

If blocked: set Status note, log the question in `progress.md` Blocked/Questions, and stop.
