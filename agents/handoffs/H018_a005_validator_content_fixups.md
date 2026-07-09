# H018 — A005 Validator & Content Fix-ups

**Role:** Implementor
**Phase:** 3 — Scenario Schema & Content Pipeline (post-audit fix-up)
**Status:** approved
**Model:** grok-4.5
**Risk:** medium
**Audit:** not required (D024) — orchestrator review + content tests
**Depends on:** H015, H016, A005
**Estimated scope:** small — one seed retitle, three validator changes, four tests

## Context

A005 (`agents/audits/A005_H015-H016.md`) audited the Phase 3 content pipeline
and returned PASS WITH FINDINGS. This handoff closes the three MAJOR findings
plus one trivial test gap (MINOR-3) before content work scales. MINOR-1,
MINOR-2, and MINOR-4 are deliberately deferred to the Phase 4 Part A
validator-hardening pass (D027) — do not touch them.

## Objective

1. Retitle the Amazon seed away from a doc 09 named title-bias FAIL example.
2. Extend the leakage/sentiment scan to the pre-decision-visible metadata
   fields `era`, `decisionDateLabel`, and `holdingPeriodLabel`.
3. Reject empty `identityBannedTerms` on `reviewed`/`active` scenarios.
4. Add a Medium setup-hint overflow test.

## Prescriptive Instructions

1. **Retitle Amazon seed (MAJOR-1).** In
   `packages/content/scenarios/active/scenario_amazon_1999_2001.json`, change
   `scenario.title` from `"Peak Expectations"` to `"The Scale Bet"` (exact
   string). Do not change any other field in the file.

2. **Scan pre-decision metadata (MAJOR-2).** In
   `packages/content/src/validation.ts`, extend `collectHiddenTexts` so the
   scanned text list also includes:
   - `scenario.era` (path `scenario.era`)
   - `scenario.decisionDateLabel` (path `scenario.decisionDateLabel`)
   - `scenario.holdingPeriodLabel` (path `scenario.holdingPeriodLabel`)

   Adjust the function signature as needed (both `checkLeakage` and
   `collectSentimentWarnings` call it — both must scan the new fields; passing
   the parsed `Scenario` in, instead of `(title, hiddenCard)`, is the natural
   shape). Do NOT scan `outcomeLabel`, `reveal.*`, `company.*`, or `review.*`
   — reveal-side fields may legitimately name the company.

3. **Empty banned-terms guard (MAJOR-3).** In
   `packages/content/src/validation.ts`, add a business-rule check (not a Zod
   schema change): if `scenario.status` is `'reviewed'` or `'active'` and
   `company.identityBannedTerms` is empty, push a validation ERROR at path
   `company.identityBannedTerms` with a message stating reviewed/active
   scenarios must list at least one identity-banned term. `draft`, `inactive`,
   and `archived` statuses stay exempt.

4. **Tests.** In `packages/content/tests/validation.test.ts` add four cases,
   each built from the existing valid-scenario fixture pattern already used in
   that file:
   - `era` set to a string containing the company name → validation fails with
     an error at `scenario.era`.
   - `decisionDateLabel` containing the ticker → validation fails.
   - `status: 'active'` with `identityBannedTerms: []` → validation fails;
     same scenario with `status: 'draft'` → passes (may be one test).
   - Medium variant with 2 `setupHints` → validation fails (MINOR-3).

5. Run from repo root and confirm all pass:

   ```powershell
   pnpm typecheck
   pnpm test
   pnpm --filter @signal-or-noise/content validate
   pnpm build
   ```

   The validate command must still report 6/6 PASS (all six current seeds have
   non-empty banned terms and clean metadata fields — if one fails after your
   change, STOP and report; do not edit seeds beyond instruction 1).

6. Update `progress.md` (session entry + Current Status) and write
   `agents/reports/R013_H018.md` per the report template. Set this handoff's
   status to `complete`. Leave all work uncommitted (D012).

## Do NOT

- Touch MINOR-1 (calendar-date refine), MINOR-2 (price/return consistency), or
  MINOR-4 (likely-guess quality) — Phase 4 Part A work (D027).
- Change the Zod schema, the return-decimal guard, date-window rules, or the
  sentiment term list.
- Edit any seed file except the single Amazon title string.
- Edit `apps/web` — no UI changes are in scope.
- Commit or push.

## Acceptance Criteria

1. Amazon seed title is exactly `The Scale Bet`; no other seed diffs.
2. A scenario whose `era`, `decisionDateLabel`, or `holdingPeriodLabel`
   contains the company name or ticker fails validation.
3. An `active` or `reviewed` scenario with empty `identityBannedTerms` fails
   validation; `draft` does not.
4. Medium variant with 2 setup hints fails validation.
5. `pnpm typecheck`, `pnpm test`, `pnpm build` pass; content validate 6/6.
6. R013 report exists; progress.md updated.

## Reporting

Write `agents/reports/R013_H018.md`. Leave everything uncommitted.
