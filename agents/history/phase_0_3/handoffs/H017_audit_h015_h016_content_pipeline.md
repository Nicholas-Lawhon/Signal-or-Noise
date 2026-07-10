# H017 — Audit H015/H016 Phase 3 Content Pipeline

**Role:** Auditor
**Phase:** 3 — Scenario Schema & Content Pipeline audit
**Status:** approved
**Model:** gpt-5.5
**Risk:** high
**Audit:** n/a — this handoff is the required audit
**Depends on:** H015, H016, R011, R012
**Estimated scope:** medium — formal audit of content validator, schema, sample seeds, web integration, and build safety

## Context

H015 implemented the Phase 3 content pipeline: `@signal-or-noise/content`, Zod
scenario schema, validation API/CLI, content tests, six active JSON sample
scenarios, and a web integration that loads Classic Run scenarios from the
content package. H016 fixed a production build blocker by removing Node-only
filesystem loader exports from the package root and wrapping the Classic Run page
client in `Suspense` for Next's `useSearchParams` requirement.

This audit is required because H015/H016 touch the production content validation
domain. The sample scenarios are prototype-grade and not human-reviewed
production content, so do not fail the audit merely because they have placeholder
sources or have not passed doc 09 Gate 1/Gate 2. Do fail literal pre-decision
leaks, schema/validator gaps against the handoff, web build breakage, or
violations of locked rules.

## Task Framing (micro-role)

For this task, act as a content-pipeline and anti-leakage auditor. Focus on
whether the schema/validator actually enforces D019/D026, whether the web app
uses JSON-backed content safely, and whether the build/test/validation path is
sound on Windows. Do not fix code.

## Objective

Produce `agents/audits/A005_H015-H016.md` with a PASS / PASS WITH FINDINGS / FAIL
verdict for H015+H016.

## Prescriptive Instructions

1. Read, in order:
   - `soul.md`
   - `AGENTS.md`
   - `decisions.md` entries D019, D022, D024, D025, D026
   - `docs/09_content_and_round_creation.md`
   - `docs/06_data_model.md`
   - `agents/handoffs/H015_phase3_scenario_schema_content_pipeline.md`
   - `agents/handoffs/H016_h015_build_fix.md`
   - `agents/reports/R011_H015.md`
   - `agents/reports/R012_H016.md`
   - `progress.md`

2. Inspect the relevant diff and files:
   - `packages/content/src/schema.ts`
   - `packages/content/src/validation.ts`
   - `packages/content/src/loadScenarios.ts`
   - `packages/content/src/validate.ts`
   - `packages/content/src/index.ts`
   - `packages/content/src/activeScenarios.ts`
   - `packages/content/tests/validation.test.ts`
   - `packages/content/scenarios/active/*.json`
   - `apps/web/lib/sampleScenarios.ts`
   - `apps/web/app/play/classic/run/page.tsx`
   - `apps/web/app/play/classic/page.tsx`

3. Run required commands from repo root:

   ```powershell
   pnpm build
   pnpm typecheck
   pnpm test
   pnpm --filter @signal-or-noise/content validate
   rg -n "from './loadScenarios'|loadAllScenarioFiles|getScenariosRoot" packages/content/src/index.ts
   rg -n "clues:" apps packages
   rg -n "Long case|Short case" apps
   rg -n "node:fs|node:path|node:url" packages/content/src apps/web
   ```

   Expected:
   - first four commands pass.
   - package-root `loadScenarios` grep has no output.
   - `clues:` grep has no current app/package source hits.
   - `Long case|Short case` grep has no app hits.
   - `node:*` hits are allowed only in `packages/content/src/loadScenarios.ts`.

4. Validate H015 acceptance criteria literally:
   - real content package exists
   - seed folders exist
   - at least five active JSON scenarios exist
   - active samples validate
   - invalid-card tests cover company name, ticker, identity-banned term,
     setup-hint counts, whole-percent return, invalid dates, and warnings
   - web app loads from JSON-backed content package, not an in-app hardcoded array
   - Classic Run renders `Signal or Noise?`, `Why it might work`, and
     `What could break`

5. Validate H016 acceptance criteria literally:
   - build passes
   - root package export is bundle-safe
   - CLI still imports filesystem loader directly and works
   - web import still uses `@signal-or-noise/content`

6. Validator adversarial review:
   - Confirm hidden text scanned for leaks includes title, all variant text
     fields, and `setupHints`.
   - Confirm reveal fields and company metadata may contain company/ticker names.
   - Confirm return decimal guard rejects values like `1135.6` but allows
     `11.356`.
   - Confirm date comparisons are valid for ISO date strings used by schema.
   - Confirm warnings do not fail validation.
   - Identify any high-risk validator blind spots as MAJOR or BLOCKER depending
     on whether they violate H015/D019/D026 acceptance.

7. Content-leakage scan:
   - For each active sample scenario, inspect hidden pre-decision fields only:
     `scenario.title`, `companyDescription`, `macroContext`, `situation`,
     `longCase`, `shortCase`, and `setupHints`.
   - Check for literal company name, ticker, founder/CEO names, unmistakable
     product names/slogans, and entries from `identityBannedTerms`.
   - Do not run full model-based Gate 1/Gate 2 guessability for these prototype
     sample seeds unless you see a severe obvious leak. Note prototype content
     quality risks separately.

8. Locked-rule spot checks:
   - `actualReturnPercent` is decimal.
   - No database/auth/Daily Challenge/leaderboard/admin/mobile scope was added.
   - Scoring/game-engine math was not changed by H015/H016 except already-approved
     D025 round lengths from H014.
   - UI labels do not map Signal/Noise to one side.

9. Write audit file:
   `agents/audits/A005_H015-H016.md`
   using the Auditor role format.

10. Add a one-line session entry to `progress.md` pointing at A005.

## Do NOT

- Fix code or edit implementation files.
- Re-run or require full production Gate 1/Gate 2 content polishing for the six
  prototype sample seeds.
- Commit or push.
- Expand scope into database/auth/Daily Challenge/leaderboards.
- Anything on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `agents/audits/A005_H015-H016.md` exists and follows the audit report format.
2. The audit includes a command/results table for the required commands.
3. The audit maps H015 and H016 acceptance criteria to pass/fail evidence.
4. The audit includes validator adversarial review findings.
5. The audit includes a content-leakage scan of all active sample scenarios.
6. The audit includes locked-rule spot checks.
7. `progress.md` has an auditor session entry.

## Verification Steps for the Auditor

The audit commands in instruction 3 are mandatory. Include exact pass/fail
outcomes in the report. If a command fails, mark the related acceptance criterion
failed and explain the blocker.

## Reporting

Your audit file is your report. Do not write a separate `agents/reports/` file.
Do not commit or push.
