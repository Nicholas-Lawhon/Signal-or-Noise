# H013 — Scenario Information Design Consultation

**Role:** Consultant
**Phase:** 3 pre-work (content-design gate before schema/content pipeline)
**Status:** complete
**Model:** grok-4.5
**Risk:** high
**Audit:** none — consultant memo; orchestrator and user review before any decision/doc/schema changes
**Depends on:** D022, C001, D024, D025
**Estimated scope:** medium — one design memo with concrete recommendation, no code

## Context

Playtests found two content-design problems that are not solved by the current
leakage/guessability rulebook alone. First, hidden-card hints often carry obvious
positive or negative sentiment, letting players infer Long/Short correctly with
little company knowledge. Second, the current pre-decision lookback sparkline may
not be adding enough gameplay value, and may encourage simple momentum/reversal
guessing instead of scenario reasoning.

Phase 3 is about the scenario schema and content pipeline, so this design question
must be resolved before the schema fossilizes the wrong card structure. The
existing Scenario Content Rulebook in `docs/09_content_and_round_creation.md`
remains binding unless this consultation recommends specific changes that the
orchestrator and user later approve. D025 also changed Classic Run pacing to Easy
10 / Medium 15 / Hard 20 rounds; Daily Challenge remains 10 rounds.

## Task Framing (micro-role)

For this task, act as a game-content systems designer for a market-history trivia
game. Focus on what the player sees before making a Long/Short/Pass call: the
information architecture, fairness, difficulty calibration, sentiment neutrality,
and chart value. Do not write production scenario cards. Do not implement schema
or code.

## Objective

Write a consultation memo that recommends the pre-decision scenario-card
information model for Phase 3. The recommendation must make rounds engaging, fair,
appropriately challenging by difficulty, resistant to directional sentiment leaks,
and fun to reveal. It must also decide what role, if any, the lookback chart should
play.

## Prescriptive Instructions

1. Read, in order:
   - `soul.md`
   - `decisions.md` entries D013, D015, D017, D018, D019, D022, D024, D025
   - `docs/02_game_design_doc.md`
   - `docs/08_ui_ux_direction.md`
   - `docs/09_content_and_round_creation.md`
   - `docs/06_data_model.md`
   - `apps/web/lib/sampleScenarios.ts`
2. Treat these as fixed unless your memo explicitly flags a proposed change for
   later user approval:
   - Signal or Noise? is a game, not financial advice or a trading simulator.
   - Actions remain Long / Short / Pass.
   - Confidence/scoring math remains unchanged.
   - Difficulty still means information given, not changing the underlying
     company/window/outcome.
   - Hidden-card content must not reveal company identity or outcome.
   - Easy / Medium / Hard still use 3 / 2 / 1 clue counts unless you provide a
     strong argument to reopen D022.
3. Analyze the current scenario-card model:
   - title
   - era/date/holding period
   - companyDescription
   - macroContext
   - clues
   - lookback chart
   - optional Call the Company interaction
4. Diagnose the directional-sentiment leak:
   - Explain at least 4 common ways a card can imply “go long” or “go short”
     without revealing the company.
   - For each leak type, give one example of bad wording and one rewrite pattern
     that preserves decision-useful information without making the correct action
     obvious.
5. Propose 2–3 candidate pre-decision information models. At minimum include:
   - A **balanced tension model** where every card presents a Long case and a Short
     risk in matched strength.
   - A **market setup model** that emphasizes prior price action, sentiment,
     valuation/setup, and unresolved catalyst without directional framing.
   - A **chart-light or chart-reworked model** that changes the role of the
     lookback chart.
6. For each candidate model, evaluate:
   - Player fun and readability on mobile.
   - Fairness across Easy / Medium / Hard.
   - Risk of company-identity leaks.
   - Risk of directional sentiment leaks.
   - Whether Call the Company still works.
   - Schema implications for Phase 3.
   - Content-authoring burden for 100 MVP scenarios.
7. Give a clear recommendation. It must answer:
   - What fields should a pre-decision scenario card have in Phase 3?
   - Which fields are shown at all difficulties, and which vary by difficulty?
   - How should each difficulty differ beyond clue count?
   - Should the lookback chart stay, change, become optional, or be removed from
     the main decision card?
   - What validator/human-review checks should be added for directional sentiment
     leakage?
   - What changes are needed to `docs/09_content_and_round_creation.md` and
     `docs/06_data_model.md` before Phase 3 implementation?
8. Include at least 3 example “before/after” mini-cards using existing placeholder
   scenarios from `apps/web/lib/sampleScenarios.ts`. The after examples should
   demonstrate your recommended information model, not final production copy.
9. Write the memo to:
   `agents/consultations/C002_scenario_information_design.md`
   using the format in `agents/roles/consultant.md`.

Use this exact memo question:

```text
What pre-decision information should Signal or Noise? show so scenario rounds are fair, engaging, resistant to directional sentiment leaks, and fun?
```

## Do NOT

- Edit files other than `agents/consultations/C002_scenario_information_design.md`
  and `progress.md`.
- Write production-ready scenario JSON.
- Implement schema, validator, UI, or game-engine changes.
- Change scoring math, confidence levels, Long/Short/Pass, Call the Company, or
  round counts.
- Re-litigate the product identity or MVP exclusions in `soul.md`.
- Anything on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `agents/consultations/C002_scenario_information_design.md` exists and follows
   the consultant memo format, with a one-sentence recommendation in the first
   three lines.
2. The memo diagnoses at least 4 directional-sentiment leak patterns, each with
   bad wording and a rewrite pattern.
3. The memo compares 2–3 candidate pre-decision information models against the
   criteria in instruction 6.
4. The memo gives one clear recommended information model and explicitly answers
   all six questions in instruction 7.
5. The memo includes at least 3 before/after mini-card examples based on existing
   placeholder scenarios.
6. The memo lists concrete implementation notes for the future Phase 3 handoff,
   including proposed schema fields and validator/review checks.
7. No code, schema, scenario JSON, or non-memo docs are modified.

## Verification Steps for the Consultant

No commands are required. Before finishing, self-check the memo against all
acceptance criteria and run `git diff --name-only` to confirm only the consultation
memo and `progress.md` changed.

## Reporting

Your memo IS your completion report; do not write a separate R### file. Add a
one-line `progress.md` session entry pointing at the memo. Never run `git commit`
or `git push` (D012). If blocked, log the question under Blocked/Questions in
`progress.md` and stop.
