# H033 - Doc 09 Part B Pipeline Amendment + Plausible-Count WARN Recalibration

**Role:** Implementor
**Phase:** 4 Part B - Content generation at scale
**Status:** complete
**Model:** gpt-5.5
**Risk:** high (production content pipeline rulebook + Gate 2 WARN calibration)
**Audit:** orchestrator review of doc diff + tests; no formal Auditor
**Depends on:** D035, D036, D037, D038, C004
**Estimated scope:** medium - doc 09 rewrite of named sections, small Gate 2
config/evaluate change, tests as needed
**Context budget:** medium - C004 recommendations, D036–D038, doc 09 sections
named below, gate2 config/evaluate
**Output budget:** report <= 900 words

## Context

Phase 4 Part A is closed (D035). Part B will author 40 cards (D034) in four
batches of 10, but C004 found that doc 09 is not ready to drive generation
unchanged: the winning H029 peer-set / conjunction method is undocumented, the
prompt template still says Phase 3 / 100 cards, self-judging is optional, and
automated plausible-count WARNs fire noise on identity-passing cards.

User-approved pipeline policy is recorded in **D036** (fact-bank extension,
mandatory self-judge, WARN recalibration, Hard informativeness rule, batch
cadence), **D037** (chart-silhouette review ladder), and **D038** (production
source standard). This handoff encodes those decisions into doc 09 and the
offline Gate 2 WARN thresholds so batch-1 authoring (H034) can execute against
a single source of truth.

You do **not** author scenario cards. You do **not** run blind Gate 2.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D022, D026, D031, D032, D034, D035, D036, D037, D038
- Docs:
  - `docs/09_content_and_round_creation.md` — amend the sections listed in
    Prescriptive Instructions (read full file; the amendment breadth is the
    work)
- Prior artifacts:
  - `agents/consultations/C004_doc09_generation_readiness.md` — full memo
    (decision points + recommended workflow are the amendment checklist)
  - `agents/reports/R040_H030.md` — only the warning-pattern / pointing-fact
    evidence if needed for the banned-pattern appendix
- Source files:
  - `packages/content/src/gate2/config.ts`
  - `packages/content/src/gate2/evaluate.ts` (plausible-count WARN logic only)
  - `packages/content/src/types.ts` (`FactBank` type)
  - `packages/content/src/schema.ts` (`factBankSchema`)
  - `packages/content/tests/gate2-evaluate.test.ts` (update if WARN behavior
    assertions exist or must be added)
  - Optional skim of 1–2 active seeds' `review.gate2.*.guesses[].pointingFact`
    and `review.factBank.prohibited` for the banned-pattern appendix
- Commands for discovery:
  - `rg -n "plausibleMinCounts|100 curated|Phase 3 validator|fact bank|Gate 2" docs/09_content_and_round_creation.md packages/content/src/gate2`

If broader context seems necessary, stop and log under Blocked/Questions.

## Task Framing (micro-role)

Doc-and-config implementor for a settled product decision. Encode D036–D038
and C004's recommended structure into doc 09 and the WARN config. Do not
re-litigate thresholds, invent new gates, or expand schema beyond the optional
fact-bank fields named below.

## Objective

1. Amend `docs/09_content_and_round_creation.md` so it is the executable
   Part B generation playbook under D034/D036–D038.
2. Recalibrate automated Gate 2 plausible-count WARNs to under-2-only for
   Medium and Hard (D036 §3), with tests updated.
3. Optionally extend `FactBank` schema/types with **optional** structured
   fields so Part B cards can store peer sets without breaking the six
   existing seeds.

## Prescriptive Instructions

### A. Doc 09 amendments

Edit `docs/09_content_and_round_creation.md` in place. Preserve voice and
structure; update stale numbers and encode the new workflow. Required
changes:

1. **Content Goal + MVP Content Requirements:** replace the 100-card target
   with **40** curated scenario cards and the D034 mix (**24 famous / 12
   moderately known / 4 obscure**). Note that daily challenge pools (10) and
   famous market eras (10) are unchanged. Keep AI-assisted → validate →
   human review → active; no dynamic live generation.

