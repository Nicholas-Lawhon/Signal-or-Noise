# H027 - Hard Gate 2 Identity Rewrite

**Role:** Content Curator
**Phase:** 4 Part A - Content rules & validator hardening
**Status:** approved
**Model:** gpt-5.5
**Risk:** high (active scenario content quality and Gate 2 guessability)
**Audit:** orchestrator review + follow-up blind Grok 4.5 Gate 2 judge before accepting content quality
**Depends on:** H026, R029
**Estimated scope:** medium - six active JSON seeds, Hard variants primarily, with bounded shared-label edits only if needed
**Context budget:** medium - six active seeds, H026 Gate 2 evidence, targeted doc 09 rulebook sections
**Output budget:** report <= 1,000 words

## Context

H026 wrote fresh blind Gate 2 results for the H025 Medium/Hard rewrites. Medium
identity now passes D031 thresholds, but all six Hard variants still fail:
Grok 4.5 guessed the correct company at rank 1 with confidence >= 15 for every
active seed. Easy and Medium Gate 2 entries are useful evidence and should be
preserved unless this handoff changes shared payload fields that make their
hashes stale.

This handoff rewrites the failing Hard variants so they are less identifiable
without becoming random. The preferred path changes only Hard hidden-card text
and Hard review metadata, removes stale Hard Gate 2 entries, and exports fresh
payloads for a Hard-only blind rejudge.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D022, D026, D031, D032
- Docs:
  - `docs/09_content_and_round_creation.md` sections:
    - `Scenario Content Rulebook (D022, D026)`
    - `Universal Bans (every field, every difficulty)`
    - `Field Roles`
    - `Specificity Ladder`
    - `Per-Difficulty Specification`
    - `Decision-Informativeness Floor (anti-randomness)`
    - `Directional Sentiment Rules (anti-answer leakage)`
    - `Gate 1 — Whole-Card Triangulation Review (human)`
    - `Gate 2 — The Guessability Test (model, falsifiable)`
    - `Scenario Validation Checklist`
  - `docs/06_data_model.md` sections:
    - `Scenario JSON Seed Format`
    - `Content Review Fields`
- Prior artifacts:
  - `agents/reports/R029_R028_review.md`
  - `agents/reports/R028_H026.md`
- Source files:
  - `packages/content/scenarios/active/scenario_amazon_1999_2001.json`
  - `packages/content/scenarios/active/scenario_apple_2007_2008.json`
  - `packages/content/scenarios/active/scenario_microsoft_2014_2016.json`
  - `packages/content/scenarios/active/scenario_netflix_2012_2017.json`
  - `packages/content/scenarios/active/scenario_nvidia_2015_2017.json`
  - `packages/content/scenarios/active/scenario_visa_2011_2013.json`
  - `packages/content/src/gate2/config.ts`
  - `packages/content/src/schema.ts`
  - `packages/content/src/validation.ts`
- Commands for discovery:
  - `pnpm --filter @signal-or-noise/content validate`
  - `pnpm --filter @signal-or-noise/content gate2 -- check`
  - `rg -n "Gate 2|Specificity|Per-Difficulty|Decision-Informativeness|Directional" docs/09_content_and_round_creation.md`

If broader context seems necessary, stop and log the requested expansion under
Blocked/Questions instead of reading unrelated history.

## Task Framing

Act as a red-team Hard-mode content editor. You are not researching new
scenarios or changing market facts. Your job is to remove the remaining Hard
identity triangulation while keeping enough concrete, balanced information for a
fair Long/Short decision.

## Objective

Rewrite the Hard variants for all six active seeds so a strong blind judge has
at least four plausible public-company candidates and the correct company is not
dominant under D031 Hard thresholds. Preserve Easy and Medium content and Gate 2
results whenever possible. If a shared label is the unavoidable identity leak,
change it only within the narrow rules below and remove any now-stale Gate 2
entries.

## Prescriptive Instructions

1. For each active seed, inspect `review.gate2.hard.guesses` and the
   `pointingFact` values from H026. Identify the strongest triangulation leaks.
   Pay special attention to title, era, decision date label, holding period, and
   lookback shape, because Hard has no setup hints.
2. Preferred edit path: rewrite only these fields:
   - `hiddenCard.hard.companyDescription`
   - `hiddenCard.hard.macroContext`
   - `hiddenCard.hard.situation`
   - `hiddenCard.hard.longCase`
   - `hiddenCard.hard.shortCase`
   - `hiddenCard.hard.setupHints` (must remain `[]`)
   - `review.hardLikelyGuesses`
   - relevant `review.factBank` and `review.reviewNotes`
