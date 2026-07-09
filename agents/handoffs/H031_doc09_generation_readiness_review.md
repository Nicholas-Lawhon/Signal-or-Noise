# H031 - Doc 09 Generation-Readiness Review (Consultation C004)

**Role:** Consultant
**Phase:** 4 Part A - Content rules & validator hardening
**Status:** approved
**Model:** gpt-5.6-terra (High reasoning)
**Risk:** high (informs the Part B generation pipeline and D031 threshold policy)
**Audit:** orchestrator + user review of the memo; decisions recorded before
Part B
**Depends on:** H030, R041, D034
**Estimated scope:** medium - one consultation memo, no code or content edits
**Context budget:** medium - full doc 09 (the breadth is the work), gate
evidence reports, gate2 config, named decisions
**Output budget:** memo 1,500-2,200 words

**High-reasoning rationale (D029/D033):** This review gates all of Part B
content generation (now 40 cards, D034). Doc 09's rulebook and generation
guidance were substantially shaped by GPT 5.5-era work and the C003
consultation, so this is the D033 cross-model review case. The task needs
synthesis across the rulebook, three rounds of real Gate 2 evidence
(H023/H028/H030), and the generation workflow — judgment-heavy, not
mechanical. Expected context: doc 09 + two evidence reports + config.
Expected output: one memo <= 2,200 words.

## Context

Phase 4 Part A is nearly closed: after H029/H030, five of six active seeds
pass Medium+Hard Gate 2 identity; Netflix is being rewritten in a parallel
handoff (H032). The user has playtested the six seeds and confirmed the
abstract Hard style leaks nothing, but is still refining content feel and may
revisit D031 thresholds. D034 just cut the Part B target from 100 cards to 40
(mix 24 famous / 12 moderately known / 4 obscure).

Before Part B generates 40 cards, doc 09 must be trustworthy as the
generation playbook. Three rounds of honest Gate 2 evidence exist to test it
against. Known tensions the evidence surfaced:

- **Plausible-count calibration is off.** H030: Medium results carry 5
  plausible guesses (doc 09 wants 2-4) on 4 of 6 cards; Hard results carry
  only 2-3 plausible guesses >= confidence floor 10 (doc 09 wants >= 4) on
  all 6. These fire as WARNs on cards that PASS identity — the targets and
  the identity thresholds may be pulling against each other.
- **Identity thresholds force abstraction.** The D031 Hard rule (correct
  company must not appear in a top-5 at conf >= 15) drove H029 toward very
  abstract prose. It passes the gate and playtests without leakage, but the
  user flags it as a style/fun watch item.
- **The winning rewrite technique is undocumented.** H029 succeeded via
  conjunction-breaking and peer-set-first writing (see R038/R041), which doc
  09 does not yet teach; generation prompts built from doc 09 alone would
  likely reproduce the H023/H028 failures.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D019, D022, D026, D031, D032, D034
- Docs:
  - `docs/09_content_and_round_creation.md` — full document (this review IS
    the breadth)
- Prior artifacts:
  - `agents/consultations/C003_automated_guessability_check.md` — sections on
    thresholds and calibration only
  - `agents/reports/R034_H028.md` — pre-rewrite failure evidence
  - `agents/reports/R040_H030.md` — post-rewrite evidence incl. warning
    pattern
  - `agents/reports/R038_R037_review.md` — what the successful rewrite did
- Source files:
  - `packages/content/src/gate2/config.ts` — exact thresholds
  - Any 2-3 of the five passing active seeds under
    `packages/content/scenarios/active/` as style exemplars (SKIP
    `scenario_netflix_2012_2017.json` — it is being rewritten in parallel by
    H032; treat R040 as the source of truth for Netflix evidence)
- Commands for discovery: none required; do not run pnpm commands (a parallel
  handoff may be mutating content)

If broader context seems necessary, stop and log the requested expansion in
the memo's open-questions section instead of reading unrelated history.

## Task Framing (micro-role)