2. **Authoring Workflow:** rewrite steps to match D036:
   - Choose candidate (track fame bucket: famous / moderate / obscure).
   - Gather sources per D038 (named source for every market data point and
     material reveal claim).
   - **Structured fact bank** (extends the three lists):
     - `revealOnly`, `decisionUseful`, `prohibited` (existing)
     - **Named peer set per difficulty** (Hard ≥ 4 named real public
       companies before prose; Medium/Easy peer sets remain plural after
       discriminators)
     - **Pointing fact or pointing conjunction** for each peer candidate
     - **Prohibited conjunctions**, including chart-plus-prose combinations
   - **Hard first** from a broad peer set and matched factual tension; then
     add **one controlled discriminator at a time** for Medium and Easy;
     recheck the whole payload after each addition. Never Easy-first and
     vague-down.
   - **Decision-informativeness check (Hard, D036 §4):** two causal
     non-identifying facts; Long and Short each one sentence; neither case
     applies unchanged to nearly any public company.
   - **Chart-silhouette review (D037):** treat distinctive lookback shape as
     an identity fact; prose must not confirm the silhouette favorite;
     escalate to user if only fix is window-shift, vagueness, or retirement.
   - Red-team likely guesses with pointing reasons (Gate 1 aspirations:
     Easy ≥ 2 / Medium 2–4 / Hard ≥ 4).
   - **Mandatory payload-only self-judge** (Gate 2-shaped top 5 + direction;
     no company/reveal fields). Compare to red-team lists. Revise on
     zero-overlap, correct-company dominance, or unsupported candidates.
     Record self-judge summary in `review.reviewNotes` or the completion
     report (self-judge is **not** stored as authoritative `review.gate2`).
   - Deterministic schema/leak validate.
   - Export payloads → **separate blind Grok Gate 2 handoff** (D032).
   - Human review + Gate 2 currency before `active` / `humanReviewed`.
   - Batch cadence note: four batches of ~10; playtests after batches 1–2;
     per-batch blind judge; rejudge only changed payloads.

3. **AI Prompt Template:** update the template block to include:
   - 40-card / D034 mix framing (not 100)
   - Structured fact-bank fields and conjunction-breaking instruction
   - Hard-first + one-discriminator Medium/Easy loop
   - Per-difficulty checklists (Hard: peer ≥ 4, L1 description, 0 hints,
     two causal facts, chart-silhouette check; Medium: name the single
     extra discriminator and why peer set stays plural; Easy: why the more
     direct clue is attainable without a literal/unique hook)
   - Mandatory payload-only self-judge schema (exactly 5 guesses with
     company/confidence/pointingFact; direction call/confidence/cue)
   - D038 source requirements
   - Stale "Phase 3 validator / manual Gate 2" language replaced with
     D031/D032 offline stored-result + agent-workflow judge

4. **Gate 1 / Gate 2 / Decision-Informativeness / Chart sections:**
   - Gate 1: keep 2–4 / ≥ 4 as **human authoring aspirations**; note that
     automated model plausible-count WARNs are under-2-only (D036 §3).
   - Gate 2: remove Phase 3 / manual-until-automated framing; document
     pinned Grok 4.5, stored `review.gate2`, agent workflow (D031/D032),
     identity thresholds unchanged, direction WARN-only, plausible-count
     WARN under-2-only for Medium and Hard.
   - Decision-Informativeness Floor: add the D036 §4 Hard one-sentence
     Long/Short causal-fact rule.
   - Chart Requirements / Gate 1: add D037 silhouette ladder (review →
     prose decouple → escalate; no silent window-shift).

5. **Source Requirements:** raise the bar per D038 for production/Part B
   cards (named source for market data + material reveal claims; acceptable
   source classes; human review is the coverage gate). Note prototype seeds
   remain D006-grade unless promoted.

6. **Banned-pattern appendix (new section):** add a concise appendix grouped
   by **pattern type** (not company name lists alone), distilled from prior
   Gate 2 `pointingFact`s and prohibited facts. Suggested groups:
   - Famous thesis / hindsight framing
   - Distinctive product or transition hooks
   - Business-model silhouette (too few real peers)
   - Date/era + sector conjunctions
   - Chart-plus-prose confirmation
   Each group: 1–3 short "do not write" patterns + 1 "prefer instead" rewrite
   pattern. Pull patterns from C004 exemplars and stored pointing facts;
   do not dump raw company-specific spoilers that would teach the next
   author the answer key for existing seeds.

7. **Scenario Mix / Validation / Human Review checklists:** align counts
   with D034; add self-judge, silhouette, source-coverage, and
   batch-activation items; remove any 100-card or "manual Gate 2 until
   Phase 3" residue.

