# H019 — Consultation: Automated Gate 2 Guessability Check Design

**Role:** Consultant
**Phase:** 4 Part A — Content rules & validator hardening
**Status:** complete
**Model:** claude-fable-5 (high reasoning effort)
**Risk:** high (production content-pipeline design)
**Audit:** n/a — consultation memo; orchestrator + user review the recommendation
**Depends on:** D019, D022 (+ amendments), D026, D027, A005, C001, C002
**Estimated scope:** medium — design memo only, no code

## Context

The content validator (`@signal-or-noise/content`) now automates every D019
layer except one: literal identity leaks, banned terms, setup-hint counts,
return-decimal and date-window guards are all enforced in code (H015/H018).
The **Gate 2 guessability test** — "can a strong model identify the hidden
company (or infer the correct direction) from the pre-decision payload?" — is
still a manual protocol in `docs/09_content_and_round_creation.md`.

D022's second amendment already commits us to automating it: a pinned model at
temperature 0 inside the Phase 3+ validator. D027 moved content expansion up
to Phase 4 precisely because the user wants guards trustworthy enough that new
cards can be added quickly without fear of leaks or unfun cards. Phase 4 Part B
will generate ~100 cards; a manual Gate 2 does not scale to that.

This consultation designs the automated Gate 2 mechanism. It is the
design-sensitive piece of Part A: model choice, thresholds, cost per card, and
pipeline placement all carry product consequences.

## Task Framing (micro-role)

You are a content-pipeline design consultant. Your output is a decision-ready
memo, not code. Optimize for: (a) the orchestrator can turn your spec into
implementation handoffs without further design work; (b) the user can trust
that a card passing the automated gates is safe to activate.

## Objective

Write `agents/consultations/C003_automated_guessability_check.md`
recommending a concrete design for the automated Gate 2 guessability check,
with at least one credible alternative and explicit trade-offs.

## Questions the memo must answer

1. **Test protocol.** How the guess test runs per difficulty variant: what
   payload is presented (doc 09 says the full pre-decision payload — title,
   variant fields, setup hints, metadata labels; decide whether/how the
   lookback price series is included), prompt shape, number of attempts, and
   how determinism is achieved (D022: pinned model, temperature 0 — reconcile
   determinism with the need for a guess DISTRIBUTION if you recommend one).
2. **Pass/fail semantics.** Map doc 09's Gate 2 rules and
   plausible-alternative minimums (Easy ≥2 / Medium 2–4 / Hard ≥4) onto
   machine-checkable thresholds. Define how a "correct guess" is judged
   (accepted-names matching exists in `company.acceptedNames`), and how
   plausible alternatives are counted/validated.
3. **Direction leakage.** C002 flagged directional-sentiment inference as a
   parallel failure mode (player infers Long/Short without knowing the
   company). Recommend whether the same harness should also run an automated
   direction-guess test now, or defer it — with reasoning.
4. **Model choice & drift.** Which model to pin, why, and the procedure when
   the pinned model is deprecated or changes behavior (re-baseline protocol).
   Consider that the guesser should approximate a strong, knowledgeable
   player — cost matters at 100+ cards but wrong-model false confidence is
   worse.
5. **Pipeline placement.** Where the check runs: inside
   `pnpm --filter @signal-or-noise/content validate` (making validation
   network-dependent), a separate opt-in command (e.g. a promotion gate for
   draft → reviewed / reviewed → active), CI, or a hybrid. Define failure
   semantics when the network/API is unavailable — an unreachable model must
   never count as a pass.
6. **Result storage & caching.** Where gate results live (schema `review`
   fields? sidecar files?), how results are cached so unchanged cards are not
   re-tested (content hashing?), and what invalidates a cached pass.
7. **Tiering by status.** Which statuses the gate blocks (`reviewed`/`active`)
   vs merely warns (`draft`), consistent with the H018 precedent for the
   banned-terms guard.
8. **Cost estimate.** Rough per-card and 100-card cost for your recommended
   design, so the user can approve the spend model.
9. **Spec for implementation.** A final section detailed enough that the
   orchestrator can author the implementation handoff(s) directly from it:
   proposed module boundaries in `packages/content`, CLI surface, schema/doc
   09 amendments needed, and env/secret handling (`.env`, never committed).

## Constraints

- Read first, in order: `soul.md`, `AGENTS.md`, `decisions.md` (D019, D022 and
  amendments, D024, D026, D027, D028), `docs/09_content_and_round_creation.md`,
  `agents/consultations/C001_rulebook_review.md` and
  `C002_scenario_information_design.md`, `agents/audits/A005_H015-H016.md`,
  `packages/content/src/` (schema.ts, validation.ts, validate.ts), and
  `progress.md`.
- This is a validation-time tool. It does NOT generate gameplay content, so it
  does not conflict with the soul.md ban on dynamic AI content in production
  gameplay — but say so explicitly in the memo, since future readers will ask.
- The pipeline is JSON-file based until the database lands (Phase 5, D027).
  Do not design against Prisma/Postgres.
- Primary dev machine is Windows; anything you propose must run there.
- Do not change any code, schema, or doc in this consultation — the memo is
  the only deliverable. Flag doc 09 amendments as recommendations.
- Do not re-litigate settled decisions (D022 clue/hint structure, D026 card
  model, locked game rules). If you find a genuine conflict between doc 09's
  manual Gate 2 protocol and what automation permits, surface it as a decision
  point for the orchestrator rather than resolving it silently.

## Acceptance Criteria

1. `agents/consultations/C003_automated_guessability_check.md` exists and
   answers all nine questions above.
2. A recommended design is clearly marked, with at least one alternative and
   the trade-offs between them.
3. The spec section is implementable without further design decisions beyond
   those explicitly listed as orchestrator/user decision points.
4. `progress.md` has a one-line Consultant session entry pointing at C003.

## Reporting

Your memo file IS your report — do not write a separate `agents/reports/`
file. Leave everything uncommitted. Do not commit or push.
