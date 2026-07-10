# R061 - D031 Gate 2 Judge Policy Amendment

**Role:** Orchestrator
**Date:** 2026-07-09
**Status:** approved

## Summary

User approved an amendment to D031: Grok 4.5 remains the default Gate 2 judge, but a high-reasoning approved model may be explicitly selected by a user-approved handoff. The offline guard now accepts the approved model set, and H037 is rerouted to Claude Fable for its difficult 19-payload blind rejudge.

## Acceptance Criteria Self-Check

| # | Criterion (short) | Result | How verified |
|---|---|---|---|
| 1 | D031 default policy recorded | pass | Archived decision body and live index updated. |
| 2 | Validator accepts Fable | pass | Approved-model allowlist includes `claude-fable`. |
| 3 | H037 rerouted | pass | Header, rationale, and stored model instruction name Claude Fable. |
| 4 | User-facing rulebook aligned | pass | Doc 09 describes the default plus approved override policy. |

## Files Changed

- `agents/history/decisions_phase_0_4.md`
- `decisions.md`
- `packages/content/src/gate2/config.ts`
- `packages/content/src/gate2/evaluate.ts`
- `docs/09_content_and_round_creation.md`
- `agents/handoffs/H037_batch1_changed_payload_blind_gate2.md`
- `agents/reports/R060_H037_dispatch_approval.md`
- `agents/reports/R061_D031_gate2_judge_policy.md`
- `progress.md`

## Evidence Artifacts

None.

## Tests

`pnpm --filter @signal-or-noise/content test` — 52/52 passed;
`pnpm typecheck` passed; `git diff --check` passed.

## Deviations from the Handoff

None.

## Known Issues / Follow-ups

H037 is now ready for manual Claude Fable dispatch.

## Blocked / Questions for the Orchestrator

None.

## Recommended Next Step

Run focused verification, then manually dispatch H037 to Claude Fable.
