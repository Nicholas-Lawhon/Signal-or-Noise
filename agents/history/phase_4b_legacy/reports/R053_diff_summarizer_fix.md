# R053 - Diff Summarizer Fix

**Owner:** Orchestrator
**Date:** 2026-07-09
**Status:** complete

## Cause and Fix

`opencode run --format default` writes ANSI/UI framing to stderr even when it
exits successfully. The wrapper merged stderr into stdout while its global
`ErrorActionPreference` was `Stop`, causing PowerShell to throw before it could
check the zero exit code. The wrapper now temporarily captures that output under
`Continue`, filters formatter stderr from the Markdown result, and preserves it
for genuine non-zero failures.

The verification run then exposed a second Windows PowerShell 5.1 issue:
`Set-Content -Encoding utf8NoBOM` is unsupported. The wrapper now writes UTF-8
without BOM through .NET instead.

## Verification

- PowerShell parser check passed.
- `Invoke-DiffSummarizer.ps1 -CompletionReport agents/reports/R048_H034.md`
  completed successfully and wrote `R048_H034_diff_summary.md`.
- The produced summary has the required three headings, reports no
  discrepancies, and requires no raw diff.
