# H023 - Blind Gate 2 Grok Judge Results

**Role:** Content Curator
**Phase:** 4 Part A - Content rules & validator hardening
**Status:** complete
**Model:** grok-4.5
**Risk:** high (production content-pipeline validation and scenario metadata)
**Audit:** orchestrator review + cheap verification before commit
**Depends on:** H021, H022
**Estimated scope:** medium - blind model judgment over 18 exported payloads plus JSON write-back
**Context budget:** small - blind payloads and schema shape only; do not read answer/reveal sources
**Output budget:** report <= 900 words

## Context

H021/H022 implemented the offline Gate 2 harness: payload rendering/hash,
optional `review.gate2`, and `gate2 export|check`. This handoff supplies the
missing blind model judgments. The judge must use only exported pre-decision
payloads in `agents/gate2/H022_payloads.json`, not the scenario JSON files, so it
does not see company names, tickers, reveal text, actual returns, or outcome data
before making guesses.

Missing Gate 2 results still do not fail validation after this handoff; fail-closed
enforcement is a later small handoff after the orchestrator reviews these stored
results.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D024, D031, D032
- Docs: none
- Prior artifacts: `agents/reports/R019_H021.md`, `agents/reports/R021_H022.md`
- Source files:
  - `agents/gate2/H022_payloads.json`
  - `packages/content/src/gate2/config.ts`
  - `packages/content/src/schema.ts` only for the `review.gate2` shape
  - `packages/content/scenarios/active/*.json` only after all blind judgments are complete, and only to write `review.gate2`
- Commands for discovery:
  - `rg -n "gate2|GATE2_MODEL|GATE2_PROMPT_VERSION" packages/content/src`

Do not read scenario JSON files, source URLs, reveal text, company metadata, or
review likely-guess lists before finishing and recording all 18 blind judgments.
If broader context seems necessary, stop and log the requested expansion under
Blocked/Questions.

## Task Framing

You are acting as the blind Gate 2 judge and metadata writer. First judge the
payloads exactly as a strong player would see them; only then open scenario JSON
for mechanical write-back.

## Objective

For each exported payload entry, produce the raw Gate 2 result required by the
schema and write it into the matching active scenario JSON under
`review.gate2.<difficulty>`. Preserve all existing scenario content and metadata
except the new `review.gate2` object/entries.

## Prescriptive Instructions

1. Blind judging pass.
   - Open `agents/gate2/H022_payloads.json`.
   - For each of the 18 entries, use only `payload` plus `difficulty` and
     `payloadHash`.
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

2. Only after all blind results are written in your working notes, open the active
   scenario JSON files and write results under:
   - `review.gate2.easy`
   - `review.gate2.medium`
   - `review.gate2.hard`
   keyed by each entry's `scenarioId` and `difficulty`.

3. Preserve JSON structure.
   - Do not rewrite prose, prices, likely guesses, fact banks, sources, or reveal
     content.
   - Do not change payload hashes from the export.
   - Keep each `guesses` array exactly length 5.

4. Run validation.
   - Run `pnpm --filter @signal-or-noise/content validate`.
   - Run `pnpm --filter @signal-or-noise/content gate2 -- check`.
   - Run `pnpm --filter @signal-or-noise/content test`.
   - Run `pnpm test` and `pnpm typecheck`.
   - If validation/check fails because your blind results make a card too
     identifiable or too vague, do not rewrite card content in this handoff.
     Leave the stored raw results, report the failures, and stop for
     orchestrator review.

## Do NOT

- Do not read active scenario JSON, source URLs, reveal text, company metadata,
  likely-guess lists, or outcome data before completing all 18 blind judgments.
- Do not call external APIs or add SDKs/API keys.
- Do not edit scenario content, market data, sources, or reveal copy.
- Do not make missing Gate 2 entries fail validation.
- Do not edit `soul.md`, `roadmap.md`, or `decisions.md`.
- Do not build anything on the MVP exclusion list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. All 18 active scenario variants have `review.gate2.<difficulty>` stored.
2. Every stored entry uses `model: "grok-4.5"` and `promptVersion: "guess.v1+direction.v1"`.
3. Every stored entry's `payloadHash` matches the exported entry for that scenario/difficulty.
4. Every stored entry has exactly 5 guesses and one direction object matching the schema.
5. No scenario content, market data, sources, or reveal prose changes except adding `review.gate2`.
6. `pnpm --filter @signal-or-noise/content validate` runs and the result is reported.
7. `pnpm --filter @signal-or-noise/content gate2 -- check` runs and the result is reported.
8. `pnpm --filter @signal-or-noise/content test`, `pnpm test`, and `pnpm typecheck` run and are reported.

## Verification Steps for the Executor

Run from repo root:

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
git status --short
```

Also run a focused diff check:

```powershell
git diff -- packages/content/scenarios/active
```

Confirm only `review.gate2` additions changed the scenario JSON files.

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R022_H023.md` per
`agents/reports/TEMPLATE.md`.

**Do NOT commit or push anything** - the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).

If blocked: set Status note, log the question in `progress.md` Blocked/Questions,
and stop.