3. Keep Medium and Easy hidden-card fields unchanged unless you hit the shared
   label exception below.
4. Shared label exception:
   - You may edit `title`, `era`, `decisionDateLabel`, or `holdingPeriodLabel`
     only when Hard cannot plausibly pass Gate 1 without reducing that shared
     label's identifiability.
   - If you change any shared label for a scenario, keep it truthful and useful
     for all difficulties, but make it less company-specific.
   - Because shared labels are included in every exported payload, remove all
     stored `review.gate2` entries for that scenario whose payload hash is now
     stale, including Easy and Medium if affected.
   - In the report, list every scenario where the shared-label exception was used
     and state that the follow-up blind judge must rejudge all changed
     difficulties for that scenario, not Hard only.
5. Preserve company identity, ticker, accepted names, market data, lookback
   prices, outcome prices, reveal copy, sources, status, and scenario dates in
   the data model. `decisionDateLabel` may be made less specific only as display
   copy under the shared label exception; do not change the actual
   `decisionDate`.
6. Maintain D026 Hard rules:
   - `setupHints` is exactly `[]`.
   - Hard should use broad but decision-useful sector/category language.
   - The Long and Short cases must both be plausible from pre-decision facts.
7. Update review metadata:
   - `review.hardLikelyGuesses` must include at least 4 named public companies.
   - `review.factBank.prohibited` should include distinctive hooks removed from
     Hard.
   - `review.reviewNotes` should briefly explain the H027 Hard rewrite and any
     shared-label exception.
8. Remove stale `review.gate2.hard` entries for every changed Hard variant.
   Preserve `review.gate2.easy` and `review.gate2.medium` unless their payload
   hashes became stale because of shared-label changes.
9. Export fresh payloads to a new file:

   ```powershell
   pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H027_payloads.json
   ```

   Do not overwrite `agents/gate2/H025_payloads.json`.

## Do NOT

- Do not change company identity, ticker, accepted names, actual dates,
  market data, lookback/outcome prices, reveal text, sources, or status.
- Do not edit Medium/Easy hidden-card prose unless a shared label exception
  changes display metadata used by all difficulties.
- Do not add or fake new `review.gate2` model judgments. The follow-up blind
  Grok judge handoff owns those results.
- Do not change D031 thresholds or make missing/failing Gate 2 non-blocking.
- Do not use company names, tickers, founder/CEO names, unmistakable product
  names, slogans, or era-unique hooks in hidden-card text.
- Do not make Hard vague or content-free; it still needs concrete decision
  tension.
- Do not edit `soul.md`, `roadmap.md`, `decisions.md`, schemas, validators, app
  code, or anything on the MVP exclusion list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. All six active scenario JSON files have revised Hard variants that pass
   schema/business validation.
2. Every Hard variant has `setupHints: []` and at least 4 named public companies
   in `review.hardLikelyGuesses`.
3. Easy and Medium hidden-card prose and Gate 2 entries are unchanged unless a
   shared-label exception is explicitly used and reported.
4. If a shared label changes, all stale Gate 2 entries for that scenario are
   removed and the report names the affected difficulties.
5. Scenario identity, actual dates, market data, reveal copy, sources, and status
   are unchanged.
6. Stale `review.gate2.hard` entries are removed for changed Hard variants; no
   new Hard model judgments are written.
7. `pnpm --filter @signal-or-noise/content validate` passes for all 6 active
   files. Existing direction warnings or missing Gate 2 info may remain only if
   reported.
8. `pnpm --filter @signal-or-noise/content gate2 -- check` reports 0 errors.
   Missing entries are acceptable only for variants intentionally invalidated by
   this handoff and must be reported by difficulty count.
9. `agents/gate2/H027_payloads.json` exists and exports 18 payload entries.
10. `pnpm --filter @signal-or-noise/content test`, `pnpm test`,
    `pnpm typecheck`, and `pnpm build` pass.

## Verification Steps for the Executor

Run from repo root:

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H027_payloads.json
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
pnpm build
git diff -- packages/content/scenarios/active
git diff -- agents/gate2/H027_payloads.json
git status --short
```

In the report, include validation/check counts, the number of missing Gate 2
entries by difficulty, the number of exported payload entries, and a concise
per-scenario Gate 1 rationale for the revised Hard peer set.

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R031_H027.md` per
`agents/reports/TEMPLATE.md`.

**Do NOT commit or push anything** - the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).

If blocked: set Status note, log the question in `progress.md` Blocked/Questions,
and stop.
