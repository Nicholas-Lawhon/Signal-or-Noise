# H021 - Gate 2 Offline Harness and Payload Export

**Role:** Implementor
**Phase:** 4 Part A - Content rules & validator hardening
**Status:** approved
**Model:** grok-4.5
**Risk:** high (production content-pipeline validation)
**Audit:** required before Part A close; orchestrator review + cheap verification before commit
**Depends on:** C003, D031, D032, H020
**Estimated scope:** medium-large - multi-module content validator infrastructure, schema update, CLI export/check helpers, and tests; no model API integration
**Context budget:** medium - exact content-pipeline docs/artifacts and package files only
**Output budget:** completion report <= 1,000 words

## Context

Phase 4 Part A needs the last unautomated D019/D022 layer: Gate 2 guessability. C003 designed the mechanism, D031 resolved that Grok 4.5 is the pinned judge, D032 resolved that model judgment runs through the existing role-agent workflow/SuperGrok usage rather than xAI API tokens, and H020 cleaned likely-guess metadata so model top-5 overlap warnings can be meaningful.

This handoff implements the deterministic repo-owned parts only: payload rendering, hashing, result schema, offline evaluation, and payload export. It must **not** call xAI, require `XAI_API_KEY`, or populate active-card Gate 2 results itself. A later blind Grok judge handoff will consume exported payloads that exclude company/reveal data and write raw `review.gate2` results.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D019, D022, D024, D026, D027, D031, D032
- Docs: `docs/09_content_and_round_creation.md` sections "Gate 1 - Whole-Card Guessability Review", "Gate 2 - The Guessability Test", "Human Review Checklist", and "Scenario Validation Checklist"
- Prior artifacts: `agents/consultations/C003_automated_guessability_check.md` sections Q1-Q7, "Spec for the Implementation Handoff", and "Decision Points for the Orchestrator"; `agents/reports/R017_H020.md`
- Source files: `packages/content/package.json`, `packages/content/src/schema.ts`, `packages/content/src/types.ts`, `packages/content/src/validation.ts`, `packages/content/src/validate.ts`, `packages/content/src/loadScenarios.ts`, `packages/content/tests/validation.test.ts`, `packages/content/scenarios/active/*.json`
- Commands for discovery: `rg -n "gate2|LikelyGuesses|review:" packages/content`

If broader context seems necessary, stop and log the requested expansion under Blocked/Questions instead of reading unrelated history.

## Task Framing (micro-role)

You are implementing the offline half of a fail-closed content gate. Keep all model judgment outside this handoff so the eventual judge remains blind. Prefer pure modules with offline tests, and keep Node-only CLI helpers out of package-root/browser exports.

## Objective

Implement Gate 2 storage, payload rendering/hash, offline threshold evaluation, and a Node-only CLI that exports blind pre-decision payloads for a later Grok judge handoff and checks any stored results already present. Keep default validation/test/typecheck fully offline and green while active seeds do not yet have real `review.gate2` results.

## Prescriptive Instructions

1. Add config and stored-result types.
   - Add `packages/content/src/gate2/config.ts` with:
     - `GATE2_MODEL = 'grok-4.5'`
     - `GATE2_PROMPT_VERSION = 'guess.v1+direction.v1'`
     - threshold config from C003/D031:
       - Easy: correct rank 1-3 pass, rank 4-5 warn, absent fail.
       - Medium: fail if correct is #1 with confidence >= 40, or correct leads #2 by >= 15 points.
       - Hard: fail if correct appears in top 5 with confidence >= 15.
       - Plausible guess floor: confidence >= 10 with a pointing fact; WARN-only.
       - Direction: WARN if `long` or `short` confidence >= 65; never block in this handoff.
   - Extend `packages/content/src/types.ts` and `schema.ts` with optional `review.gate2` entries for `easy`, `medium`, and `hard`.
   - Gate 2 stored shape per variant:
     - `payloadHash`, `model`, `promptVersion`, `testedAt`
     - `guesses`: exactly 5 `{ company, confidence, pointingFact }`
     - `direction`: `{ call: 'long' | 'short' | 'toss_up', confidence, cue }`
   - Do not make `review.gate2` required by Zod shape; requirement/enforcement is a business rule for a later handoff after blind results exist.

2. Add pure payload rendering and hashing.
   - Add `packages/content/src/gate2/payload.ts`.
   - `renderVariantPayload(scenario, difficulty)` must include exactly the pre-decision payload: title, `era`, `decisionDateLabel`, `holdingPeriodLabel`, variant `companyDescription`, `macroContext`, `situation`, `longCase`, `shortCase`, `setupHints`, and normalized `marketData.lookbackPrices` indexed to first value = 100 with one decimal.
   - Exclude reveal-side fields, company name/ticker, outcome labels/data, sources, and review metadata.
   - `hashVariantPayload(payload)` returns `sha256:<hex>` over canonical JSON.

3. Add pure offline evaluation.
   - Add `packages/content/src/gate2/evaluate.ts`.
   - Match correct guesses by normalizing lowercase alphanumeric strings against `company.name`, `company.ticker`, and `company.acceptedNames`.
   - Recompute thresholds offline from stored raw results and current config; do not store pass/fail verdicts in JSON.
   - Return findings as `{ severity: 'error' | 'warning'; path; message }`.
   - Include WARN when model top-5 has zero overlap with the relevant `review.*LikelyGuesses` list.
   - Direction findings are warnings only.

