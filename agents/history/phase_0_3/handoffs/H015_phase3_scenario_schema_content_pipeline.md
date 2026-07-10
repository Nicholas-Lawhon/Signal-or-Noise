# H015 — Phase 3 Scenario Schema & Content Pipeline

**Role:** Implementor
**Phase:** 3 — Scenario Schema & Content Pipeline
**Status:** complete
**Model:** grok-4.5
**Risk:** high
**Audit:** required — production content-pipeline validation domain; use a different model than Grok
**Depends on:** D019, D022, D024, D026, C002
**Estimated scope:** large — new content package schema/validator/tests, 5+ JSON seeds, and web loading from JSON

## Context

Phase 2 game-engine hardening is complete. Phase 3 now replaces hardcoded
scenario objects with validated JSON content in `packages/content`. D026 approved
the Balanced Tension scenario model: each difficulty variant has
`companyDescription`, `macroContext`, `situation`, `longCase`, `shortCase`, and
difficulty-scaled `setupHints`. The player-facing UI frames those cases under
`Signal or Noise?`, with labels `Why it might work` and `What could break`.

This handoff implements the Phase 3 schema/content pipeline and makes the web app
load scenarios from JSON. It does not create production-quality content at MVP
scale; it creates a validated sample seed set and the tooling future Curator work
will use.

## Task Framing (micro-role)

For this task, act as a schema-and-validation implementor. Prioritize correctness,
clear validation errors, Windows-compatible scripts, and tight scope. Do not make
new product/content decisions. If a rule in this handoff conflicts with `soul.md`,
`decisions.md`, `docs/09_content_and_round_creation.md`, or
`docs/06_data_model.md`, stop and log the conflict in `progress.md`.

## Objective

Create a first-class `@signal-or-noise/content` workspace package with Zod
scenario validation, JSON seed folders, validation tests/script, at least five
schema-valid sample scenarios, invalid-card tests for leakage and hint counts,
and a web integration that loads Classic Run scenarios from the JSON-backed
content package instead of hardcoded scenario objects.

## Prescriptive Instructions

1. Read, in order:
   - `soul.md`
   - `decisions.md` entries D019, D022, D024, D026
   - `docs/09_content_and_round_creation.md`
   - `docs/06_data_model.md`
   - `agents/consultations/C002_scenario_information_design.md`
   - existing `apps/web/lib/sampleScenarios.ts`

2. Create a real content workspace package:
   - `packages/content/package.json`
   - `packages/content/tsconfig.json`
   - `packages/content/vitest.config.ts`
   - `packages/content/src/`
   - `packages/content/tests/`
   - `packages/content/scenarios/draft/`
   - `packages/content/scenarios/reviewed/`
   - `packages/content/scenarios/active/`

   Package name: `@signal-or-noise/content`.
   Required scripts:

   ```json
   {
     "validate": "tsx src/validate.ts",
     "test": "vitest run",
     "typecheck": "tsc --noEmit"
   }
   ```

   Add package dependencies/devDependencies as needed. Use `zod` for validation.
   Use `tsx` for the validation script if you need a TypeScript CLI runner.
   Keep scripts cross-platform.

3. Define TypeScript types and Zod schemas in `packages/content/src/`.
   Suggested file split:
   - `types.ts`
   - `schema.ts`
   - `validation.ts`
   - `index.ts`
   - `validate.ts`

   Use string unions, not TypeScript enums:

   ```ts
   export type ScenarioStatus = 'draft' | 'reviewed' | 'active' | 'inactive' | 'archived';
   export type Difficulty = 'easy' | 'medium' | 'hard';
   ```

