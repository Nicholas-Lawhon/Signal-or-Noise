# progress.md â€” Signal or Noise?

Every agent appends a session log entry here at the end of every working session.
Newest entries at the top of the log. Keep "Current Status" accurate â€” it is the
first thing the next agent reads.

## Current Status

- **Phase:** 0–3 COMPLETE (Phase 3 closed by user 2026-07-09; A005 PASS WITH
  FINDINGS). D027 renumbered the roadmap: current phase is **Phase 4 — Content
  Foundation & Expansion, Part A** (content-rules/validator hardening before
  Part B generation at scale); Database is now Phase 5, Auth 6, Leaderboards 7,
  Daily Challenge 8.
- **App state:** Monorepo scaffolded. Game engine: 37 tests. Content package:
  Zod schema, validation CLI, **20 content tests**, 6 active sample JSON
  scenarios (Balanced Tension / D026). A005 MAJORs 1–3 closed by H018; A005
  MINORs 1/2/4 closed by H020 (calendar-date validity, price/return consistency,
  likely-guess quality floor + named Hard lists). Package root is browser-safe
  (no Node fs re-exports). Classic Run loads from `@signal-or-noise/content`.
  No auth, no DB.
- **Next task:** Draft the automated Gate 2 model harness handoff (Grok 4.5
  executor and judge per D031) using cleaned likely-guess metadata from H020.
- **Workflow state:** D029 added token-efficient context routing; D030 added
  state compaction. New handoffs require a Context Manifest, Context Budget, and
  Output Budget; Fable/high-reasoning executor runs require explicit user
  override with a cost/context rationale. Detailed Phase 0-3 history is archived
  in `agents/history/progress_phase_0_3.md`. Dispatch mode remains
  manual-by-default (D028).
- **Blocked/Questions:** none.

## How to Run (updated as the app grows)

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server at http://localhost:3000
pnpm test             # run all package tests (game-engine 37 + content 20)
pnpm typecheck        # run TypeScript type checking
pnpm --filter @signal-or-noise/content validate   # validate scenario JSON seeds
```

All from repo root. Requires Node.js LTS and pnpm 9.x.

## Archived History

Detailed session history for closed phases is archived under `agents/history/`.
Read it only when a handoff explicitly needs historical detail.

- `agents/history/progress_phase_0_3.md` - Phase 0-3 summaries and archived
  detailed session log.

---

## Session Log Template

```markdown
### YYYY-MM-DD â€” [Role] â€” [Handoff ID or task]

**What changed:**
- ...

**How to run:** (only if it changed)

**Tests:** X passing / Y failing â€” command used

**Known issues:**
- ...

**Blocked/Questions:** (anything needing orchestrator/user input)

