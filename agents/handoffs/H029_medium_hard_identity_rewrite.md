# H029 - Medium+Hard Identity Rewrite (all six active seeds)

**Role:** Content Curator
**Phase:** 4 Part A - Content rules & validator hardening
**Status:** complete
**Model:** gpt-5.6-terra (High reasoning) — first Terra dispatch under D033
**Risk:** high (active scenario content quality and Gate 2 guessability)
**Audit:** orchestrator review + follow-up blind Grok 4.5 Gate 2 judge before
accepting content quality; cross-model review available per D033 if results
warrant it
**Depends on:** H027, H028, R035
**Estimated scope:** medium - six active JSON seeds, Medium/Hard variants only
**Context budget:** medium - content rulebook sections, six active seeds, H028
Gate 2 evidence
**Output budget:** report <= 1,000 words

**High-reasoning rationale (D029/D033):** This is the third identity-rewrite
attempt. H025 (GPT 5.5) and H027 (shared-label softening) both failed blind
Gate 2 on Medium and Hard for all six seeds — the judge keeps triangulating
identity from residual fact patterns even after obvious hooks were removed.
The task needs deeper adversarial reasoning about what a strong judge can
infer from combinations of facts, not just removal of individual leaks.
Expected context is medium (rulebook + 6 seeds + judge evidence); expected
output is six edited JSON files plus a <=1,000-word report.

## Context

H028 blind-judged all 18 payloads from the H027 export. Easy passes identity
6/6. Medium fails 6/6 (correct company ranked #1 at confidence 48-68,
threshold: fail at #1 with conf >= 40 or lead >= 15; Apple and Netflix also
broke the lead threshold). Hard fails 6/6 (correct company in the judge's top
5 at confidence 24-32; threshold: fail if present in top 5 at conf >= 15).
Full per-scenario results are stored in each seed's `review.gate2` and
summarized in `agents/reports/R034_H028.md`.

This handoff rewrites the Medium and Hard hidden-card variants in place for
the six active seeds. It does **not** run or fake the blind Gate 2 judge.
Because changed hidden-card text invalidates stored payload hashes, remove
stale Medium/Hard `review.gate2` entries and export fresh payloads for the
next blind judge handoff. Easy hidden-card text and the shared labels
(title, era, decisionDateLabel, holdingPeriodLabel) must stay unchanged so
the passing Easy Gate 2 results remain valid.

**What failed before, so you do not repeat it:** H025 removed named hooks
(products, slogans, era-unique events) but left fact combinations that
uniquely triangulate (sector + chart era + business-model detail + magnitude
language). H027 softened shared labels (year-only dates, generic eras,
retitles) — Easy still passes but Medium/Hard identity survived. The
remaining leak channel is the *conjunction* of individually-innocent facts in
the Medium/Hard prose itself. Your rewrite must make each Medium card
genuinely describe 2-4 real public companies and each Hard card at least 4,
under adversarial reading — not merely avoid named references.

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
- Prior artifacts:
  - `agents/reports/R034_H028.md` (per-scenario judge results and confidences)
  - Stored `review.gate2.medium|hard` in each active seed — especially each
    guess's `pointingFact`: these name the exact triangulation evidence the
    judge used. Treat them as your red-team target list.
- Source files:
  - `packages/content/scenarios/active/scenario_amazon_1999_2001.json`
  - `packages/content/scenarios/active/scenario_apple_2007_2008.json`
  - `packages/content/scenarios/active/scenario_microsoft_2014_2016.json`
  - `packages/content/scenarios/active/scenario_netflix_2012_2017.json`
  - `packages/content/scenarios/active/scenario_nvidia_2015_2017.json`
  - `packages/content/scenarios/active/scenario_visa_2011_2013.json`
  - `packages/content/src/gate2/config.ts` (exact D031 thresholds)
- Commands for discovery:
  - `pnpm --filter @signal-or-noise/content validate`
  - `pnpm --filter @signal-or-noise/content gate2 -- check`

If broader context seems necessary, stop and log the requested expansion under
Blocked/Questions instead of reading unrelated history.

## Task Framing (micro-role)

Act as an adversarial red-team content editor. Before writing a single
replacement sentence, play the judge: for each Medium/Hard card, list every
fact (and fact *combination*) that narrows the candidate set below the target
count, using the stored `pointingFact` values as the starting evidence. Then
rewrite so that a strong model reading only the pre-decision payload cannot do
better than the target candidate spread. The companies, dates, prices, reveal
copy, sources, shared labels, and Easy variants are fixed for this slice.

## Objective

Rewrite the Medium and Hard hidden-card variants for all six active seeds so
that a blind Gate 2 judge cannot beat the D031 thresholds: Medium — the
correct company is not ranked #1 at confidence >= 40 and holds no >= 15-point
lead; Hard — the correct company does not appear in the top 5 at confidence
>= 15. Keep Easy text and shared labels unchanged so Easy Gate 2 evidence
stays valid, remove stale Medium/Hard stored Gate 2 results, update review
metadata, and export fresh payloads for the next blind judge handoff.

## Prescriptive Instructions

1. For each seed, extract the stored `review.gate2.medium` and
   `review.gate2.hard` guesses and their `pointingFact` values. Build an
   explicit leak inventory per card: which facts, alone or in combination,
   pointed the judge to the correct company.
