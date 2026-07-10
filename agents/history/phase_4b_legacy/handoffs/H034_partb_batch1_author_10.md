# H034 - Part B Batch 1: Author 10 Scenario Cards

**Role:** Content Curator
**Phase:** 4 Part B - Content generation at scale
**Status:** approved
**Model:** gpt-5.5
**Risk:** high (production scenario content)
**Audit:** orchestrator review + mandatory follow-up blind Gate 2 (H035);
user playtest after batch 1 lands
**Depends on:** H033 (doc 09 + WARN calibration must be complete and
orchestrator-approved before dispatch), D036, D037, D038
**Estimated scope:** large - 10 full scenario JSON files (Easy/Medium/Hard),
fact banks, self-judges, export
**Context budget:** medium - amended doc 09, D036–D038, schema, 1–2 style
exemplars; not full Gate 2 history
**Output budget:** report <= 1,200 words (plus per-card self-judge tables)

## Context

Phase 4 Part B generates **40** production-grade scenario cards (D034:
24 famous / 12 moderate / 4 obscure) as JSON seeds, then pools and eras.
Pipeline policy is **D036**; chart silhouettes **D037**; sources **D038**.
Doc 09 was amended in H033 to match.

This is **batch 1 of 4**: author **10 new** cards into `draft/`, roughly
**6 famous / 3 moderately known / 1 obscure**. Do not mark cards
`humanReviewed` or `active`. Do not write blind Gate 2 results — that is
H035 (Grok), which will also fold in the two Netflix Medium/Hard payloads
from H032 per D035.

The six existing `active/` seeds are **prototype-grade** (D006) and stay
untouched. Prefer **companies not already in** the active set (Amazon,
Apple, Microsoft, Netflix, NVIDIA, Visa) so the library gains variety.
Different historical windows of those companies are allowed only if the
window is clearly distinct and you still need famous coverage — default is
new companies.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D022, D026, D031, D032, D034, D036, D037, D038
- Docs:
  - `docs/09_content_and_round_creation.md` — full amended document
    (Authoring Workflow, AI Prompt Template, Rulebook, Gate 1/2,
    Source Requirements, banned-pattern appendix, Chart Requirements)
  - `docs/06_data_model.md` — only if field shapes are unclear; prefer
    schema as source of truth
- Prior artifacts:
  - `agents/consultations/C004_doc09_generation_readiness.md` — optional;
    only the Recommended 40-card workflow section if needed
- Source files:
  - `packages/content/src/schema.ts` and `packages/content/src/types.ts`
  - One style exemplar from `packages/content/scenarios/active/` (e.g.
    Amazon or Visa) for Balanced Tension shape — **do not copy** their
    prose or windows
  - `packages/content/src/gate2/config.ts` — D031 thresholds for self-judge
- Commands for discovery:
  - `pnpm --filter @signal-or-noise/content validate`
  - `pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H034_payloads.json`

Do not read full H028–H032 rewrite history. Do not open other agents'
uncommitted work outside this scope.

## Task Framing (micro-role)

Production content author + adversarial self-editor. Fact bank and peer sets
before prose; Hard first; payload-only self-judge before export. Optimize for
playable Long/Short debate and D031-safe identity — not for trivia "gotchas"
or for forcing famous names through at the cost of vagueness.

## Objective

Deliver 10 schema-valid scenario JSON files in
`packages/content/scenarios/draft/`, each with Easy/Medium/Hard variants,
honest review metadata, D038 sources, payload-only self-judge evidence in
the report, and an exported Gate 2 payload file for H035.

## Prescriptive Instructions

### 1. Select the batch-1 slate

Choose 10 candidates matching approximately:

| Bucket | Count | Guidance |
|--------|------:|----------|
| Famous | 6 | Widely known public companies / iconic market stories |
| Moderate | 3 | Recognizable to market-aware players, not household-universal |
| Obscure | 1 | Real public company; fair with clues; not a trivia troll |

Constraints:

- One scenario = one company + one historical window; three hidden-card
  variants inside one JSON file.
- Prefer mix of long/short outcomes and eras across the batch (doc 09 return
  mix / era variety guidance).
- No duplicate of an existing active `id` or identical company+window.
- Record the slate (company, ticker, window, fame bucket, hypothesized
  direction) in the report before detailing prose work.

If a candidate dies on silhouette/identity or source quality, replace it
within the batch rather than shipping a known-fail card.

### 2. Per card — research and sources (D038)

For each card:

- Confirm decision date, end date, split-adjusted prices, and
  `actualReturnPercent` (decimal, e.g. +35% → `0.35`).
- Put **named sources** in `sources` covering every market data point and
  every material reveal claim (`shortText`, `funFact`, each `whyItMoved`
  bullet). Prefer price provider + filings/reputable journalism.
- Do not invent prices or returns.

### 3. Per card — structured fact bank (D036 §1)

Before writing player-facing prose, build:

- `revealOnly`, `decisionUseful`, `prohibited`
- Named **peer sets** per difficulty (Hard ≥ 4 real public companies)
- Pointing fact/conjunction per peer candidate
- **Prohibited conjunctions**, including any chart-plus-prose path
- Chart-silhouette note (D037): is the lookback distinctive? If yes, list
  other companies that could share a similar shape in-era and plan prose
  that does not confirm the favorite

Store structured fields in `review.factBank` when the schema supports
optional peer/conjunction fields (H033); otherwise encode peer sets and
conjunctions clearly in `review.reviewNotes` **and** list dangerous
conjunctions inside `factBank.prohibited`.