8. **Do not** rewrite Calibrated Pass/Fail Examples unless a line directly
   contradicts D036–D038; small cross-links are fine.

### B. Optional FactBank schema extension

If straightforward and non-breaking:

- Extend `FactBank` / `factBankSchema` with **optional** fields such as:
  - `peerSets?: { easy?: string[]; medium?: string[]; hard?: string[] }`
  - `prohibitedConjunctions?: string[]`
- Existing three required arrays stay required.
- Do **not** migrate the six active seeds in this handoff (optional fields
  may be absent).
- If adding fields would force large validation refactors, skip the schema
  change and document peer sets / conjunctions as required **content** in
  `review.reviewNotes` + factBank.prohibited text for Part B; note the skip
  in the report.

### C. Plausible-count WARN recalibration (code)

In `packages/content/src/gate2/config.ts` and `evaluate.ts`:

1. Medium automated plausible-count WARN: fire **only when count < 2**.
   Remove the above-4 (max) WARN path.
2. Hard automated plausible-count WARN: fire **only when count < 2**
   (change min from 4 to 2).
3. Easy stays warn when count < 2.
4. **Do not** change D031 identity thresholds, direction WARN, medium
   dominance WARN, model pin, or prompt version.
5. Update types/messages so they no longer claim "want 2–4" / "want >= 4"
   for automated model plausible counts.
6. **Do not** change authoring `LIKELY_GUESS_COUNT_RULES` in
   `validation.ts` (mediumLikelyGuesses 2–4 / hardLikelyGuesses ≥ 4 remain
   the human list aspirations unless a message string would falsely claim
   they are Gate 2 automated thresholds — only fix confusing cross-talk if
   you find it).
7. Add or adjust a focused unit test proving: Medium with 5 plausible
   guesses does **not** WARN on count; Hard with 2–3 plausible guesses does
   **not** WARN on count; count 0–1 still WARNs for Medium/Hard.

### D. Out of scope for this handoff

- No new scenario JSON, no draft cards, no blind judging, no pool/era files.
- No D031 identity threshold changes.
- No commits.

## Do NOT

- Do not re-open or contradict D031 identity thresholds, D032 agent-workflow
  Gate 2, D034's 40-card target, or D035's Part A close.
- Do not author or edit scenario JSON under `packages/content/scenarios/`.
- Do not change scoring math, app UI, or game-engine code.
- Do not promote plausible-count WARNs to errors.
- Do not invent a new Gate 3 or new permanent role.
- Do not edit `soul.md`, `roadmap.md`, or `decisions.md`.
- Do not build anything on the MVP exclusion list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. Doc 09 Content Goal / MVP requirements say **40** cards with **24/12/4**
   mix (not 100).
2. Doc 09 Authoring Workflow and AI Prompt Template encode structured
   fact bank, Hard-first one-discriminator loop, mandatory payload-only
   self-judge, D036 Hard informativeness rule, D037 silhouette ladder,
   D038 sources, and D031/D032 Gate 2 workflow (no stale Phase 3 / 100-card
   / "manual until automated" residue in those sections).
3. Doc 09 has a banned-pattern appendix grouped by pattern type.
4. Gate 2 automated plausible-count WARNs are under-2-only for Medium and
   Hard; identity thresholds unchanged in `config.ts`.
5. Focused tests cover the new WARN behavior; `pnpm --filter
   @signal-or-noise/content test`, `pnpm test`, and `pnpm typecheck` pass.
6. `pnpm --filter @signal-or-noise/content validate` and `gate2 -- check`
   still run; plausible-count WARN noise on existing identity-passing cards
   is reduced or gone (report before/after warning counts).
7. Six active scenario JSON files are unchanged unless you explicitly
   document a forced schema migration (prefer zero seed edits).

## Verification Steps for the Executor

```powershell
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
git status --short
git diff --stat
```

Confirm doc 09 no longer contains a live "100 curated" MVP target in Content
Goal / MVP requirements (historical mentions elsewhere may remain only if
clearly non-normative; prefer updating them).

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R###_H033.md` per
`agents/reports/TEMPLATE.md` (next free R-number).

Include in the report: list of doc 09 sections touched; WARN before/after
counts from `validate` / `gate2 check`; whether optional FactBank fields
were added or deferred.

**Do NOT commit or push anything** — the orchestrator reviews your report and
uncommitted diff, then commits on approval (D012).

If blocked: set Status note, log the question in `progress.md`
Blocked/Questions, and stop.