**Next recommended task:**
```

---

## Session Log

### 2026-07-09 - Orchestrator - R017 accepted; H020 committed

**What changed:**
- Reviewed R017/H020 and the content-package diff. Accepted the implementation:
  calendar-valid ISO dates, price/return consistency, chart-boundary continuity,
  and reviewed/active likely-guess quality rules are now enforced offline.
- Confirmed six active seeds pass the hardened validator with named Hard likely
  guesses; Visa return corrected to match start/end prices.
- Marked R017 approved and committed the approved workflow/content batch.

**How to run:** unchanged.

**Tests:** `pnpm --filter @signal-or-noise/content test` 20 passing;
`pnpm --filter @signal-or-noise/content validate` 6/6, 0 warnings;
`pnpm test` 57 passing; `pnpm typecheck` pass.

**Known issues:** Gate 2 API harness still future work.

**Blocked/Questions:** none.

**Next recommended task:** draft the Gate 2 implementation handoff.

### 2026-07-09 - Implementor - H020 A005 MINOR validator hardening

**What changed:**
- Calendar-date refine on ISO `YYYY-MM-DD` fields in `schema.ts` (rejects
  impossible dates such as `2020-02-30`).
- Price/return consistency in `validation.ts`: `actualReturnPercent` vs
  `(end-start)/start` within 0.01; lookback-last vs outcome-first within 0.05;
  existing whole-percent guard (`abs >= 20`) kept.
- Likely-guess quality for `reviewed`/`active` only: Easy ≥2, Medium 2–4,
  Hard ≥4 named companies; reject generic peer-bucket words.
- Updated all six active seeds' `hardLikelyGuesses` to named lists; fixed Visa
  `actualReturnPercent` 0.58 → 0.591 (was outside 0.01 of 13/22).
- Six new content tests (20 total). Report: `agents/reports/R017_H020.md`.

**How to run:** unchanged (`pnpm test` now 57 total: 37 + 20).

**Tests:** content 20 passing; full `pnpm test` 57 passing / 0 failing;
`pnpm typecheck` pass; content validate 6/6, 0 warnings.

**Known issues:** Gate 2 API harness still future work. Placeholder `rg` hits
remain only on legitimate `company.sector` / `company.industry` fields.

**Blocked/Questions:** none.

**Next recommended task:** orchestrator review R017_H020 + content-package
diff and commit; then draft Gate 2 implementation handoff (D031).

### 2026-07-09 - Orchestrator - C003 accepted; D031 + H020 drafted

**What changed:**
- Reviewed C003 with the user and recorded D031: Grok 4.5 is the approved
  executor and pinned automated Gate 2 judge; D022 temperature wording is
  clarified to the most deterministic supported configuration; direction
  leakage starts WARN-only; Easy rank 4-5 is WARN.
- Marked H019 complete.
- Drafted approved H020 for Grok 4.5 to close A005 MINORs 1/2/4: calendar-date
  validity, price/return consistency, and named likely-guess metadata quality.
- Report written at `agents/reports/R016_c003_resolution_h020.md`.

**How to run:** unchanged.

**Tests:** not run - decisions/handoff/progress only.

**Known issues:** Gate 2 API harness is still future work after H020.

**Blocked/Questions:** none.

**Next recommended task:** user manually dispatches H020 to Grok 4.5, then
orchestrator reviews R017_H020 and the diff.

### 2026-07-09 - Orchestrator - State compaction policy + progress archive

**What changed:**
- Archived detailed Phase 0-3 session history to
  `agents/history/progress_phase_0_3.md` and kept `progress.md` focused on live
  Phase 4 state plus recent workflow/Phase 4 setup entries.
- Added a Decision Index and D030 state compaction policy to `decisions.md`.
- Updated workflow docs so orchestrator phase-close work includes state
  compaction and agents only load archives when handoffs name them.
- Report written at `agents/reports/R015_state_compaction.md`.

**How to run:** unchanged.

**Tests:** not run - docs/workflow only. Ran consistency/size checks.

**Known issues:** none.

**Blocked/Questions:** C003 still awaits orchestrator/user review.

**Next recommended task:** Review C003's four decision points, then draft H020
with a small Context Manifest using the D029/D030 workflow.

### 2026-07-09 - Orchestrator - Token usage investigation + D029 workflow efficiency

**What changed:**
- Investigated the two recent high-token consultation patterns: H019/C003 and
  H013/C002. Root cause is broad required reading plus expensive/high-reasoning
  executor selection plus long memo outputs; `progress.md` alone is ~49k chars
  (~12k rough tokens), `decisions.md` ~30k chars, doc 09 ~26k chars, and C002/C003
  each produced ~24k-28k char memos.
- Recorded D029 in `decisions.md`: context/output budgets are now first-class.
  Updated `AGENTS.md`, `CLAUDE.md`, `agents/routing.md`, `agents/README.md`, all
  role files, and handoff/report templates so future agents load scoped context
  only and Fable/high-reasoning execution is opt-in by explicit override.
- Report written at `agents/reports/R014_token_workflow.md`.

**How to run:** unchanged.

**Tests:** not run - docs/workflow only. Consistency greps and `git diff --stat`
run.

**Known issues:**
- Existing historical handoffs still contain old broad-context language; do not
  rewrite executed handoffs. New handoffs must use the updated template.

**Blocked/Questions:** C003 still awaits orchestrator/user review.

**Next recommended task:** Review/approve the D029 workflow diff, then review C003
decision points before drafting H020 with the new context/output budget fields.

### 2026-07-09 â€” Consultant â€” H019 / C003 automated Gate 2 guessability check design: memo filed at `agents/consultations/C003_automated_guessability_check.md`; recommendation: opt-in `gate2` CLI (pinned claude-sonnet-4-6, deterministic top-5 + direction check) with results cached in `review.gate2` and enforced offline by `validate` for reviewed/active; 4 decision points flagged for orchestrator.

### 2026-07-09 â€” Orchestrator â€” D028 manual-default dispatch; H019 consultation drafted

**What changed:**
- Recorded D028 (user approved): manual handoff is the default dispatch mode;
  orchestrator-driven dispatch (headless CLI or tool call) requires explicit
  user permission per dispatch or session. Utility subagents for the
  orchestrator's own work stay permission-free. Synced `agents/routing.md`
  (dispatch section) and `agents/roles/orchestrator.md` (loop step 5).
- Drafted + approved `agents/handoffs/H019_gate2_guessability_consultation.md`:
  Consultant memo (C003) designing the automated Gate 2 guessability check â€”
  executor per user choice is **Fable 5 at high reasoning effort** (not GPT
  5.5). User dispatches it manually per D028.
- Sequencing agreed with user: consultation first; H020 (Grok, A005 MINORs
  1/2/4) drafts after C003 lands so the memo can inform MINOR-4's quality
  floor.

**Tests:** not run â€” docs/orchestration only.

**Known issues:** none new.

**Blocked/Questions:** awaiting C003 memo from the manually-dispatched H019.

**Next recommended task:** user runs H019 with Fable 5 High; orchestrator
reviews C003, records any decisions, then drafts H020 + remaining Part A
handoffs.

### 2026-07-09 â€” Orchestrator â€” R013 accepted; H018 committed

**What changed:**
- Reviewed R013 + the H018 diff line-by-line; scope exact (Amazon retitle,
  metadata leakage scan, banned-terms guard, four tests). Accepted and
  committed per D012. A005 MAJORs 1â€“3 and MINOR-3 are now closed.

**Tests:** `pnpm typecheck` pass; `pnpm test` 51 passing / 0 failing;
content validate 6/6, 0 warnings; `pnpm build` pass.

**Known issues:** A005 MINORs 1/2/4 remain Phase 4 Part A work.

**Blocked/Questions:** none.

**Next recommended task:** draft Phase 4 Part A handoffs â€” recommended order:
GPT 5.5 consultant memo on the automated Gate 2 guessability mechanism first,
then validator MINORs + doc 09 generation-readiness + active-card re-review.

### 2026-07-09 â€” Implementor â€” H018 A005 validator & content fix-ups

**What changed:**
- Amazon seed title: `"Peak Expectations"` â†’ `"The Scale Bet"` (MAJOR-1).
- `collectHiddenTexts` now takes full `Scenario` and scans pre-decision
  metadata `era`, `decisionDateLabel`, `holdingPeriodLabel` for leakage and
  sentiment warnings (MAJOR-2).
- Business-rule: `reviewed`/`active` with empty `identityBannedTerms` fail
  validation; draft/inactive/archived exempt (MAJOR-3).
- Four new content tests: era leakage, decisionDateLabel ticker leakage,
  empty banned-terms active vs draft, Medium with 2 setupHints (MINOR-3).

**How to run:** unchanged

**Tests:** 51 passing / 0 failing (`pnpm test`: game-engine 37 + content 14);
`pnpm typecheck` pass; content validate 6/6; `pnpm build` pass.

**Known issues:**
- A005 MINORs 1/2/4 still deferred to Phase 4 Part A (D027).

**Blocked/Questions:** none.

**Next recommended task:** orchestrator review R013; draft Phase 4 Part A
handoffs.

### 2026-07-09 â€” Orchestrator â€” Phase 3 closed; D027 phase reorder; H018 approved + dispatched

**What changed:**
- User approved Phase 3 close: roadmap Phase 3 â†’ âœ… (H015/H016, A005 PASS WITH
  FINDINGS).
- Recorded D027 (user approved): Content Expansion moves up from Phase 8 to
  Phase 4, split into Part A (content-rules & validator hardening,
  AI-generation readiness, re-review of active cards) and Part B (generation
  at scale). Database â†’ 5, Auth â†’ 6, Leaderboards â†’ 7, Daily Challenge â†’ 8.
  Rationale: the cards are the game; retire content-quality risk before
  building more systems.
- Rewrote `roadmap.md` phases 4â€“8 accordingly; updated AGENTS.md phase
  references (Prisma/database now Phase 5+); Business Gate B now keyed to the
  renumbered Daily Challenge phase.
- H018 status â†’ approved (deferral notes retargeted from "Phase 8" to
  "Phase 4 Part A"); dispatched to Grok 4.5 headlessly per routing.md.

**Tests:** not run this entry â€” docs/orchestration only (H018 verification
happens at R013 review).

**Known issues:**
- Pre-D027 phase-number references in historical decisions/docs refer to the
  old numbering (see D027 renumbering note); docs/10 ordering superseded by
  roadmap.md.

**Blocked/Questions:** none.

**Next recommended task:** review R013 + diff when Grok finishes; then draft
Phase 4 Part A handoffs (validator MINORs, automated Gate 2 check, doc 09
generation-readiness review, active-card re-review).
