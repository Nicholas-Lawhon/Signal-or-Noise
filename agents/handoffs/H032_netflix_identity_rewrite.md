# H032 - Netflix Medium+Hard Identity Rewrite

**Role:** Content Curator
**Phase:** 4 Part A - Content rules & validator hardening
**Status:** approved
**Model:** gpt-5.6-terra (High reasoning)
**Risk:** high (active scenario content quality and Gate 2 guessability)
**Audit:** orchestrator review + follow-up blind Grok 4.5 rejudge of the two
changed payloads
**Depends on:** H029, H030, R041
**Estimated scope:** small - one seed, Medium/Hard variants only
**Context budget:** small - one seed, its judge evidence, thresholds
**Output budget:** report <= 700 words

**High-reasoning rationale (D029/D033):** Same adversarial red-team skill
that took the other five seeds from 6/6 fails to passes in H029. Netflix is
the hardest remaining case: the judge triangulates from the unchangeable
boom-then-collapse lookback silhouette, so the fix must decouple the prose
frame from the chart, not just remove hooks. Margins are small (Medium lead
18 vs 15; Hard conf 20 vs 15) — a focused pass is cheaper than replacing the
seed. Expected context: one seed + R040 evidence. Expected output: one edited
JSON + short report.

## Context

After H029/H030, five of six active seeds pass Medium+Hard Gate 2 identity.
Netflix fails both by small margins: Medium — correct #1 at conf 34 with an
18-point lead over #2 (threshold 15); Hard — correct #1 at conf 20 (threshold
15, correct must effectively vanish from a confident top-5). The judge's
stated leak (R040): the boom-then-collapse lookback silhouette into a 2012
engagement/retention frame identifies Netflix even through abstract prose.

The chart cannot change (market data is frozen). What can change is the
conjunction: the Medium/Hard prose currently reads as
subscription-media/engagement, which combined with that silhouette points at
one company. This handoff is a targeted fourth pass on this one seed. If it
fails the follow-up blind rejudge, the orchestrator/user fall back to
replacing the seed — do not try to force a pass by vagueness or by touching
frozen fields.

A parallel handoff (H031) is reviewing doc 09; it does not touch scenario
JSON. You own `scenario_netflix_2012_2017.json` and `progress.md` for this
run.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D022, D026, D031, D032
- Docs:
  - `docs/09_content_and_round_creation.md` sections: `Specificity Ladder`,
    `Per-Difficulty Specification`, `Decision-Informativeness Floor
    (anti-randomness)`, `Gate 1 — Whole-Card Triangulation Review (human)`
- Prior artifacts:
  - `agents/reports/R040_H030.md` — Netflix rows and the silhouette finding
  - `agents/handoffs/H029_medium_hard_identity_rewrite.md` — the
    anti-triangulation technique list (instruction 3) that worked on the
    other five seeds
- Source files:
  - `packages/content/scenarios/active/scenario_netflix_2012_2017.json` —
    including the stored `review.gate2.medium|hard` guesses and their
    `pointingFact` values (your red-team target list)
  - `packages/content/src/gate2/config.ts` — exact thresholds
- Commands for discovery:
  - `pnpm --filter @signal-or-noise/content validate`
  - `pnpm --filter @signal-or-noise/content gate2 -- check`

If broader context seems necessary, stop and log the requested expansion
under Blocked/Questions instead of reading unrelated history.

## Task Framing (micro-role)

Adversarial red-team content editor, silhouette-aware: assume the judge sees
the lookback chart shape first, forms a candidate set from it, and uses the
prose to pick among those candidates. Your prose must not confirm the
silhouette's favorite.

## Objective

Rewrite the Netflix Medium and Hard hidden-card variants so a blind judge who
recognizes the boom-collapse-recovery silhouette still cannot beat D031
thresholds: Medium — correct not #1 at conf >= 40 and no >= 15-point lead;
Hard — correct absent from a top-5 at conf >= 15. Keep Easy text and shared
labels byte-identical, remove the stale Netflix Medium/Hard Gate 2 entries,
update review metadata, and export fresh payloads.

## Prescriptive Instructions

