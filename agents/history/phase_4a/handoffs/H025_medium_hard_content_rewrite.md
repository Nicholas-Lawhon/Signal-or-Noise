# H025 - Medium/Hard Active Seed Rewrite

**Role:** Content Curator
**Phase:** 4 Part A - Content rules & validator hardening
**Status:** complete
**Model:** grok-4.5
**Risk:** high (active scenario content quality and Gate 2 guessability)
**Audit:** orchestrator review + follow-up blind Grok 4.5 Gate 2 judge before accepting content quality
**Depends on:** H023, H024, R025
**Estimated scope:** medium - six active JSON seeds, medium/hard variants only
**Context budget:** medium - content rulebook sections, six active seeds, H023 Gate 2 evidence
**Output budget:** report <= 900 words

## Context

H023 stored blind Grok 4.5 Gate 2 judgments on all 18 active variants. The
results are useful but show every active Medium and Hard variant is too
identifiable under D031 thresholds. H024 restored the default build/test workflow
by letting the web prototype load active fixtures with explicit `skipGate2`,
while the authoritative `validate` and `gate2 check` commands still expose the
content-quality failures.

This handoff rewrites the Medium and Hard hidden-card variants in place for the
six current active sample seeds. It does **not** run or fake the blind Gate 2
judge. Because changed hidden-card text invalidates stored payload hashes, remove
stale Medium/Hard `review.gate2` entries and export fresh payloads for the next
Grok judge handoff.

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
    - `Authoring Workflow`
    - `Scenario Validation Checklist`
  - `docs/06_data_model.md` sections:
    - `Scenario JSON Seed Format`
    - `Content Review Fields`
- Prior artifacts:
  - `agents/reports/R022_H023.md`
  - `agents/reports/R025_R024_review.md`
  - `agents/gate2/H023_results.json`
- Source files:
  - `packages/content/scenarios/active/scenario_amazon_1999_2001.json`
  - `packages/content/scenarios/active/scenario_apple_2007_2008.json`
  - `packages/content/scenarios/active/scenario_microsoft_2014_2016.json`
  - `packages/content/scenarios/active/scenario_netflix_2012_2017.json`
  - `packages/content/scenarios/active/scenario_nvidia_2015_2017.json`
  - `packages/content/scenarios/active/scenario_visa_2011_2013.json`
  - `packages/content/src/schema.ts`
  - `packages/content/src/validation.ts`
  - `packages/content/src/gate2/run.ts`
- Commands for discovery:
  - `pnpm --filter @signal-or-noise/content validate`
  - `pnpm --filter @signal-or-noise/content gate2 -- check`
  - `rg -n "Gate 2|Specificity|Per-Difficulty|Decision-Informativeness|Directional" docs/09_content_and_round_creation.md`

If broader context seems necessary, stop and log the requested expansion under
Blocked/Questions instead of reading unrelated history.

## Task Framing (micro-role)

Act as a red-team content editor, not a scenario researcher. The companies,
dates, prices, reveal copy, sources, and Easy variants are already fixed for this
slice. Your job is to make Medium and Hard less identifiable while preserving a
fair Long/Short decision tension.

## Objective

Rewrite the Medium and Hard hidden-card variants for all six active seeds so
they meet doc 09 Gate 1 targets: Medium has 2-4 plausible public-company
candidates with none dominant; Hard has at least 4 plausible candidates and the
correct company is not dominant. Keep Easy unchanged, preserve the scenario
facts, remove stale Medium/Hard stored Gate 2 results after text changes, and
export fresh payloads for the next blind judge handoff.

## Prescriptive Instructions

1. For each active seed, inspect the H023 Medium/Hard Gate 2 guesses and identify
   why the correct company was dominant. Pay attention to the `pointingFact`
   values; they usually name the exact triangulation leak to remove.
2. Rewrite only these player-facing fields unless a review field needs to match:
   - `hiddenCard.medium.companyDescription`
   - `hiddenCard.medium.macroContext`
   - `hiddenCard.medium.situation`
   - `hiddenCard.medium.longCase`
   - `hiddenCard.medium.shortCase`
   - `hiddenCard.medium.setupHints`
   - `hiddenCard.hard.companyDescription`
   - `hiddenCard.hard.macroContext`
   - `hiddenCard.hard.situation`
   - `hiddenCard.hard.longCase`
   - `hiddenCard.hard.shortCase`
   - `hiddenCard.hard.setupHints`