4. Scenario JSON shape must follow docs 06/09 and D026. At minimum each scenario
   must include:
   - `id`
   - `status`
   - `company`
     - `name`
     - `ticker`
     - `exchange`
     - `sector`
     - `industry`
     - `country`
     - `acceptedNames`
     - `identityBannedTerms`
   - `scenario`
     - `title`
     - `decisionDate`
     - `endDate`
     - `decisionDateLabel`
     - `outcomeLabel`
     - `holdingPeriodLabel`
     - `era`
     - `eraId`
     - `contentPackIds`
     - `difficultySupported`
   - `marketData`
     - `startingPrice`
     - `endingPrice`
     - `actualReturnPercent` as a decimal (`0.35`, not `35`)
     - `usesSplitAdjustedPrices`
     - `usesTotalReturn`
     - `preDecisionChartStartDate`
     - `preDecisionChartEndDate`
     - `outcomeChartStartDate`
     - `outcomeChartEndDate`
     - `lookbackPrices`
     - `outcomePrices`
   - `hiddenCard.easy`, `hiddenCard.medium`, `hiddenCard.hard`, each with:
     - `companyDescription`
     - `macroContext`
     - `situation`
     - `longCase`
     - `shortCase`
     - `setupHints`
   - `reveal`
     - `shortText`
     - `funFact`
     - `whyItMoved` exactly 3 strings
   - `sources` with at least one URL object
   - `review`
     - `generatedByAi`
     - `humanReviewed`
     - `reviewNotes`
     - `factBank`
     - `easyLikelyGuesses`
     - `mediumLikelyGuesses`
     - `hardLikelyGuesses`

   Keep review metadata simple and useful; do not overbuild a full admin model.

5. Add validation beyond base Zod shape:
   - Require all three difficulty variants.
   - Enforce setup hint counts:
     - Easy: exactly 1
     - Medium: 0 or 1
     - Hard: exactly 0
   - Reject if hidden pre-decision text contains the company name, ticker, any
     accepted name, or any `identityBannedTerms` entry. Hidden text includes:
     title, companyDescription, macroContext, situation, longCase, shortCase,
     and setupHints.
   - Reject if `actualReturnPercent` looks like a whole percent outside normal
     decimal range. Use a conservative guard: absolute value must be `< 20`.
     This allows extreme historical winners like `11.356` while rejecting `1135.6`.
   - Reject if chart date windows are inconsistent:
     - pre-decision chart start <= pre-decision chart end
     - pre-decision chart end <= decision date
     - outcome chart start >= decision date
     - outcome chart end >= outcome chart start
     - decision date < end date
   - Reject empty `lookbackPrices` or `outcomePrices`.
   - Reject missing sources.
   - Reject `reveal.whyItMoved` unless it has exactly 3 bullets.

   Also return warnings for directional-sentiment terms and obvious case
   asymmetry, but warnings should not fail validation yet. Keep the warning list
   small and configurable in code; include terms such as `obvious`, `doomed`,
   `unstoppable`, `exploded`, `disaster`, and `no-brainer`.

6. Validation API requirements:
   - Export `scenarioSchema`.
   - Export `validateScenario(input)` returning a structured result:

     ```ts
     type ValidationIssue = { path: string; message: string };
     type ValidationWarning = { path: string; message: string };
     type ValidationResult =
       | { success: true; scenario: Scenario; warnings: ValidationWarning[] }
       | { success: false; errors: ValidationIssue[]; warnings: ValidationWarning[] };
     ```

   - Export `validateScenarioOrThrow(input): Scenario`.
   - Export helpers to load all JSON scenarios from `scenarios/draft`,
     `scenarios/reviewed`, and `scenarios/active` for the validation CLI.

7. Validation CLI:
   - `pnpm --filter @signal-or-noise/content validate` validates all JSON files
     under `packages/content/scenarios/{draft,reviewed,active}`.
   - Print each file path and whether it passed.
   - Print warnings without failing.
   - Exit with non-zero status if any scenario has errors.

8. Add tests in `packages/content/tests/`.
   Required cases:
   - A valid sample active scenario passes.
   - A hidden field containing the company name fails.
   - A hidden field containing the ticker fails.
   - A hidden field containing an `identityBannedTerms` term fails.
   - Easy with 0 setup hints fails.
   - Hard with 1 setup hint fails.
   - `actualReturnPercent: 1135.6` fails.
   - Invalid date window fails.
   - Directional sentiment terms produce warnings.

9. Add at least five valid sample scenario JSON files under
   `packages/content/scenarios/active/`.
   Use existing prototype scenarios as the starting point; do not do a full
   production research pass. Set `generatedByAi: true` and `humanReviewed: false`.
   Include source URL objects, but mark review notes honestly as prototype/sample
   content when appropriate. The content must still avoid literal leaks and pass
   the automated validator.

