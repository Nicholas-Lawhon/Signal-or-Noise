# H028 - Blind Gate 2 Rejudge for H027 Payloads

**Role:** Content Curator
**Phase:** 4 Part A - Content rules & validator hardening
**Status:** approved
**Model:** grok-4.5
**Risk:** high (production content-pipeline validation and scenario metadata)
**Audit:** orchestrator review + cheap verification before commit
**Depends on:** H027, R032
**Estimated scope:** medium - blind model judgment over 18 payloads plus JSON write-back
**Context budget:** small - blind payloads and schema shape only; do not read answer/reveal sources
**Output budget:** report <= 1,000 words

## Context

H027 rewrote the failing Hard variants and used the shared-label exception on
all six active seeds. Because title, era, and/or decision-date labels changed,
all previous stored Gate 2 results are stale and were removed. The fresh export
at `agents/gate2/H027_payloads.json` contains 18 payloads: Easy, Medium, and
Hard for all six active scenarios.

This handoff supplies the missing blind model judgments for all 18 H027 payloads.
Use only the exported pre-decision payloads during the blind judging pass. Do not
read active scenario JSON or any answer/reveal/source data until all 18 judgments
are complete in working notes.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D024, D031, D032
- Docs: none
- Prior artifacts:
  - `agents/reports/R031_H027.md`
  - `agents/reports/R032_R031_review.md`
- Source files:
  - `agents/gate2/H027_payloads.json`
  - `packages/content/src/gate2/config.ts`
  - `packages/content/src/schema.ts` only for the `review.gate2` shape
  - `packages/content/scenarios/active/*.json` only after all blind judgments are complete, and only to write `review.gate2.easy|medium|hard`
- Commands for discovery:
  - `rg -n "gate2|GATE2_MODEL|GATE2_PROMPT_VERSION" packages/content/src`

Do not read scenario JSON files, source URLs, reveal text, company metadata,
review fact banks, or likely-guess lists before finishing and recording all 18
blind judgments. If broader context seems necessary, stop and log the requested
expansion under Blocked/Questions.

## Task Framing

You are acting as the blind Gate 2 judge and metadata writer. First judge the
payloads exactly as a strong player would see them; only after all judgments are
recorded should you open scenario JSON for mechanical write-back.

## Objective

For each exported payload entry in `agents/gate2/H027_payloads.json`, produce the
raw Gate 2 result required by the schema and write it into the matching active
scenario JSON under `review.gate2.easy`, `review.gate2.medium`, or
`review.gate2.hard`. Preserve scenario content exactly.

## Prescriptive Instructions

1. Blind judging pass.
   - Open `agents/gate2/H027_payloads.json`.
   - Judge all 18 entries: 6 Easy, 6 Medium, 6 Hard.
   - For each entry, use only `payload`, `difficulty`, and `payloadHash`.
   - Record exactly 5 company guesses:
     - `company`: best guess company name, not ticker-only when avoidable.
     - `confidence`: integer 0-100.
     - `pointingFact`: a short payload-based fact that supports the guess.
   - Record direction:
     - `call`: `long`, `short`, or `toss_up`.
     - `confidence`: integer 0-100.
     - `cue`: a short payload-based cue.
   - Use `model: "grok-4.5"` and `promptVersion: "guess.v1+direction.v1"`.
   - Use one consistent ISO timestamp for this run's `testedAt`.

2. Only after all 18 blind results are written in your working notes, open the
   active scenario JSON files and write results under:
   - `review.gate2.easy`
   - `review.gate2.medium`
   - `review.gate2.hard`
   keyed by each entry's `scenarioId` and `difficulty`.

3. Preserve JSON structure and scenario content.
   - Do not rewrite hidden-card prose, title, era, dates, review likely guesses,
     fact banks, market data, sources, or reveal content.
   - Do not change payload hashes from the export.
   - Keep each `guesses` array exactly length 5.

4. Run validation.
   - Run `pnpm --filter @signal-or-noise/content validate`.
   - Run `pnpm --filter @signal-or-noise/content gate2 -- check`.
   - Run `pnpm --filter @signal-or-noise/content test`.
   - Run `pnpm test` and `pnpm typecheck`.
   - If validation/check fails because the blind results make a card too
     identifiable or too vague, do not rewrite card content in this handoff.
     Leave the stored raw results, report the failures, and stop for
     orchestrator review.

## Do NOT

- Do not read active scenario JSON, source URLs, reveal text, company metadata,
  review fact banks, likely-guess lists, or outcome data before completing all
  18 blind judgments.
- Do not call external APIs or add SDKs/API keys.
- Do not edit scenario content, market data, sources, reveal copy, review notes,
  fact banks, likely guesses, validators, schemas, app code, `soul.md`,
  `roadmap.md`, or `decisions.md`.
- Do not make missing Gate 2 entries fail validation.
- Do not build anything on the MVP exclusion list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. All six active scenarios have stored `review.gate2.easy`,
   `review.gate2.medium`, and `review.gate2.hard` entries.
2. Every new entry uses `model: "grok-4.5"` and
   `promptVersion: "guess.v1+direction.v1"`.
3. Every new entry's `payloadHash` matches the exported
   `H027_payloads.json` entry for that scenario/difficulty.
4. Every new entry has exactly 5 guesses and one direction object matching the
   schema.
5. No scenario content, market data, sources, review notes, likely guesses, fact
   banks, or reveal prose changes except adding `review.gate2.easy|medium|hard`.
6. `pnpm --filter @signal-or-noise/content validate` runs and the result is
   reported.
7. `pnpm --filter @signal-or-noise/content gate2 -- check` runs and the result
   is reported, including error/warning/missing counts.
8. `pnpm --filter @signal-or-noise/content test`, `pnpm test`, and
   `pnpm typecheck` run and are reported.

## Verification Steps for the Executor

Run from repo root:

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
git diff -- packages/content/scenarios/active
git status --short
```

Confirm the active-scenario diff only adds `review.gate2.easy|medium|hard`
entries and does not alter card content, review metadata, market data, sources,
or reveal content.

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R034_H028.md` per
`agents/reports/TEMPLATE.md`.

**Do NOT commit or push anything** - the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).

If blocked: set Status note, log the question in `progress.md` Blocked/Questions,
and stop.