### 4. Per card — author Hard → Medium → Easy

Follow amended doc 09:

- **Hard first:** L1 companyDescription, broad era macro, situation +
  matched longCase/shortCase, `setupHints: []`. Two causal
  non-identifying facts; Long and Short each articulable in one sentence;
  neither applies to nearly any public company.
- **Medium:** add **one** controlled discriminator; setupHints 0–1
  (prefer 0 if identity risk high); peer set remains plural.
- **Easy:** more direct industry/business-model language; exactly 1
  setup hint; Call the Company attainable without literal name/ticker/
  product/slogan leaks.
- Shared pre-decision labels (`title`, `era`, `decisionDateLabel`,
  `holdingPeriodLabel`) must meet the **Hard** identifiability bar.
- Balanced Tension (D026): every variant has situation/longCase/shortCase;
  no directional sentiment leaks; no outcome in the hidden card.
- Lookback chart ends on or before decision date; no outcome period in
  pre-decision series.

### 5. Per card — red-team lists + payload-only self-judge (D036 §2)

- Fill `easyLikelyGuesses` (≥ 2), `mediumLikelyGuesses` (2–4),
  `hardLikelyGuesses` (≥ 4) with real company names.
- Self-judge **only** from the pre-decision payload (same fields a player
  sees). Produce Gate 2-shaped top 5 (company, confidence 0–100,
  pointingFact) + direction for **each** difficulty.
- Compare to red-team lists. **Rewrite and re-self-judge** if:
  - correct company dominates past D031 thresholds on your own judge, or
  - zero overlap with red-team list, or
  - candidates lack payload support, or
  - Hard fails the one-sentence causal informativeness check, or
  - silhouette + prose still points uniquely at one company
- Put self-judge tables in the **report** (and a short summary in
  `review.reviewNotes`). **Do not** write `review.gate2` — H035 owns
  authoritative blind results.
- If D037 escalation is required (cannot pass without window-shift or
  vagueness): drop/replace the candidate; log any user-escalation case in
  Blocked/Questions rather than shipping a broken card.

### 6. File format and review metadata

- Path: `packages/content/scenarios/draft/scenario_<company>_<startyear>_<endyear>.json`
- `status`: `"draft"`
- `review.generatedByAi`: `true` if AI-assisted (expected)
- `review.humanReviewed`: **`false`**
- `review.reviewNotes`: fact-bank summary, fame bucket, peer-set intent,
  self-judge outcome, any aspiration shortfalls (e.g. Hard peer count
  below 4 with reason)
- No `review.gate2` object (or leave absent)

### 7. Validate and export

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H034_payloads.json
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
```

- All 10 draft cards must pass validate (schema + leakage + business rules).
- Export must include the new draft scenarios' payloads (and may include
  active seeds depending on export defaults — report what the file
  contains). H035 will judge batch-1 drafts + Netflix Medium/Hard; state
  clearly which `scenarioId`+difficulty rows are in scope for judging.
- Do not edit files under `packages/content/scenarios/active/`.

## Do NOT

- Do not mark any card `active` or `humanReviewed: true`.
- Do not write `review.gate2` model judgments (H035).
- Do not modify the six active seeds or app/engine/schema beyond what H033
  already shipped (you are Content Curator — no package source edits).
- Do not invent market data without sources.
- Do not put company name, ticker, founder/CEO, unmistakable product names,
  or slogans in hidden-card fields or titles.
- Do not fix identity with vagueness that fails the decision-informativeness
  floor.
- Do not window-shift or fabricate chart history to dodge a silhouette
  (D037 — replace or escalate).
- Do not create daily pools or famous eras (later handoff).
- Do not edit `soul.md`, `roadmap.md`, `decisions.md`, or doc 09.
- Do not build anything on the MVP exclusion list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. Exactly 10 new draft scenario JSON files exist under
   `packages/content/scenarios/draft/` with mix ~6 famous / 3 moderate /
   1 obscure, reported in the completion report.
2. Each file is schema-valid with Easy/Medium/Hard, Balanced Tension fields,
   correct setup-hint counts, and `status: "draft"`,
   `humanReviewed: false`.
3. Each card has a structured fact bank + peer-set/conjunction evidence
   (schema fields and/or reviewNotes per H033 outcome) and D038-grade
   `sources`.
4. Report includes payload-only self-judge top-5 + direction for every
   variant (30 self-judges) and states that none of your self-judges beat
   D031 fail thresholds (or documents rewrites until that is true).
5. No `review.gate2` authoritative blocks written by this handoff.
6. `pnpm --filter @signal-or-noise/content validate` passes for the draft
   set; `agents/gate2/H034_payloads.json` exists and is described.
7. Active seeds are byte-identical (`git diff` clean under `scenarios/active`).
8. `pnpm test` and `pnpm typecheck` pass.

## Verification Steps for the Executor

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H034_payloads.json
pnpm test
pnpm typecheck
git status --short
git diff --stat -- packages/content/scenarios/active
```

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R###_H034.md` per
`agents/reports/TEMPLATE.md`.

Report must include: slate table (bucket, company, window, return sign);
per-card self-judge summary; any replaced candidates; export path and
in-scope payload list for H035; known identity/silhouette risks.

**Do NOT commit or push anything** — the orchestrator reviews your report and
uncommitted diff, then commits on approval (D012).

If blocked: set Status note, log the question in `progress.md`
Blocked/Questions, and stop.
