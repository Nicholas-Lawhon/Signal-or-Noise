# progress.md — Signal or Noise?

Every agent appends a session log entry here at the end of every working session.
Newest entries at the top of the log. Keep "Current Status" accurate — it is the
first thing the next agent reads.

## Current Status

- **Phase:** 0–3 COMPLETE; **Phase 4 Part A CLOSED** (D035). Current phase is
  **Phase 4 Part B — content generation at scale**: 40 cards (24 famous / 12
  moderate / 4 obscure per D034), 10 daily challenge pools, 10 famous market
  eras. Pipeline policy locked in **D036–D038** (C004 adopted). Database is
  Phase 5, Auth 6, Leaderboards 7, Daily Challenge 8 (D027).
- **App state:** Monorepo scaffolded. Game engine: 37 tests. Content package:
  Zod schema, validation CLI, offline Gate 2 harness (export/check, pinned
  grok-4.5 judge per D031/D032), 6 active seeds (Balanced Tension / D026).
  All 6 pass `validate` (9 plausible-count WARNs — pending H033 under-2-only
  recalibration); `gate2 check` 0 errors / 9 WARNs / 2 informational missing
  (Netflix Medium/Hard — fold into H035 per D035). No auth, no DB.
- **Next task:** Dispatch **H033** (doc 09 Part B amendment + plausible-count
  WARN recalibration, GPT 5.5). After orchestrator accepts H033: dispatch
  **H034** (batch-1 author 10 cards), then **H035** (blind Gate 2 + Netflix
  fold-in). User playtest after batch 1 before batches 3–4.
- **Handoffs ready:** `H033` status **approved**; `H034`/`H035` status
  **draft** (dispatch after H033 lands). Do not run H034 against pre-H033
  doc 09.
- **Workflow state:** D028 manual-by-default dispatch; D029 context/output
  budgets on every handoff; D030 state compaction; D033 model-agnostic roles.
  Phase 0–3 history in `agents/history/progress_phase_0_3.md`; Phase 4A
  history in `agents/history/progress_phase_4a.md`.
- **Blocked/Questions:** None. Await H033 execution.

## How to Run (updated as the app grows)

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server at http://localhost:3000
pnpm test             # run all package tests (game-engine 37 + content 50)
pnpm typecheck        # run TypeScript type checking
pnpm --filter @signal-or-noise/content validate   # validate scenario JSON seeds
pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/<HANDOFF>_payloads.json
pnpm --filter @signal-or-noise/content gate2 -- check
```

All from repo root. Requires Node.js LTS and pnpm 9.x.

## Archived History

Detailed session history for closed phases is archived under `agents/history/`.
Read it only when a handoff explicitly needs historical detail.

- `agents/history/progress_phase_0_3.md` - Phase 0-3 summaries and archived
  detailed session log.
- `agents/history/progress_phase_4a.md` - Phase 4 Part A session log: Gate 2
  harness, blind judge rounds, Medium/Hard rewrite arc, doc 09 readiness.

---

## Session Log Template

```markdown
### YYYY-MM-DD — [Role] — [Handoff ID or task]

**What changed:**
- ...

**How to run:** (only if it changed)

**Tests:** X passing / Y failing — command used

**Known issues:**
- ...

**Blocked/Questions:** (anything needing orchestrator/user input)

**Next recommended task:**
```

---

## Session Log

### 2026-07-09 - Orchestrator - D036–D038; H033/H034/H035 drafted

**What changed:**
- User adopted all C004 recommendations and both open-question leans
  (chart-silhouette review + escalate; named sources for market data and
  reveal claims).
- Recorded **D036** (Part B pipeline: structured fact bank, mandatory
  self-judge, under-2-only plausible WARNs, Hard informativeness @ conf 15,
  four batches of 10 with playtests after 1–2), **D037** (chart-silhouette
  ladder), **D038** (production source-quality standard).
- Drafted handoffs:
  - `H033` — doc 09 amendment + WARN recalibration (Implementor, GPT 5.5,
    **approved** for dispatch)
  - `H034` — batch-1 author 10 drafts (Content Curator, GPT 5.5, draft until
    H033 accepted)
  - `H035` — batch-1 blind Gate 2 + Netflix Medium/Hard fold-in (Grok 4.5,
    draft until H034 complete)

**How to run:** unchanged.

**Tests:** not rerun this session (docs/decisions/handoffs only).

**Known issues:**
- Pre-H033: 9 plausible-count WARNs still fire on identity-passing cards.
- Netflix Medium/Hard still missing stored Gate 2 (D035; H035 backstop).

**Blocked/Questions:** none.

**Next recommended task:** Manual dispatch of H033 (standard prompt below).

### 2026-07-09 - Orchestrator - R044/C004 accepted; D035; Phase 4A CLOSED

**What changed:**
- Reviewed `agents/reports/R044_H032.md` and the Netflix diff: changes confined
  to Medium/Hard hidden-card prose, review metadata, and stale Gate 2 removal;
  Easy card, Easy Gate 2 evidence, and frozen fields untouched. Accepted.
- Accepted `agents/consultations/C004_doc09_generation_readiness.md`; its five
  decision points and two open questions are queued for user decision as the
  Part B planning input.
- Recorded D035 (user approved): Phase 4 Part A closed; Netflix two-payload
  blind rejudge (planned H033) waived on self-check margins + diff review;
  the 2 missing Gate 2 variants are an accepted residual, foldable into the
  first Part B batch judging.
- Marked R044 approved; wrote `agents/reports/R045_R044_C004_review.md`.
- Roadmap: Part A marked closed with acceptance evidence; current phase →
  Part B. Archived the Phase 4A session log to
  `agents/history/progress_phase_4a.md` per D030.

**How to run:** unchanged.

**Tests:** validate 6/6 (9 WARNs); gate2 check 0 errors / 9 WARNs / 2
informational missing; content 50/50; root 87/87; typecheck pass.

**Known issues:**
- Netflix Medium/Hard carry self-check evidence only (accepted per D035).
- Plausible-count WARNs on stored results pending C004 decision point 3.

**Blocked/Questions:** user decisions on C004 points 1–5 + open questions
(chart-silhouette policy, Part B source-quality standard).

**Next recommended task:** Record user's C004 decisions (D036+), then draft
H033 doc 09 amendment handoff and the Part B batch-1 pipeline handoffs.
