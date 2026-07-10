# H007 — Re-Audit A002 (H005 + H006)

**Role:** Auditor
**Phase:** 1 (audit gate — Phase 1 closeout)
**Status:** approved
**Depends on:** H005, H006 (both implemented; UNCOMMITTED in the working tree over
committed baseline `232aa19`)
**Executor:** GPT 5.5
**Deliverable:** `agents/audits/A002_H005-H006.md` (this audit file IS your report;
per D012 you do not write an `agents/reports/R###` file).

## Who You Are

You are the **Auditor** for Signal or Noise?. Read `agents/roles/auditor.md` fully
first — note the new standing **Content-Leakage Scan** duty (D019). You verify the
two fix-up handoffs against their acceptance criteria and the locked rules. You do
not fix anything and you do not commit — you report; the orchestrator resolves and
commits.

This is a RE-AUDIT: A001 (`agents/audits/A001_H001-H003.md`) FAILed with two
BLOCKERs. H005 was written to fix them and H006 adds scenario variety + a reveal
banner. Your job is to confirm the blockers are truly gone and the new work is
correct, without regressions to the criteria A001 already passed.

## Required Reading (in order)

1. `agents/audits/A001_H001-H003.md` — what failed and why (your baseline)
2. `soul.md` and `decisions.md` (esp. D013–D020)
3. `agents/roles/auditor.md` — posture + report format + content-leakage scan
4. `agents/handoffs/H005_a001_fixups.md` and `H006_variety_and_reveal.md`
5. `agents/reports/R005_H005.md` and `R006_H006.md` (implementer claims — verify)

## Environment Setup (Windows / PowerShell)

```powershell
$env:Path = "$env:LOCALAPPDATA\nodejs\node-v24.18.0-win-x64;$env:Path"
node --version   # expect v24.18.0
pnpm --version   # expect 9.15.0
```
All commands from repo root `C:\Repos\Signal_Or_Noise`. Run everything yourself and
paste real output as evidence — do not trust the reports.

## Part 1 — Automated Checks

| Check | Command | Pass condition |
|-------|---------|----------------|
| Install | `pnpm install` | completes |
| Tests | `pnpm test` | 24 passed, 0 failing |
| Types | `pnpm typecheck` | zero errors |
| Lint | `pnpm lint` | zero errors (confirms H005 dead code removed) |
| No dynamic classes | grep `run/page.tsx` for `border-${`, `bg-${`, `text-${` | **zero** matches |
| Dev server | `pnpm dev` | serves (port 3000, or 3001 if busy) |

## Part 2 — H005 Fixes (the two former BLOCKERs + content)

Drive the browser at a 375px viewport.

1. **Former BLOCKER 1 — full run completes.** Play a **full 20-round Medium run,
   passing or calling every round without going bankrupt.** At Round 20: Lock In →
   "Call locked." → Reveal Result → **"See Summary"** must reach the "Run Complete."
   summary. There must be NO "No scenario available." dead-end. (This is the single
   most important check — it blocked Phase 1.)
2. **Former BLOCKER 2 — color ramp renders.** Select each confidence level and
   confirm the **computed** border/background/text color actually changes (Low cyan
   #38D5E6, Medium green #35D07F, High amber #FFB84D, All-In violet #A875FF) — not
   just the class name in the DOM. Do the same for Long (green) / Short (red) /
   Pass (gray) selected states.
3. **Content de-identification.** Confirm in-app and in `sampleScenarios.ts` that:
   Amazon title is no longer "Everything Store…" and its clues contain no founder
   reference or mission-statement slogan; the Microsoft clue no longer contains the
   word "Windows"; the BlackBerry title is no longer "The Keyboard King".
4. **Netflix precision.** Netflix reveal shows **+1135.6%** (not +1136.0%).

## Part 3 — H006 New Work

5. **Pool size + variety.** Confirm 12 scenarios exist. Play a full 20-round run and
   record the company order: the **first 12 rounds must be 12 DISTINCT companies**,
   and **no company appears twice in a row** at any point.
6. **New card reveals.** Trigger and verify each new card's reveal shows correct
   company/window/return: Coca-Cola +28%, Starbucks +52%, Nvidia +230%, GE −56%,
   Boeing +42%, Visa +58%.
7. **Win/loss banner.** On the reveal: a winning round shows a green `You won +$…`
   banner, a loss shows red `You lost −$…`, a Pass shows neutral `You passed`.
8. **Guess still works** (regression): a correct company name OR ticker, in any case
   (`nvidia`, `NVDA`, `Coca Cola`), scores +2; a wrong guess −1; blank 0.

## Part 4 — Locked-Rule + Content-Leakage Scan (D019, standing duty)

- **Content-leakage scan — ALL 12 cards.** Read every scenario's hidden-card fields
  (title, companyDescription, macroContext, clues) and confirm NONE contain the
  company name, ticker, a founder/CEO reference, or an unmistakable product
  name/slogan. Each difficulty is out of scope here (placeholder data has one
  variant), but each card must have exactly 3 clues. Report any leak as ≥ MAJOR.
- **Scoring values** in `packages/game-engine/src/confidence.ts` still match soul.md
  (Low 10/±1, Med 40/±2, High 70/±3, All-In 100/±5; Pass −0.25).
- **Forbidden copy** absent from `apps/web` UI strings (`place bet`, `investment
  advice`, `guaranteed`, `buy/sell recommendation`, `profit strategy`).
- **MVP exclusions** untouched (no auth/DB/API/leaderboard/charting-lib).

## Do NOT

- Fix, refactor, or restyle anything — findings only.
- Run `git commit`/`git push` or modify the working tree.
- Re-run the full H001/H002/H003 criteria set from A001 — only re-check anything H005
  or H006 could plausibly have regressed. Focus on Parts 2–4.
- Soften a failed criterion; a criterion passes or it doesn't.

## Deliverable & Verdict

Write `agents/audits/A002_H005-H006.md` in the `agents/roles/auditor.md` format:
acceptance-criteria table for H005 (8 criteria) and H006 (6 criteria) with
Result + Evidence; a **Content-Leakage Scan** section listing all 12 cards checked;
locked-rule spot checks; findings tagged BLOCKER/MAJOR/MINOR; Notes for Orchestrator.

**Verdict:** FAIL if any criterion fails. PASS WITH FINDINGS if all pass but
MAJOR/MINOR exist. PASS if at most MINOR. Add a one-line `progress.md` pointer to the
audit. Do not commit — the orchestrator reviews your audit and commits.