4. Add Node-only Gate 2 CLI helpers, no model calls.
   - Add `packages/content/src/gate2/run.ts` plus `packages/content/src/runGate2.ts`.
   - Add package script: `"gate2": "tsx src/runGate2.ts"`.
   - CLI commands:
     - `pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H022_payloads.json`
     - `pnpm --filter @signal-or-noise/content gate2 -- check`
   - `export` writes a blind payload file containing scenario id, difficulty, payload hash, and rendered payload only. It must not include company name, ticker, accepted names, reveal text, actual return, ending price, outcome chart, sources, or review notes.
   - Default export target is reviewed/active scenarios. Support `--id <scenarioId>` and `--include-draft`.
   - `check` evaluates any stored `review.gate2` results already present and reports missing/stale/wrong-pin/failing/warning findings, but must not fail active seeds solely for missing Gate 2 results yet. Missing-result fail-closed enforcement lands after blind results are written.
   - The CLI may create an `agents/gate2/` directory for exported payloads. Keep generated payload files uncommitted unless the handoff explicitly says otherwise.

5. Add validation integration without breaking current active seeds.
   - Add `checkGate2StoredResults` in `validation.ts` or a small imported helper.
   - For any scenario/difficulty that already has a `review.gate2` entry, validate payload hash, model, prompt version, and threshold evaluation offline.
   - Errors for stale/wrong-pin/identity-threshold-failing stored results should fail validation.
   - Warnings from stored results should surface as validation warnings.
   - Missing Gate 2 entries should **not** fail validation in H021. The fail-closed missing-result rule belongs to the follow-up enforcement handoff after H022 writes blind results.
   - `pnpm --filter @signal-or-noise/content validate` must remain fully offline and must never import a model/client module.

6. Add tests.
   - Add `packages/content/tests/gate2-payload.test.ts` for field inclusion/exclusion, normalized lookback, hash stability, hash changes on pre-decision edits, and hash unchanged on reveal edits.
   - Add `packages/content/tests/gate2-evaluate.test.ts` for Easy pass/warn/fail, Medium fail cases, Hard fail/pass, likely-guess-overlap warning, and direction warning.
   - Extend validation tests for stored stale hash fails, wrong model/prompt fails, stored failing Gate 2 result fails active validation, draft missing Gate 2 still passes, and active missing Gate 2 still passes in H021.
   - Add CLI/export tests if the local test pattern makes that practical without brittle filesystem setup; otherwise verify with the command below and report the generated file path.

7. Export blind payloads for the next judge handoff.
   - Run `pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H022_payloads.json`.
   - Inspect the exported file and confirm it contains no forbidden answer/reveal fields.
   - Leave `agents/gate2/H022_payloads.json` uncommitted if it is large, but include its path and a short summary in R019. If it is small and useful as the next handoff artifact, it may be left uncommitted for orchestrator review.

## Do NOT

- Do not call xAI, add `XAI_API_KEY`, add an xAI/OpenAI SDK, or require API tokens.
- Do not populate real `review.gate2` results in active scenario JSON in this handoff.
- Do not generate or rewrite scenario hidden-card/reveal prose to make Gate 2 pass.
- Do not make default `validate`, `test`, `typecheck`, or web build require a network call.
- Do not make missing Gate 2 entries fail validation yet; that enforcement waits until blind results exist.
- Do not export Node-only loader/CLI modules from `packages/content/src/index.ts`.
- Do not add database/auth/web-app/mobile work.
- Do not edit `soul.md`, `roadmap.md`, or `decisions.md`.
- Do not build anything on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `review.gate2` schema/types exist and accept valid stored raw Gate 2 results while remaining optional.
2. Payload rendering excludes answer/reveal fields and hashing behaves as specified, covered by tests.
3. Offline evaluator implements D031 thresholds and warning semantics, covered by tests.
4. `pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H022_payloads.json` produces blind payloads for all active scenario variants.
5. `pnpm --filter @signal-or-noise/content gate2 -- check` runs offline and reports current missing results without failing solely because active seeds are not populated yet.
6. `pnpm --filter @signal-or-noise/content validate` passes offline for current active seeds.
7. `pnpm --filter @signal-or-noise/content test` passes with the new Gate 2 tests.
8. `pnpm test` passes from repo root.
9. `pnpm typecheck` passes from repo root.
10. `rg -n "XAI_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|gate2/client|node:fs|node:path|node:url" packages/content/src/index.ts packages/content/src/gate2 apps/web` shows no model API key/client usage and no Node-only imports in browser-facing paths. Node imports are allowed only in CLI/load modules; justify any hits in the report.

## Verification Steps for the Executor

Run from repo root:

```powershell
pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H022_payloads.json
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
rg -n "XAI_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|gate2/client|node:fs|node:path|node:url" packages/content/src/index.ts packages/content/src/gate2 apps/web
git status --short
```

Inspect `agents/gate2/H022_payloads.json` manually before reporting: it must not contain company names, tickers, accepted names, reveal text, actual return, ending price, outcome chart, sources, or review metadata.

## Reporting

On completion: set Status to `complete`, append a concise session entry to `progress.md`, and write a completion report to `agents/reports/R019_H021.md` per `agents/reports/TEMPLATE.md`.

**Do NOT commit or push anything** - the orchestrator reviews your report and uncommitted diff, then commits on approval (decision D012).

If blocked: set Status note, log the question in `progress.md` Blocked/Questions, and stop.