3. Keep `hiddenCard.easy` unchanged unless you find a direct contradiction with
   `soul.md`; if that happens, stop and log the contradiction.
4. Keep the title and scenario metadata unchanged. Titles are shared across all
   difficulties and changing them would invalidate Easy Gate 2 evidence.
5. Preserve D026 setup counts:
   - Medium: 0 or 1 setup hint; prefer 0 when identity risk is high.
   - Hard: exactly `[]`.
6. Update review metadata to match the rewritten variants:
   - `review.factBank.decisionUseful` may be refined to reflect the new allowed
     abstract facts.
   - `review.factBank.prohibited` should list the distinctive hooks removed
     from Medium/Hard.
   - `review.mediumLikelyGuesses` must contain 2-4 named public companies.
   - `review.hardLikelyGuesses` must contain at least 4 named public companies.
   - `review.reviewNotes` should concisely note that Medium/Hard were rewritten
     after H023 Gate 2 identity failures and summarize the intended peer set.
7. Remove only stale `review.gate2.medium` and `review.gate2.hard` entries for
   scenarios whose Medium/Hard hidden-card text changed. Preserve
   `review.gate2.easy` entries when Easy and shared metadata stay unchanged.
8. Do a self Gate 1 red-team pass before calling the work complete:
   - For Medium, write down why each likely guess fits without contradiction.
   - For Hard, ensure the correct company is not the only candidate that fits
     the date, sector, chart shape, and hidden-card tension.
   - If a sentence could describe fewer than three real companies, rewrite it.
9. Export fresh payloads after the rewrite:

   ```powershell
   pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H025_payloads.json
   ```

   The exported payload file is the input to the next blind Grok judge handoff.

## Do NOT

- Do not change company identity, ticker, accepted names, market data, dates,
  lookback/outcome prices, reveal text, sources, status, or Easy hidden-card
  text.
- Do not edit `soul.md`, `roadmap.md`, `decisions.md`, schemas, validators, or
  app code.
- Do not change D031 thresholds or make missing/failing Gate 2 non-blocking.
- Do not write new Medium/Hard `review.gate2` model judgments. The next blind
  Grok judge handoff owns those results.
- Do not use company names, tickers, founder/CEO names, unmistakable product
  names, slogans, or era-unique hooks in hidden-card text.
- Do not make Hard vague or random; it still needs concrete Long and Short cases.
- Do not add APIs, SDKs, auth, database, mobile, or anything on the MVP exclusion
  list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. All six active scenario JSON files have revised Medium and Hard hidden-card
   variants that pass schema/business validation.
2. `hiddenCard.easy` is unchanged in all six active scenario files.
3. Scenario metadata, market data, reveal copy, sources, status, and company
   identity fields are unchanged.
4. Each Medium variant has 0-1 setup hints and `review.mediumLikelyGuesses`
   contains 2-4 named public companies.
5. Each Hard variant has `setupHints: []` and `review.hardLikelyGuesses`
   contains at least 4 named public companies.
6. Stale `review.gate2.medium` and `review.gate2.hard` entries are removed for
   changed variants; preserved Easy Gate 2 entries are not altered.
7. `pnpm --filter @signal-or-noise/content validate` passes for all 6 active
   files, with no Gate 2 identity errors.
8. `pnpm --filter @signal-or-noise/content gate2 -- check` reports 0 errors.
   Missing Medium/Hard variants are acceptable in this handoff because the blind
   judge follow-up has not run yet.
9. `agents/gate2/H025_payloads.json` exists and exports 18 payload entries.
10. `pnpm --filter @signal-or-noise/content test`, `pnpm test`,
    `pnpm typecheck`, and `pnpm build` pass.

## Verification Steps for the Executor

Run from repo root:

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H025_payloads.json
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
pnpm build
git diff -- packages/content/scenarios/active
git diff -- agents/gate2/H025_payloads.json
git status --short
```

In the report, include the `validate` and `gate2 check` counts, the number of
exported payload entries, and a brief per-scenario Gate 1 rationale for
Medium/Hard likely guesses.

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R026_H025.md` per
`agents/reports/TEMPLATE.md`.

**Do NOT commit or push anything** - the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).

If blocked: set Status note, log the question in `progress.md` Blocked/Questions,
and stop.
