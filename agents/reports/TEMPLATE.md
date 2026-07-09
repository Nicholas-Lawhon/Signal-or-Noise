# R### — Completion Report for H###

**Role:** <executing role>
**Handoff:** H###
**Date:** YYYY-MM-DD
**Status:** awaiting_review | approved | rejected
(You write `awaiting_review`. Only the orchestrator changes it.)

## Summary

<2–5 sentences: what was built/produced, in plain language. Be concise; the
orchestrator can inspect the diff when needed.>

## Acceptance Criteria Self-Check

| # | Criterion (short) | Result | How verified |
|---|-------------------|--------|--------------|
| 1 | ...               | ✅/❌  | exact command run / screen checked / value observed |

Every criterion from the handoff appears here. A ❌ means the report status is
still `awaiting_review` but you must explain the failure under Deviations. During
prototype development, explicitly label accepted prototype limitations instead
of spending extra cycles trying to polish outside the handoff.

## Files Changed

<List every file created/modified/deleted. The working tree is UNCOMMITTED —
this list plus `git status` is how the orchestrator reviews your work.>

## Tests

<Command run, counts passing/failing, and any skipped. Do not run broad/manual QA
unless the handoff asked for it or the changed surface needs it.>

## Deviations from the Handoff

<Anything you did differently than written, and why. "None" if none.
Undeclared deviations discovered later are treated as defects.>

## Known Issues / Follow-ups

## Blocked / Questions for the Orchestrator

## Recommended Next Step
