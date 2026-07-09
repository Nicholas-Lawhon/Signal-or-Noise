# H035 - Part B Batch 1 Blind Gate 2 (+ Netflix Medium/Hard Fold-In)

**Role:** Content Curator
**Phase:** 4 Part B - Content generation at scale
**Status:** draft
**Model:** grok-4.5 (pinned Gate 2 judge per D031)
**Risk:** high (production content-pipeline validation)
**Audit:** orchestrator review + cheap verification; failures become a
fix-up authoring handoff (rejudge only changed payloads)
**Depends on:** H034 (batch-1 drafts + `agents/gate2/H034_payloads.json`),
D035 (Netflix fold-in), D031, D032
**Estimated scope:** medium - blind judgment over batch-1 draft variants
plus 2 Netflix Medium/Hard payloads; JSON write-back
**Context budget:** small - blind payloads and schema shape only during
judging; no answer/reveal sources until write-back
**Output budget:** report <= 1,000 words

## Context

H034 authored 10 draft scenarios for Part B batch 1 and exported payloads to
`agents/gate2/H034_payloads.json`. This handoff supplies **blind** Gate 2
model judgments (D031/D032) for those drafts.

Per **D035**, also judge the two Netflix Medium/Hard payloads from
`agents/gate2/H032_payloads.json` (or the equivalent Netflix medium/hard
entries if H034's export already includes current Netflix hashes — prefer
payloads whose `payloadHash` matches current content). Write Netflix results
into the **active** Netflix seed; write draft results into the **draft**
seeds. Do not rewrite any hidden-card prose in this handoff.

Judge honestly. Identity failures are useful outcomes. Do not calibrate
confidences to force passes. Do not read company answers before judging.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D024, D031, D032, D035, D036 (WARN calibration context only —
  do not change thresholds)
- Docs: none required for judging
- Prior artifacts:
  - `agents/reports/R###_H034.md` — ONLY Summary / Files Changed / export
    scope **after** blind judging is complete if needed for write-back
    mapping; do **not** read H034 self-judge tables before judging
- Source files (judging phase):
  - `agents/gate2/H034_payloads.json`
  - `agents/gate2/H032_payloads.json` — Netflix medium/hard entries only
    (if not already covered by a current-hash export)
  - `packages/content/src/gate2/config.ts` — model/prompt pins only
  - `packages/content/src/schema.ts` — `review.gate2` shape only
- Source files (write-back phase, only after all blind results are finalized
  in working notes):
  - `packages/content/scenarios/draft/*.json` (batch-1 files from H034)
  - `packages/content/scenarios/active/scenario_netflix_2012_2017.json`
- Commands for discovery:
  - `rg -n "GATE2_MODEL|GATE2_PROMPT_VERSION" packages/content/src/gate2`

**Blind boundary:** Do not read draft/active scenario JSON, source URLs,
reveal text, company metadata, likely-guess lists, fact banks, or H034
self-judge tables until every in-scope payload has a recorded judgment.

## Task Framing

You are the pinned blind Gate 2 judge and metadata writer. Judge first from
payloads only; write back second.

## Objective

For every in-scope exported payload (all H034 batch-1 draft
easy/medium/hard variants that need initial Gate 2, plus Netflix
medium/hard if still missing/stale), produce schema-valid raw Gate 2 results
and write them to the correct scenario JSON under
`review.gate2.<difficulty>`. Leave all player-facing content unchanged.
Report pass/fail/WARN outcomes; do not fix failing cards here.

## Prescriptive Instructions

### 1. Build the in-scope payload list

1. Open `agents/gate2/H034_payloads.json`.
2. Include every entry whose `scenarioId` corresponds to an H034 draft card
   (all three difficulties unless the export/report scopes a subset —
   default is all draft variants present).
3. Add Netflix medium and hard from `agents/gate2/H032_payloads.json`
   unless H034 export already contains Netflix medium/hard entries whose
   hashes match current active content — do not double-judge conflicting
   hashes; prefer the payload that matches current files at write-back time.
