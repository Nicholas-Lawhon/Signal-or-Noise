# R059 - Routing Policy Update: GPT 5.6 Sol

**Role:** Orchestrator
**Task:** Direct user request
**Date:** 2026-07-09
**Status:** complete

## Summary

Added GPT 5.6 Sol as a high-reasoning model with the requested ratings. It has
headless `codex exec` dispatch using the high reasoning override and is also
available for interactive Codex sessions. Updated the requested Terra, GPT 5.5,
and DeepSeek ratings and aligned the model-characteristics table source.

## Acceptance Criteria Self-Check

| # | Criterion | Result | How verified |
|---|---|---|---|
| 1 | Add GPT 5.6 Sol | pass | Roster and high-reasoning routing guidance updated. |
| 2 | Use reasoning overrides and allow both session modes | pass | Sol `codex exec` command includes `model_reasoning_effort=high`; interactive use documented. |
| 3 | Apply requested rating changes and align table | pass | Reviewed rendered source table values and column spacing. |

## Files Changed

- `agents/routing.md`
- `progress.md`
- `agents/reports/R059_routing_gpt_5_6_sol.md`

## Tests

`git diff --check -- agents/routing.md progress.md agents/reports/R059_routing_gpt_5_6_sol.md` (pass).

## Deviations from the Task

None.

## Known Issues / Follow-ups

None.