2. Rewrite only these player-facing fields:
   - `hiddenCard.medium.companyDescription`, `.macroContext`, `.situation`,
     `.longCase`, `.shortCase`, `.setupHints`
   - `hiddenCard.hard.companyDescription`, `.macroContext`, `.situation`,
     `.longCase`, `.shortCase`, `.setupHints`
3. Anti-triangulation techniques you are expected to use (bounded judgment on
   which fits each card):
   - Generalize sector/business-model detail up one rung on the doc 09
     Specificity Ladder wherever a `pointingFact` cited it.
   - Strip or blur magnitude/superlative language ("largest", "dominant",
     "pioneer") that implies a category leader — leaders are guessable.
   - Decouple the prose from the chart era: the judge combines
     macro-narrative with the lookback silhouette, so macroContext must fit
     multiple market periods where possible within the fixed (already
     softened) labels.
   - For Hard especially: the correct company must not merely be one of
     several candidates — it must not stand out at conf >= 15 in a top-5
     list. Write Hard prose that fits the *peer set first* and the actual
     company only incidentally.
4. Preserve the Decision-Informativeness Floor: every rewritten card must
   still give a genuine reason to go Long and a genuine reason to go Short.
   Do not fix guessability by making cards vague or random.
5. Preserve D026 setup counts: Medium 0-1 setup hints (prefer 0 given the
   identity-risk history); Hard exactly `[]`.
6. Keep `hiddenCard.easy` and the shared labels (`title`, `era`,
   `decisionDateLabel`, `holdingPeriodLabel`) byte-identical. **Last-resort
   exception:** if you conclude a specific card cannot pass Hard thresholds
   without touching a shared label, STOP work on that card, log exactly which
   label and why under Blocked/Questions in `progress.md`, and continue with
   the other seeds. Do not silently take the H027-style exception — that
   decision escalates to the orchestrator this time because it invalidates
   passing Easy evidence.
7. Update review metadata to match the rewritten variants:
   - `review.factBank.prohibited`: add every hook and fact-combination from
     your leak inventory.
   - `review.factBank.decisionUseful`: refine to the abstract facts the
     rewritten cards rely on.
   - `review.mediumLikelyGuesses`: 2-4 named public companies that genuinely
     fit the rewritten Medium card.
   - `review.hardLikelyGuesses`: >= 4 named public companies that genuinely
     fit the rewritten Hard card, ideally with the correct company NOT the
     most natural fit.
   - `review.reviewNotes`: note the H028 failure basis and the intended peer
     set per difficulty.
8. Remove stale `review.gate2.medium` and `review.gate2.hard` entries from all
   six seeds. Preserve `review.gate2.easy` untouched.
9. Self Gate 1 red-team pass before finishing each card: adopt the judge role
   cold (payload only) and write down your own top-5 guess list with
   confidences for Medium and Hard. If your own honest judgment beats the
   thresholds, rewrite again before moving on. Include these self-judgments in
   the report (clearly labeled as self-check, NOT stored Gate 2 results).
10. Export fresh payloads after all rewrites:

    ```powershell
    pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H029_payloads.json
    ```

## Do NOT

- Do not change company identity, ticker, accepted names, market data, dates,
  lookback/outcome prices, reveal text, sources, status, Easy hidden-card
  text, or the shared labels (title/era/decisionDateLabel/holdingPeriodLabel)
  — see instruction 6 for the escalation path.
- Do not edit `soul.md`, `roadmap.md`, `decisions.md`, schemas, validators,
  gate2 config/thresholds, or app code.
- Do not write new `review.gate2` model judgments — the follow-up blind Grok
  judge handoff owns those (D032). Self-check judgments go in the report only.
- Do not use company names, tickers, founder/CEO names, unmistakable product
  names, slogans, or era-unique hooks in hidden-card text.
- Do not make cards vague, contradictory, or decision-uninformative to dodge
  the judge.
- Do not add anything on the MVP exclusion list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. All six active seeds have rewritten Medium and Hard hidden-card variants;
   `pnpm --filter @signal-or-noise/content validate` passes 6/6 with no
   Gate 2 identity errors (missing Medium/Hard Gate 2 is expected and allowed
   at this stage).
2. `hiddenCard.easy`, `title`, `era`, `decisionDateLabel`, and
   `holdingPeriodLabel` are byte-identical in all six seeds (verify with
   `git diff`), unless a card was escalated under instruction 6.
3. `review.gate2.easy` is preserved untouched on all six seeds;
   `review.gate2.medium|hard` are removed.
4. Each Medium variant has 0-1 setup hints and `review.mediumLikelyGuesses`
   has 2-4 named public companies; each Hard variant has `setupHints: []`
   and `review.hardLikelyGuesses` has >= 4 named public companies.
5. `pnpm --filter @signal-or-noise/content gate2 -- check` reports 0 errors
   (12 missing Medium/Hard variants expected).
6. `agents/gate2/H029_payloads.json` exists with 18 payload entries.
7. `pnpm --filter @signal-or-noise/content test`, `pnpm test`,
   `pnpm typecheck`, and `pnpm build` all pass.
8. The report contains the per-card leak inventory, the self-check top-5
   judgments with confidences, and per-card Gate 1 rationale for the likely
   guesses.

## Verification Steps for the Executor

Run from repo root:

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H029_payloads.json
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
pnpm build
git diff -- packages/content/scenarios/active
git status --short
```

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R037_H029.md` per
`agents/reports/TEMPLATE.md`.

**Do NOT commit or push anything** - the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).

If blocked: set Status note, log the question in `progress.md`
Blocked/Questions, and stop.