1. Build the leak inventory from the stored `review.gate2.medium|hard`
   guesses/pointingFacts, explicitly separating (a) silhouette-driven
   inference (unfixable) from (b) prose facts that confirm the
   silhouette-implied candidate (your target).
2. Rewrite only `hiddenCard.medium.*` and `hiddenCard.hard.*` player-facing
   fields (companyDescription, macroContext, situation, longCase, shortCase,
   setupHints). Apply the H029 technique list, plus the silhouette-specific
   move: reframe the business tension so it fits companies whose charts ALSO
   show a boom-collapse-recovery in that era — the prose should make the
   silhouette's runner-up candidates (e.g. other 2011-2012 casualties)
   fit at least as well as the actual company. The stored guess lists name
   the judge's own alternatives; make the prose embrace them.
3. Preserve the Decision-Informativeness Floor: concrete Long and Short cases
   remain mandatory. If you cannot beat the thresholds without going vague,
   STOP, log it under Blocked/Questions in `progress.md`, and report — seed
   replacement is the fallback and that call belongs to the user.
4. Keep `hiddenCard.easy`, `title`, `era`, `decisionDateLabel`,
   `holdingPeriodLabel`, company identity, market data, reveal, sources, and
   status byte-identical. Shared-label changes escalate (same rule as H029
   instruction 6) — do not take them silently.
5. Update `review.factBank.prohibited` (add the confirmed leak conjunctions),
   `review.mediumLikelyGuesses` (2-4 named companies), `review.hardLikelyGuesses`
   (>= 4 named companies), and `review.reviewNotes` (H030 failure basis +
   intended peer set).
6. Remove `review.gate2.medium` and `review.gate2.hard` from the Netflix seed
   only. Preserve `review.gate2.easy`. Do not touch the other five seeds.
7. Self-judge pass (payload only, silhouette assumed known): write your
   honest top-5 with confidences for Medium and Hard in the report. If your
   own judgment beats the thresholds, rewrite again first.
8. Export fresh payloads:

   ```powershell
   pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H032_payloads.json
   ```

   (The export contains all 18 entries; only the two Netflix Medium/Hard
   payloads changed and need rejudging.)

## Do NOT

- Do not modify any file of the other five scenarios.
- Do not change frozen Netflix fields (instruction 4 list).
- Do not write new `review.gate2` model judgments — the follow-up blind Grok
  rejudge owns those (D032); self-checks go in the report only.
- Do not use company names, tickers, founder/CEO names, unmistakable product
  names, slogans, or era-unique hooks in hidden-card text.
- Do not fix guessability with vagueness or contradiction (see instruction 3
  stop rule).
- Do not edit `soul.md`, `roadmap.md`, `decisions.md`, doc 09, schemas,
  validators, or gate2 config/thresholds.
- Do not build anything on the MVP exclusion list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. Netflix Medium/Hard hidden-card variants are rewritten;
   `pnpm --filter @signal-or-noise/content validate` passes 6/6 (missing
   Netflix Medium/Hard Gate 2 is expected; other five seeds' stored results
   unchanged).
2. Netflix Easy text, shared labels, identity, market data, reveal, sources,
   status, and `review.gate2.easy` are byte-identical (verify with
   `git diff`); the other five scenario files are untouched.
3. Netflix `review.gate2.medium|hard` removed; review metadata updated per
   instruction 5.
4. `pnpm --filter @signal-or-noise/content gate2 -- check` reports 0 errors
   (2 missing Netflix variants expected).
5. `agents/gate2/H032_payloads.json` exists with 18 entries.
6. `pnpm --filter @signal-or-noise/content test`, `pnpm test`,
   `pnpm typecheck`, and `pnpm build` pass.
7. Report contains the leak inventory (silhouette vs prose split), the
   self-judge top-5s with confidences, and the Gate 1 rationale for the new
   likely-guess lists.

## Verification Steps for the Executor

Run from repo root:

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H032_payloads.json
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
pnpm build
git diff -- packages/content/scenarios/active
git status --short
```

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R044_H032.md` per
`agents/reports/TEMPLATE.md`.

**Do NOT commit or push anything** - the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).

If blocked: set Status note, log the question in `progress.md`
Blocked/Questions, and stop.
