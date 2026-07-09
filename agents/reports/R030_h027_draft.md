# R030 - Orchestrator Draft for H027

**Role:** Orchestrator
**Handoff:** H027
**Date:** 2026-07-09
**Status:** approved

## Summary

Drafted `agents/handoffs/H027_hard_gate2_identity_rewrite.md` for the follow-up
Hard identity fix after R028/H026. The handoff is scoped to rewriting failing
Hard variants, removing stale Hard Gate 2 entries, and exporting
`agents/gate2/H027_payloads.json` for the next blind judge pass.

Because H026 suggests frozen title/era/date labels may be part of the Hard
triangulation leak, H027 allows a bounded shared-label exception. If used, the
executor must remove all stale Gate 2 entries affected by the shared payload
change and report that the follow-up blind judge scope expands beyond Hard for
those scenarios.

## Verification

Not run - handoff/report/progress drafting only. R029 verification already
confirmed H026 stored results and expected Hard Gate 2 failures.

## Next Step

Dispatch H027 manually per D028. When it returns, review `agents/reports/R031_H027.md`
and the active scenario diff before drafting the blind rejudge handoff.
