# H008 — Adversarial Review of the Scenario Content Rulebook

**Role:** Consultant
**Phase:** 2 (content-design thread, feeds Phase 3)
**Status:** draft
**Model tier:** gpt-5.5 (per `agents/routing.md`)
**Risk:** high — the rulebook governs all future content and amended `soul.md` (D022)
**Depends on:** none (reviews committed docs)
**Estimated scope:** small — one review memo, no code

## Context

Playtesting showed the hidden company was trivially guessable even on Medium
(D022 records the causes). The orchestrator rewrote the difficulty rules in
`docs/09_content_and_round_creation.md` into a binding **Scenario Content
Rulebook**: difficulty-scaled clue counts (Easy 3 / Medium 2 / Hard 1),
universal leak bans with a "three-companies test", field roles, a specificity
ladder (L1–L4) with per-difficulty caps, a clue taxonomy (B/S/M), a
decision-informativeness floor, title rules, and an LLM-based guessability
test. `soul.md` was amended accordingly. Next step after this review: the 12
placeholder cards are regenerated with real per-difficulty variants (H009).

## Task Framing (micro-role)

For this task, act as an adversarial content-rules reviewer. Your job is to
break the rulebook before players and card authors do. Review ONLY the
rulebook and its consistency with the project's locked rules. Do not review
code, UI, scoring math, or writing style of the docs.

## Objective

A review memo that either confirms the rulebook is sound or identifies
specific holes, with concrete fixes, so the orchestrator can revise it before
any cards are authored under it.

## Prescriptive Instructions

1. Read, in order: `soul.md` (Difficulty + Content Integrity sections),
   `decisions.md` (D013, D015, D018, D019, D022), the Scenario Content
   Rulebook and adjacent sections in `docs/09_content_and_round_creation.md`,
   and `apps/web/lib/sampleScenarios.ts` (real examples of leaky content).
2. Attack the rulebook from these angles, in this order:
   a. **Compliant-but-leaky:** write (in the memo) at least 3 example hidden
      cards that satisfy every written rule yet still identify the company.
      Each example proves a missing rule — propose the rule that would catch it.
   b. **Compliant-but-random:** construct at least 1 Hard variant that passes
      every rule yet gives no rational basis for Long vs Short. Does the
      decision-informativeness floor actually catch it as written?
   c. **Guessability-test calibration:** is "top 3" the right bar for each
      difficulty? Is the fresh-LLM protocol gameable or too model-dependent?
      Propose concrete adjustments if so.
   d. **Taxonomy completeness:** are B/S/M sufficient? Is mandating S-only on
      Hard correct, or does it over-constrain some scenario types (e.g.,
      macro-driven windows like the 2008 crash)?
   e. **Ladder ambiguity:** can two reasonable authors classify the same
      sentence as L2 vs L3? Where the ladder is subjective, propose sharper
      wording or additional calibrated examples.
   f. **Consistency:** does anything in the rulebook contradict `soul.md`,
      D013 (return mix), D015 (Call the Company — note: fewer clues on Hard
      makes the bonus guess harder; is the flat +2/−1 still fair?), or D018?
3. Write the memo to `agents/consultations/C001_rulebook_review.md` using the
   memo format in `agents/roles/consultant.md`, with **Question:** "Is the
   D022 Scenario Content Rulebook sound enough to author cards under?" and a
   single clear **Recommendation** (adopt as-is / adopt with listed fixes /
   rework). List fixes as numbered, individually actionable items.

## Do NOT

- Edit any file other than your memo.
- Re-litigate settled decisions: 3/2/1 clue counts (D022), proportional payout
  (D017), the 60/30/10 fame mix, or anything else in `decisions.md` — you may
  flag tensions in "What Would Change This Recommendation", not as findings.
- Propose new game features or scoring changes.
- Anything on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `agents/consultations/C001_rulebook_review.md` exists and follows the
   consultant memo format, with recommendation stated in the first 3 lines.
2. Contains ≥3 compliant-but-leaky examples (2a) each paired with a proposed
   rule, or an explicit argument why none can be constructed.
3. Contains the Hard randomness attack (2b), the guessability calibration
   check (2c), and taxonomy/ladder findings (2d/2e), each with a concrete
   verdict.
4. Contains a consistency check against soul.md/D013/D015/D018 (2f).
5. Every proposed fix is numbered and independently actionable.
6. No file outside `agents/consultations/` and `progress.md` was modified.

## Verification Steps for the Implementor

n/a — Consultant role; self-check the memo against the acceptance criteria
before finishing.

## Reporting

Your memo IS your completion report (no separate R### file). Add a one-line
`progress.md` session entry pointing at the memo. Never run `git commit` or
`git push` (D012). If blocked, log the question under Blocked/Questions in
`progress.md` and stop.