Act as a generation-pipeline auditor. Doc 09 was written before any card had
survived an honest Gate 2 pass; you have the evidence it lacked. Your product
is a memo the orchestrator can turn directly into decisions and Part B
handoffs. Recommend; do not decide, do not edit anything.

## Objective

Produce `agents/consultations/C004_doc09_generation_readiness.md`: an
assessment of whether doc 09's rulebook + generation guidance, as written,
would let an AI-assisted pipeline produce 40 cards (D034 mix) that pass the
hardened gates on first authoring — and if not, the specific amendments,
calibration changes, and workflow steps needed, each framed as a decision
point with a recommendation.

## Prescriptive Instructions

1. Assess each roadmap-named readiness area against the H028→H030 evidence:
   - **Fact-bank workflow:** is `review.factBank`
     (decisionUseful/prohibited) as practiced in the active seeds sufficient
     guidance for a generator, or does doc 09 need the H029
     conjunction-breaking method written in?
   - **Hard-first ordering:** doc 09's authoring order vs what the rewrite
     history suggests (Hard is the binding constraint; evaluate authoring
     Hard-first then relaxing toward Easy).
   - **Red-team likely-guess lists:** are mediumLikelyGuesses /
     hardLikelyGuesses doing real work, and should the H029-style self-judge
     pass become a mandatory authoring step before export?
2. Calibration analysis: reconcile the plausible-count WARN targets with the
   D031 identity thresholds using the H030 numbers. Conclude whether to (a)
   change the WARN targets, (b) change authoring guidance, or (c) accept the
   tension — with one recommendation.
3. Abstractness/style: given identity thresholds structurally push Hard
   toward abstraction, lay out the option space for D031 refinement (keep /
   loosen Hard conf floor / difficulty-scaled style rules), with expected
   effects on guessability and fun. Flag, do not decide.
4. Generation prompt template: assess whether doc 09's template (or absence
   of one) is executable by a generation agent at 40-card scale; specify the
   missing pieces (per-difficulty checklists, banned-pattern list distilled
   from all stored pointingFacts, self-judge step, export/judge cadence in
   batches).
5. Right-size the workflow to D034: 40 cards / 24-12-4 mix — recommend batch
   sizes, judge cadence (per D032 agent-workflow judging), and where human
   playtesting slots in.
6. End the memo with a numbered **Decision Points** list (each: question,
   options, your recommendation, cost/risk of deferring) and an
   **Open Questions** section for anything requiring context you were not
   given.

## Do NOT

- Do not edit doc 09, schemas, validators, gate2 config, scenario JSON,
  `soul.md`, `roadmap.md`, or `decisions.md` — memo only.
- Do not read or touch `scenario_netflix_2012_2017.json` (parallel H032
  rewrite in progress).
- Do not run pnpm/test commands.
- Do not edit `progress.md` — the orchestrator logs this session at review
  (parallel-run conflict avoidance).
- Do not decide thresholds or product rules; recommend with rationale.
- Do not exceed the output budget by restating doc 09 or prior memos — cite
  sections instead.
- Do not build anything on the MVP exclusion list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. `agents/consultations/C004_doc09_generation_readiness.md` exists,
   1,500-2,200 words.
2. All four roadmap readiness areas (fact-bank workflow, Hard-first ordering,
   red-team lists, generation prompt template) are each assessed against
   cited H028/H030 evidence.
3. The plausible-count vs identity-threshold tension is analyzed with the
   actual H030 numbers and resolved to a single recommendation.
4. A numbered Decision Points list exists; every recommendation names its
   option set and defer-cost.
5. The 40-card (D034) workflow recommendation includes batch size and judge
   cadence.
6. No repository file outside `agents/consultations/` and this handoff's
   Status line was modified.

## Verification Steps for the Executor

Self-check the memo against the acceptance criteria and word budget.
`git status --short` must show only the memo and this handoff file changed.

## Reporting

On completion: set this handoff's Status to `complete`. The memo IS the
deliverable — do not write a separate R### report and do not edit
`progress.md`.

If blocked: note the blocker at the top of the memo draft and stop.
