# H011 — Placeholder Deck Content Fix-up (A003 Findings)

**Role:** Implementor (curator micro-role)
**Phase:** 1→2 transition (placeholder content quality gate)
**Status:** complete
**Model:** Grok 4.5 (user-routed change on 2026-07-09; content fix-up with bounded local judgment)
**Risk:** medium (user-visible game content → Auditor re-check required; cross-model rule: GPT 5.5 re-audits)
**Depends on:** H009, H010/A003
**Estimated scope:** medium — rewrite ~7–10 hidden-card variants + reshape 2–3 lookback series + update red-team appendix + self-run both gates

## Context

Audit `agents/audits/A003_H009.md` (read it in full — it is the work order)
failed the placeholder deck's content quality: literal hygiene is clean, but
whole-card triangulation over-identifies the company. 5 of 9 Gate 2 spot checks
failed (all 3 pinned Mediums; BlackBerry + Boeing Hard), plus two
distinctive-hook violations (GameStop Easy, Boeing Easy). The audit's key
insight: **the lookback price series is a first-class triangulation input** —
BlackBerry Hard failed at 78% while using rulebook-compliant prose because the
steep 2008 run-up chart did the identifying. The user has approved reshaping
`lookbackPrices` where the chart is the leak.

## Task Framing (micro-role)

You are acting as a scenario content curator. Your rulebook is
`docs/09_content_and_round_creation.md` — specificity ladder, universal bans,
distinctive-hook and hindsight-thesis bans, plausible-alternative minimums,
decision-informativeness floor, Gate 1/Gate 2 protocol. `soul.md` content
integrity binds everything. This is judgment-heavy writing work: you own the
wording, the abstraction strategies, and the chart reshaping, within the
constraints below.

## Objective

Rework the flagged content in `apps/web/lib/sampleScenarios.ts` (and the
red-team appendix) so the deck passes both doc 09 gates — verified by your own
Gate 2 runs before you report.

## Required Scope (from A003 — see its Findings for specifics)

1. **Gate 2 BLOCKER rewrites:** visa Medium, microsoft Medium, starbucks
   Medium, blackberry Hard, boeing Hard.
2. **Distinctive-hook rewrites:** gamestop Easy, boeing Easy.
3. **Gate 1 dominance/thin-set flags:** starbucks Easy, boeing Medium,
   blackberry Medium — fix or justify in your report why the variant is
   acceptable under the doc 09 minimums.
4. **Chart-shape leaks:** reshape `lookbackPrices` where the series is what
   identifies the company (BlackBerry and Boeing at minimum; your judgment
   elsewhere), subject to the invariants below.
5. **Update `agents/reports/R007_H009_redteam.md`** so its fact banks and
   candidate lists reflect the rewritten variants (A003 found the Hard lists
   over-claimed camouflage).

## Hard Constraints (not delegated)

- Clue counts stay Easy 3 / Medium 2 / Hard 1 (D022). Scenario `id`s,
  `companyName`, `ticker`, `acceptedNames`, `actualReturnPercent`, and
  `outcomePrices` do not change.
- Chart invariants when reshaping `lookbackPrices`: the last lookback price
  must equal `outcomePrices[0]` (check each scenario — this holds today), the
  series must stay era-plausible for the real company, and its directional
  story must not contradict the clues. Same array length as the original.
- Titles must still meet the HARD identifiability bar.
- Do not loosen or reinterpret the doc 09 Gate 2 thresholds — content moves,
  thresholds don't.
- Only these files may change: `apps/web/lib/sampleScenarios.ts`,
  `agents/reports/R007_H009_redteam.md`, `progress.md`, your R### report, and
  this handoff's Status field.

## Self-Verification (required before reporting)

1. `pnpm typecheck` and `pnpm test` pass from repo root. If `pnpm` is not on
   PATH, prepend `%LOCALAPPDATA%\nodejs\node-v24.18.0-win-x64` to PATH.
2. **Gate 1**: whole-payload candidate lists for every variant you touched,
   recorded in your report against the doc 09 minimums.
3. **Gate 2**: re-run the exact A003 procedure (its Part C records the working
   command) on ALL NINE originally pinned variants plus every additional
   variant you rewrote. Every rewritten variant must PASS its threshold;
   originally-passing pins must still pass. Record verbatim transcripts in
   your report. Fresh `grok` single-turn sessions, payload files in `%TEMP%`,
   never a company name in a payload.
4. If a variant cannot pass Gate 2 after two rewrite attempts, stop iterating
   on it, document both attempts + transcripts in your report, and flag it for
   the orchestrator rather than burning more attempts.

## Do NOT

- Do NOT touch game-engine code, scoring, UI components, or any screen logic.
- Do NOT change doc 09, `soul.md`, `decisions.md`, or `roadmap.md`.
- Do NOT run `git commit` or `git push` (D012 — leave everything uncommitted).
- Do NOT add/remove scenarios or alter the D022 clue-count structure.
- Anything on the MVP exclusion list in soul.md.

## Acceptance Criteria

1. All variants listed in Required Scope 1–2 rewritten; diff confirms.
2. Gate 2 transcripts in the report show PASS for all 9 original pins plus all
   rewritten variants (or a documented two-attempt flag per Self-Verification 4).
3. Gate 1 lists recorded for every touched variant, meeting doc 09 minimums.
4. Zero literal leaks introduced (name/ticker/founder/product/slogan scan of
   changed strings).
5. Clue counts still 3/2/1 across all 12 scenarios; `pnpm typecheck` and
   `pnpm test` pass.
6. Red-team appendix updated for every rewritten variant.
7. Everything left uncommitted; report filed.

## Reporting

Set Status to `complete`, append a `progress.md` session entry, and write
`agents/reports/R008_H011.md` per `agents/reports/TEMPLATE.md`, including the
Gate 1 lists and Gate 2 transcripts. **Do NOT commit or push** — the
orchestrator reviews your report and uncommitted diff, then GPT 5.5 re-audits
(cross-model rule). If blocked, log under Blocked/Questions in `progress.md`
and stop.
