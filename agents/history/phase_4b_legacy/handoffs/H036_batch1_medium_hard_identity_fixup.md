# H036 - Batch 1 Medium/Hard Identity Fix-Up

**Role:** Content Curator
**Phase:** 4 Part B - Content generation at scale
**Status:** complete
**Model:** gpt-5.5
**Risk:** high (production scenario content)
**Audit:** orchestrator review + mandatory blind rejudge follow-up (H037)
**Depends on:** H034, H035, R055, R056, D031, D036, D037, D038
**Estimated scope:** large - 19 targeted hidden-card rewrites across 10 drafts
**Context budget:** medium - rulebook, exact failed rows, and only the affected
  draft cards; no broad rewrite history
**Output budget:** report <= 700 words plus a per-card changed-variant table

## Context

H035's blind Gate 2 pass established that all batch-1 Easy variants pass, but
19 draft Medium/Hard variants over-identify their hidden companies. The failures
are valid findings, not a scoring or judge-calibration problem. Repair only the
affected hidden-card variants, then export their changed blind payloads for a
separate judge; the drafts stay draft-only throughout.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D026, D031, D032, D036, D037, D038
- Docs: `docs/09_content_and_round_creation.md` - Rulebook, Gate 1/2,
  Chart Requirements, and banned-pattern appendix
- Prior artifacts:
  - `agents/reports/R055_H035.md` - Known Issues / Follow-ups only
  - `agents/reports/R056_R055_review.md` - full
  - `agents/gate2/H035_results.json` - affected rows only
- Source files:
  - `packages/content/scenarios/draft/scenario_boeing_2019_2020.json`
  - `packages/content/scenarios/draft/scenario_disney_2019_2020.json`
  - `packages/content/scenarios/draft/scenario_docusign_2020_2021.json`
  - `packages/content/scenarios/draft/scenario_fastly_2020_2021.json`
  - `packages/content/scenarios/draft/scenario_ford_2021_2022.json`
  - `packages/content/scenarios/draft/scenario_meta_2022_2023.json`
  - `packages/content/scenarios/draft/scenario_pinterest_2020_2021.json`
  - `packages/content/scenarios/draft/scenario_roku_2020_2021.json`
  - `packages/content/scenarios/draft/scenario_starbucks_2020_2021.json`
  - `packages/content/scenarios/draft/scenario_tesla_2020_2021.json`
  - `packages/content/src/gate2/config.ts`
- Commands: `pnpm --filter @signal-or-noise/content validate` and
  `pnpm --filter @signal-or-noise/content gate2 -- export --include-draft`

## Objective

Rewrite the 19 Medium/Hard variants identified below until their content no
longer combines with the fixed chart silhouettes to reveal the target company.
Preserve each card's playable Long/Short tension, then export only the changed
payloads for H037's blind rejudge.

## Prescriptive Instructions

1. Change only these variants:

   - Boeing: Medium, Hard
   - Disney: Medium, Hard
   - DocuSign: Medium, Hard
   - Fastly: Hard
   - Ford: Medium, Hard
   - Meta: Medium, Hard
   - Pinterest: Medium, Hard
   - Roku: Medium, Hard
   - Starbucks: Medium, Hard
   - Tesla: Medium, Hard

   Fastly Medium is WARN-only and must remain byte-identical. Every Easy
   variant must remain byte-identical.

2. Work Hard first, then Medium. Keep each variant's `situation`, `longCase`,
   and `shortCase`; Hard retains zero setup hints and Medium retains zero or one.
   Replace the payload cues that point to the named company, especially any
   chart-plus-prose conjunction listed in that card's fact bank. Do not solve
   identity merely by making the decision core generic: each Long and Short
   case must remain concrete and causally informative.

3. Update only the affected cards' `review.reviewNotes`, fact-bank peer sets,
   likely-guess lists, or prohibited conjunctions when needed to truthfully
   reflect the rewrites. Retain valid sources and all company/reveal/market-data
   fields. Do not delete H035 Gate 2 evidence; changed payload hashes make those
   results stale and H037 will replace only the changed result blocks.

4. Do a payload-only self-check after each rewrite, using the D031 thresholds
   as rejection limits. Put a concise changed-variant self-check outcome in the
   completion report. This is not authoritative Gate 2 and must not alter model
   confidences or results.

5. Export the canonical payloads with `--include-draft` to
   `agents/gate2/H036_payloads.json`. Write
   `agents/gate2/H036_changed_scope.json` containing exactly the 19 changed
   `(scenarioId, difficulty, payloadHash)` rows. H037 will judge only that file.

6. Run the verification commands. Stored H035 judgments for changed payloads
   may report as stale/missing until H037; report that expected state precisely.

## Do NOT

- Do not edit Easy variants, Fastly Medium, or any active seed (including Netflix).
- Do not alter titles, dates, chart series, returns, company/reveal data,
  sources, schema, Gate 2 prompts/thresholds, or game/app code.
- Do not mark a draft active or human-reviewed.
- Do not write, delete, or edit `review.gate2` results; H037 owns authoritative
  blind rejudging.
- Do not add daily pools/eras, external APIs, packages, or anything in
  `soul.md`'s MVP exclusions.
- Do not commit or push.

## Acceptance Criteria

1. Exactly the 19 listed Medium/Hard variants have player-facing prose changes;
   Easy, Fastly Medium, all active seeds, and frozen data fields are unchanged.
2. Every changed variant has Balanced Tension and correct setup-hint counts;
   `validate` passes for all content files.
3. Each changed card's fact-bank/review metadata accurately records the new
   peer/conjunction rationale, and each changed variant has a report self-check
   below D031 identity-fail limits.
4. `H036_changed_scope.json` has exactly 19 unique changed payload rows and
   `H036_payloads.json` contains their canonical export payloads.
5. No authoritative Gate 2 result was edited, deleted, or newly written.
6. Focused content tests and `pnpm --filter @signal-or-noise/content validate`
   pass; the report states expected stale-result check behavior for H037.

## Verification Steps for the Executor

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content test
pnpm --filter @signal-or-noise/content gate2 -- export --include-draft --out agents/gate2/H036_payloads.json
pnpm --filter @signal-or-noise/content gate2 -- check --include-draft
git diff --stat -- packages/content/scenarios
git status --short
```

## Reporting

On completion: set Status to `complete`, append a compact session entry to
`progress.md`, and write `agents/reports/R###_H036.md` per the report template.
Include the 19-variant scope, self-check aggregate, export artifact paths,
expected stale-result count, and any blockers. Do not duplicate the full scope
artifact in the report.

**Do NOT commit or push anything** - the orchestrator reviews the uncommitted
diff and report before approving follow-up H037. If blocked, log the question in
`progress.md` and stop.