4. List the final in-scope `(scenarioId, difficulty, payloadHash)` set in
   the report.

### 2. Blind judging pass

For each in-scope entry, use **only** `payload`, `difficulty`, and
`payloadHash`:

- Record exactly 5 guesses:
  - `company` (name, not ticker-only when avoidable)
  - `confidence` integer 0–100
  - `pointingFact` short payload-based support
- Record direction:
  - `call`: `long` | `short` | `toss_up`
  - `confidence` integer 0–100
  - `cue` short payload-based cue
- Set `model: "grok-4.5"` and
  `promptVersion: "guess.v1+direction.v1"`
- Use one consistent ISO timestamp for this run's `testedAt` on all entries
  you write
- Set `payloadHash` to the export entry's hash (do not recompute creatively)

Do not soften confidences. Do not look up the company.

### 3. Write-back (only after all blind judgments exist)

Open the matching JSON files and write `review.gate2.easy|medium|hard` as
appropriate:

- Draft batch-1 files: write all judged difficulties for those drafts.
- Netflix active seed: write **only** `review.gate2.medium` and
  `review.gate2.hard` if those were judged; preserve
  `review.gate2.easy` and all non-gate2 fields byte-identical.
- Do not create gate2 entries for scenarios you did not judge.
- Do not delete other scenarios' gate2 data.

### 4. Validate and report outcomes

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
```

- If stored results cause identity **errors**, leave them stored, list the
  failing `(scenarioId, difficulty, rule)` rows in the report, and **do not**
  rewrite prose.
- WARNs (direction, plausible-count under-2, dominance, etc.) are reported
  but are not fix-ups in this handoff unless they accompany errors.

### 5. Optional results snapshot

If useful, write a machine-readable summary to
`agents/gate2/H035_results.json` (scenarioId, difficulty, top guess,
correct-rank if known only **after** write-back, findings). Not required if
the report tables are complete.

## Do NOT

- Do not read scenario answers, reveals, fact banks, likely guesses, or
  H034 self-judge tables before finishing blind judgments.
- Do not edit hidden-card prose, titles, market data, sources, or reveal
  copy.
- Do not overwrite Netflix `review.gate2.easy` or any non-Netflix active
  seed content.
- Do not call external APIs or add SDKs/API keys.
- Do not change Gate 2 thresholds, prompts, or package source.
- Do not mark drafts `active` or `humanReviewed: true`.
- Do not edit `soul.md`, `roadmap.md`, or `decisions.md`.
- Do not build anything on the MVP exclusion list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. Every in-scope payload has a stored `review.gate2.<difficulty>` with
   model/prompt pins, matching payloadHash, 5 guesses, and direction.
2. Netflix Medium/Hard either receive stored results or the report proves
   they were already current and in-scope from export (no silent skip).
3. No player-facing scenario fields changed; active non-Netflix seeds
   untouched; Netflix changes limited to medium/hard gate2 (+ draft
   gate2 writes only on batch-1 drafts).
4. `validate`, `gate2 check`, `pnpm test`, and `pnpm typecheck` run and are
   reported.
5. Report lists identity errors / WARNs per variant and recommends fix-up
   vs playtest-vs-batch-2 for the orchestrator.

## Verification Steps for the Executor

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm test
pnpm typecheck
git status --short
git diff --stat -- packages/content/scenarios
```

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R###_H035.md` per
`agents/reports/TEMPLATE.md`.

Include: in-scope payload count; per-variant identity pass/fail; Netflix
fold-in outcome; WARN summary; recommended next step (fix-up handoff vs
user playtest vs batch 2).

**Do NOT commit or push anything** — the orchestrator reviews your report and
uncommitted diff, then commits on approval (D012).

If blocked: set Status note, log the question in `progress.md`
Blocked/Questions, and stop.
