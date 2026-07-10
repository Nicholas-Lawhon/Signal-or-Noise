# R036 - Orchestrator Draft for H029

**Role:** Orchestrator
**Handoff:** H029
**Date:** 2026-07-09
**Status:** approved

## Summary

Drafted `agents/handoffs/H029_medium_hard_identity_rewrite.md` for the
Medium+Hard identity rewrite of all six active seeds after H028's blind Gate 2
results (Easy pass 6/6; Medium and Hard identity fail 6/6).

Routing: **GPT 5.6 Terra (High reasoning)** — the first Terra dispatch under
D033, user approved. High-reasoning rationale recorded in the handoff: this is
the third rewrite attempt; H025 (GPT 5.5) and H027 (shared-label softening)
both failed blind judgment because the judge triangulates from fact
*combinations*, not just named hooks. The handoff arms the executor with the
stored `pointingFact` evidence as a red-team target list and requires a
self-check judge pass per card before completion.

Key scope constraints: Easy text and shared labels
(title/era/decisionDateLabel/holdingPeriodLabel) stay byte-identical so
passing Easy Gate 2 evidence survives; shared-label changes escalate to the
orchestrator instead of being taken silently (tightened from H027's bounded
exception). Stale Medium/Hard `review.gate2` entries are removed; fresh
payloads export to `agents/gate2/H029_payloads.json`; the blind Grok rejudge
remains a follow-up handoff per D032.

## Verification

Not run - handoff/report/progress drafting only. Confirmed D031 thresholds
against `packages/content/src/gate2/config.ts` (Medium: fail at #1 with conf
>= 40 or lead >= 15; Hard: fail if in top 5 at conf >= 15) and precomputed
them into the handoff.

## Next Step

Dispatch H029 manually per D028 using the GPT 5.6 Terra (High) command in
`agents/routing.md`. The executor writes `agents/reports/R037_H029.md` when
complete. Note: this is the first live use of the Terra codex invocation —
verify the model slug/reasoning flag against the installed codex CLI at
dispatch time.
