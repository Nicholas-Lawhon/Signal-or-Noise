# H009 — Per-Difficulty Hidden Cards for the Placeholder Deck

**Role:** Implementor
**Phase:** 2 (content-design thread; placeholder deck, D006/D020)
**Status:** complete
**Model tier:** claude-subagent (per `agents/routing.md` — content judgment above DeepSeek grade)
**Risk:** medium — user-visible content bound by leakage rules → Auditor pass required (D019)
**Depends on:** H008 (rulebook finalized via C001; committed)
**Estimated scope:** medium-large — small code change + 12 scenarios × 3 authored variants under strict content rules

## Context

Playtesting showed difficulty changed nothing but bankroll: every placeholder
scenario has ONE hidden-text set shared by all difficulties, and several
titles/descriptions identify the company outright ("The Streaming Pivot" +
Jan 2012 = Netflix). D022 introduced difficulty-scaled clue counts
(Easy 3 / Medium 2 / Hard 1) and a binding Scenario Content Rulebook in
`docs/09_content_and_round_creation.md` (universal bans, specificity ladder
L1–L4 with escalation rules, B/S/M clue taxonomy, decision-informativeness
floor, whole-card triangulation gate with plausible-alternative minimums,
title-passes-Hard-bar rule). This handoff makes the placeholder deck comply.
Market data, scoring, and reveal behavior do not change.

## Task Framing (micro-role)

For this task you are both implementor and placeholder content author: apply
the doc 09 Scenario Content Rulebook and its Authoring Workflow (fact bank →
Hard first → Medium → Easy → red-team) to every card. The rulebook's
"Calibrated Pass/Fail Examples" section shows the exact leak patterns present
in the current deck — your rewrites must not reproduce them.

## Objective

Every placeholder scenario has three rulebook-compliant hidden-card variants;
the run screen shows the variant (and clue count) matching the chosen
difficulty; all titles pass the Hard identifiability bar.

## Prescriptive Instructions

1. Read `soul.md`, `roadmap.md`, `progress.md`, `AGENTS.md`, and the FULL
   Scenario Content Rulebook + Authoring Workflow + prompt-template rules in
   `docs/09_content_and_round_creation.md`. The rulebook is your acceptance
   standard for every sentence you write.
2. In `apps/web/lib/sampleScenarios.ts`, restructure the type:

   ```ts
   export type HiddenCardVariant = {
     companyDescription: string;
     macroContext: string;
     clues: string[]; // Easy 3, Medium 2, Hard 1 (D022)
   };
   ```

   Replace `PrototypeScenario`'s `companyDescription`, `macroContext`, and
   `clues: [string, string, string]` fields with:

   ```ts
   hidden: {
     easy: HiddenCardVariant;
     medium: HiddenCardVariant;
     hard: HiddenCardVariant;
   };
   ```

   All other fields (id, companyName, ticker, acceptedNames, title, era,
   labels, actualReturnPercent, reveal fields, price arrays) keep their
   current names, values, and types. Do NOT change any market data, return,
   price array, acceptedNames list, or reveal text.
3. For each of the 12 scenarios, author the three variants per the doc 09
   Authoring Workflow: build the private fact bank first, write HARD first,
   then Medium, then Easy. Clue counts exactly 3/2/1. Respect the
   per-difficulty specification table (taxonomy slots, specificity caps,
   plausible-alternative minimums: Easy ≥2 / Medium 2–4 / Hard ≥4). Every
   variant needs a concrete Long driver and a concrete Short risk
   (informativeness floor).
4. Re-check every `title` against the Hard bar (combined with the era and
   date labels the player sees). Rewrite any title that fails — expect most
   current titles to fail. Titles are flavor, not hints.
5. In `apps/web/app/play/classic/run/page.tsx`, select the variant with the
   run's existing difficulty value (already available from the
   `?difficulty=` query param used for the starting bankroll) and render
   `hidden[difficulty].companyDescription`, `.macroContext`, and `.clues`
   where the old flat fields were rendered. No other UI changes.
6. In `apps/web/app/play/classic/page.tsx`, update the three difficulty
   explainers to exactly:
   - easy: `3 direct clues.`
   - medium: `2 balanced clues.`
   - hard: `1 abstract clue.`
7. Fix any other compile errors caused by the type change (search for usages
   of the removed fields), then run `pnpm typecheck` and `pnpm test` from the
   repo root.
8. Write your red-team record to `agents/reports/R007_H009_redteam.md`: for
   every scenario, the fact bank (reveal-only / decision-useful / prohibited)
   and, per variant, the likely player guesses EACH with the hidden fact that
   points there. This file is the review-notes substitute for placeholder
   data and is required for the audit's Gate 1/Gate 2 checks.

## Do NOT

- Change game-engine code, scoring math, reveal logic, guess matching, or
  `acceptedNames`.
- Change any number: returns, prices, bankrolls, dates.
- Add scenarios, remove scenarios, or reorder the pool (D020's 12 stand).
- Add dependencies, new components, or UI redesigns.
- Copy any current hidden-card sentence verbatim into a variant without
  re-checking it against the rulebook — most existing text fails.
- Anything on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `pnpm typecheck` and `pnpm test` pass from repo root (24 existing tests
   unaffected).
2. `apps/web/lib/sampleScenarios.ts` has `hidden.easy/medium/hard` on all 12
   scenarios with clue counts exactly 3/2/1 (verify:
   `easy.clues.length===3`, `medium.clues.length===2`,
   `hard.clues.length===1` for every entry).
3. Playing the same scenario at two difficulties shows different hidden text
   and different clue counts (manual: start an Easy run and a Hard run, open
   round 1).
4. No hidden-card field (title, companyDescription, macroContext, clues) at
   any difficulty contains a Universal Bans violation from doc 09 — including
   the distinctive-hook and hindsight-thesis bans.
5. Difficulty explainer copy matches step 6 exactly.
6. `agents/reports/R007_H009_redteam.md` exists with a fact bank per scenario
   and reasoned guess lists per variant meeting the plausible-alternative
   minimums.

## Verification Steps for the Implementor

`pnpm install` → `pnpm typecheck` → `pnpm test` → `pnpm dev`, then play at
least 3 rounds at each difficulty checking criterion 3 and spot-checking
criterion 4 against the rulebook's calibrated examples.

## Reporting

On completion: set Status to `complete`, append a session entry to
`progress.md`, and write the completion report to
`agents/reports/R007_H009.md` per `agents/reports/TEMPLATE.md` (the red-team
file from step 8 is an appendix to it, not a replacement).
**Do NOT commit or push anything** (D012) — the orchestrator reviews report +
diff, then an Auditor pass (content-leakage scan + Gate 2 guessability spot
checks) gates approval. If blocked: log under Blocked/Questions in
`progress.md` and stop.
