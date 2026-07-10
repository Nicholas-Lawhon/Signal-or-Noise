# H030 - Blind Gate 2 Rejudge for H029 Medium/Hard Variants

**Role:** Content Curator
**Phase:** 4 Part A - Content rules & validator hardening
**Status:** complete
**Model:** grok-4.5 (pinned Gate 2 judge per D031)
**Risk:** high (production content-pipeline validation and scenario metadata)
**Audit:** orchestrator review + cheap verification before commit
**Depends on:** H029, R038
**Estimated scope:** medium - blind model judgment over 12 rewritten
Medium/Hard payloads plus JSON write-back
**Context budget:** small - blind payloads and schema shape only; do not read
answer/reveal sources
**Output budget:** report <= 900 words

## Context

H029 rewrote the Medium and Hard hidden-card variants for the six active seeds
after H028 showed identity failures on all 12. The rewrite preserved Easy text,
all shared labels, and Easy Gate 2 results byte-identically (verified in R038),
removed stale Medium/Hard `review.gate2` entries, and exported fresh payloads
to `agents/gate2/H029_payloads.json` (18 entries; payloads verified against
current content).

This handoff supplies the missing blind model judgments for the 12 rewritten
Medium/Hard variants only. Use only the exported pre-decision payloads during
the blind judging pass. Do not rejudge or overwrite Easy results — shared
fields did not change, so stored Easy evidence remains valid.

Judge honestly. Two previous rewrites failed under honest judgment; a third
honest failure is a useful outcome, not a problem to soften. Do not calibrate
confidences to make results pass.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D024, D031, D032
- Docs: none
- Prior artifacts:
  - `agents/reports/R037_H029.md` — ONLY the Summary and Files Changed
    sections, and only if needed; do NOT read its Red-Team Self-Check table
    before judging (it names the actual companies)
- Source files:
  - `agents/gate2/H029_payloads.json`
  - `packages/content/src/gate2/config.ts`
  - `packages/content/src/schema.ts` only for the `review.gate2` shape
  - `packages/content/scenarios/active/*.json` only after all blind judgments
    are complete, and only to write `review.gate2.medium|hard`
- Commands for discovery:
  - `rg -n "gate2|GATE2_MODEL|GATE2_PROMPT_VERSION" packages/content/src`

Do not read scenario JSON files, source URLs, reveal text, company metadata,
review likely-guess lists, or R037's self-check table before finishing and
recording all 12 blind judgments. If broader context seems necessary, stop and
log the requested expansion under Blocked/Questions.

## Task Framing

You are acting as the blind Gate 2 judge and metadata writer. First judge the
payloads exactly as a strong player would see them; only then open scenario
JSON for mechanical write-back.

## Objective

For each Medium and Hard exported payload entry in
`agents/gate2/H029_payloads.json`, produce the raw Gate 2 result required by
the schema and write it into the matching active scenario JSON under
`review.gate2.medium` or `review.gate2.hard`. Preserve existing Easy Gate 2
entries and all scenario content.

## Prescriptive Instructions

1. Blind judging pass.
   - Open `agents/gate2/H029_payloads.json`.
   - Ignore `difficulty: "easy"` entries for judging and write-back.
   - For each of the 12 Medium/Hard entries, use only `payload` plus
     `difficulty` and `payloadHash`.
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

2. Only after all 12 blind Medium/Hard results are written in your working
   notes, open the active scenario JSON files and write results under:
   - `review.gate2.medium`
   - `review.gate2.hard`
   keyed by each entry's `scenarioId` and `difficulty`.

3. Preserve JSON structure.
   - Do not rewrite hidden-card prose, titles, review likely guesses, fact
     banks, prices, sources, reveal content, or Easy Gate 2 entries.
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

- Do not read active scenario JSON, source URLs, reveal text, company
  metadata, likely-guess lists, outcome data, or R037's self-check table
  before completing all 12 blind judgments.
- Do not rejudge or overwrite existing `review.gate2.easy` entries.
- Do not call external APIs or add SDKs/API keys.
- Do not edit scenario content, market data, sources, or reveal copy.
- Do not make missing Gate 2 entries fail validation.
- Do not edit `soul.md`, `roadmap.md`, or `decisions.md`.
- Do not build anything on the MVP exclusion list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. All six active scenarios have stored `review.gate2.medium` and
   `review.gate2.hard` entries.
2. Existing `review.gate2.easy` entries are unchanged.
3. Every new Medium/Hard entry uses `model: "grok-4.5"` and
   `promptVersion: "guess.v1+direction.v1"`.
4. Every new Medium/Hard entry's `payloadHash` matches the exported
   `H029_payloads.json` entry for that scenario/difficulty.
5. Every new Medium/Hard entry has exactly 5 guesses and one direction object
   matching the schema.
6. No scenario content, market data, sources, review notes, likely guesses,
   fact banks, or reveal prose changes except adding `review.gate2.medium|hard`.
7. `pnpm --filter @signal-or-noise/content validate` runs and the result is
   reported (pass or fail — honest results either way).
8. `pnpm --filter @signal-or-noise/content gate2 -- check` runs and the result
   is reported, including error/warning/missing counts.
9. `pnpm --filter @signal-or-noise/content test`, `pnpm test`, and
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

Confirm the active-scenario diff only adds `review.gate2.medium|hard` entries
and does not alter Easy Gate 2 entries or card content.

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R040_H030.md` per
`agents/reports/TEMPLATE.md`.

**Do NOT commit or push anything** - the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).

If blocked: set Status note, log the question in `progress.md`
Blocked/Questions, and stop.