10. Export active scenarios from `@signal-or-noise/content`.
    `packages/content/src/index.ts` should export:
    - schema/types/validation APIs
    - `ACTIVE_SCENARIOS`
    - a `getActiveScenarios()` helper

    It is acceptable for `ACTIVE_SCENARIOS` to import the five JSON files
    explicitly. Do not build a dynamic filesystem reader into the web bundle.

11. Update `apps/web` to depend on `@signal-or-noise/content`.
    Then update `apps/web/lib/sampleScenarios.ts` so it no longer contains a
    hardcoded scenario array. It should import active JSON-backed scenarios from
    the content package and map them into the existing `PrototypeScenario` shape
    or rename the local type if you prefer. Keep `buildRunScenarioList(totalRounds)`
    behavior intact: shuffled laps, no repeats until the pool is exhausted, and no
    adjacent repeat at lap boundaries.

12. Update the Classic Run UI to render Balanced Tension fields:
    - Show a section header: `Signal or Noise?`
    - Render `situation`
    - Render `longCase` under player-facing label `Why it might work`
    - Render `shortCase` under player-facing label `What could break`
    - Render `setupHints` if present
    - Do not show labels `Long case`, `Short case`, or map Signal/Noise to either
      side.

    Keep the lookback chart visible, but treat it as context. If a label is added,
    use `Price path into this decision`.

13. Do not implement database, imports into Prisma, auth, Daily Challenge,
    leaderboards, Content Curator production card generation, or 100-card expansion.

14. Update `progress.md` and write report `agents/reports/R011_H015.md`.
    Use the next report number exactly: R011.

## Do NOT

- Change scoring math, confidence levels, Signal Score, bankroll logic, D025 run
  lengths, or game-engine APIs outside content-driven imports.
- Implement Prisma, database import, auth, Daily Challenge, leaderboards, profile,
  or admin UI.
- Create `apps/mobile`.
- Add dynamic AI-generated gameplay content.
- Mark sample scenarios as human-reviewed or production-polished.
- Rename the product or change locked copy/taglines.
- Use bash-only package scripts.
- Use `any` unless justified with a short comment.
- Edit historical handoffs/audits/reports except your own H015 status and R011.
- Anything on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `packages/content` is a real workspace package with Zod schema, validation API,
   tests, and a validation CLI.
2. Seed folders exist: `draft`, `reviewed`, `active`.
3. At least five JSON scenarios exist in `packages/content/scenarios/active/`.
4. All active sample scenarios pass `pnpm --filter @signal-or-noise/content validate`.
5. Invalid-card tests prove company name, ticker, and identity-banned-term leaks
   fail validation.
6. Invalid-card tests prove Easy/Medium/Hard setup hint counts are enforced.
7. Invalid-card tests prove whole-percent returns such as `1135.6` fail.
8. Invalid-card tests prove invalid date windows fail.
9. Directional-sentiment warning test passes.
10. `apps/web` loads Classic Run scenarios from JSON-backed content package, not a
    hardcoded in-app array.
11. Classic Run screen renders `Signal or Noise?`, `Why it might work`, and
    `What could break`.
12. `pnpm typecheck` passes.
13. `pnpm test` passes.
14. `pnpm --filter @signal-or-noise/content validate` passes.
15. `progress.md` has a session entry and `agents/reports/R011_H015.md` exists.

## Verification Steps for the Implementor

Run from repo root:

```powershell
pnpm install
pnpm typecheck
pnpm test
pnpm --filter @signal-or-noise/content validate
rg -n "clues:" apps packages
rg -n "Long case|Short case" apps
```

Expected:
- typecheck passes.
- tests pass.
- content validation passes.
- `rg -n "clues:" apps packages` has no current source hits except historical
  comments/reports if any.
- `rg -n "Long case|Short case" apps` has no hits.

If web runtime behavior changes break in a way typecheck/tests cannot catch, start
`pnpm dev` and do a focused browser check of `/play/classic` and one round at
375px. Otherwise dev-server QA is optional for this handoff.

## Reporting

On completion: set Status to `complete`, append a session entry to `progress.md`
(template at top of that file), and write `agents/reports/R011_H015.md` per
`agents/reports/TEMPLATE.md`.
**Do NOT commit or push anything** — the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).
If blocked: set Status note, log the question in `progress.md` Blocked/Questions,
stop.
