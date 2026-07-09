# R014 - Completion Report for Token Workflow Investigation

**Role:** Orchestrator
**Handoff:** ad hoc user-requested workflow fix
**Date:** 2026-07-09
**Status:** awaiting_review

## Summary

Investigated why the recent Fable/high-reasoning consultations consumed so much
usage and updated the agent workflow to make context and output size explicit
budgets. The main cause was not one bad file; it was the combination of broad
required reading, expensive executor selection, and long consultation outputs.

## Root Cause

The two matching high-token patterns were H019/C003 and H013/C002:

| Artifact | Size |
|---|---:|
| `progress.md` | ~49k chars / ~12k rough tokens |
| `decisions.md` | ~30k chars / ~7.5k rough tokens |
| `docs/09_content_and_round_creation.md` | ~26k chars / ~6.4k rough tokens |
| `agents/consultations/C002_scenario_information_design.md` | ~24k chars / ~5.9k rough tokens |
| `agents/consultations/C003_automated_guessability_check.md` | ~28k chars / ~6.9k rough tokens |
| `agents/handoffs/H019_gate2_guessability_consultation.md` | ~6.6k chars / ~1.6k rough tokens |
| `agents/handoffs/H013_scenario_information_design.md` | ~7.3k chars / ~1.8k rough tokens |

H019 specifically required a high-reasoning Fable executor to read `soul.md`,
`AGENTS.md`, targeted decisions, doc 09, C001, C002, A005, three content source
files, and `progress.md`. That is roughly 45k-50k visible input tokens before
tool overhead, hidden reasoning effort, and the ~7k-token C003 output. H013/C002
had the same shape with several large docs and a ~6k-token memo output.

## Changes Made

- Added D029 to `decisions.md`: token-efficient context routing.
- Updated `AGENTS.md` and `CLAUDE.md` so default required reading uses scoped
  `progress.md` and targeted decisions/docs instead of full history.
- Rewrote `agents/routing.md` to make Fable a non-routine executor, require an
  explicit override for high-reasoning executor runs, and add Context/Output
  Budgets.
- Updated `agents/README.md` to match D028 manual-default dispatch and D029
  context manifests.
- Updated all role files so Implementor, Consultant, Auditor, Content Curator,
  and Growth read only named context beyond the root scoped state.
- Updated `agents/handoffs/TEMPLATE.md` with Context Manifest, Context Budget,
  and Output Budget fields.
- Updated `agents/reports/TEMPLATE.md` to discourage long pasted logs and
  transcript-like reports.
- Updated `progress.md` Current Status and added this session log.

## Files Changed

- `AGENTS.md`
- `CLAUDE.md`
- `agents/README.md`
- `agents/handoffs/TEMPLATE.md`
- `agents/reports/TEMPLATE.md`
- `agents/roles/auditor.md`
- `agents/roles/consultant.md`
- `agents/roles/content-curator.md`
- `agents/roles/growth.md`
- `agents/roles/implementor.md`
- `agents/roles/orchestrator.md`
- `agents/routing.md`
- `decisions.md`
- `progress.md`
- `agents/reports/R014_token_workflow.md`

## Tests

No code tests run; docs/workflow only.

Verification performed:

- `rg` consistency scan for stale Fable/high-reasoning/dispatch/full-progress wording.
- Character/token rough measurement for the root-cause artifacts.
- `git diff --stat` and `git status --short`.

## Known Issues / Follow-ups

Existing historical handoffs still contain old broad-context language; they were
not rewritten because executed handoffs are historical artifacts. New handoffs
must use the updated template.

C003 remains awaiting orchestrator/user review.

## Recommended Next Step

Review and approve the D029 workflow diff, then review C003's four decision
points before drafting H020 with the new Context Manifest and Output Budget.
