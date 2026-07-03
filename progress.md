# progress.md — Signal or Noise?

Every agent appends a session log entry here at the end of every working session.
Newest entries at the top of the log. Keep "Current Status" accurate — it is the
first thing the next agent reads.

## Current Status

- **Phase:** 0 + 1 — scaffold and playable Classic Run prototype complete.
- **App state:** Monorepo scaffolded. Game engine built with 18 passing tests.
  20-round Classic Run is playable at `/play/classic/run?difficulty=<easy|medium|hard>`.
  No auth, no DB, no server-side logic.
- **Next task:** Auditor pass A001 on handoff H001; verify acceptance criteria 7–14
  manually (UI walkthrough).
- **Blocked/Questions:** none.

## How to Run (updated as the app grows)

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server at http://localhost:3000
pnpm test             # run game-engine tests (18 tests)
pnpm typecheck        # run TypeScript type checking
```

All from repo root. Requires Node.js LTS and pnpm 9.x.

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

### 2026-07-03 — Orchestrator — Report workflow + design pack adoption

**What changed:**
- New report-approval workflow (decision D012): executing agents write
  `agents/reports/R###_H###.md` and never commit; the orchestrator reviews the
  report + uncommitted diff and commits on approval. Updated `AGENTS.md`,
  `agents/README.md`, all 5 role files, handoff template; added
  `agents/reports/TEMPLATE.md`.
- Adopted `docs/design/` as canonical UI/UX source (D011); corrected its starting
  bankrolls to locked values (D009) and its confidence-button spec to the two-line
  no-Signal-impact format (D010).
- Authored fix-up handoff `H002_design_alignment.md` (status: approved) applying
  tokens palette, two-line confidence buttons, difficulty explainer copy, locked
  state, and `requirements.txt` cleanup to the H001 prototype.

**Blocked/Questions:** H001's work is uncommitted and unreviewed (it predates the
report rule). Orchestrator review + audit A001 pending before commit.

**Next recommended task:** Run H002 (Implementor), then Auditor A001 covering
H001+H002 together; orchestrator commits after approval.

### 2026-07-03 — Implementor — H001 Phase 0 + 1 Prototype

**What changed:**

*Part A — Monorepo scaffold (Phase 0):*
- Root: `pnpm-workspace.yaml`, `package.json` (with dev/test/typecheck/lint scripts, pnpm@9.15.0), `.env.example`, `.prettierrc`, `README.md`
- `packages/game-engine/`: `package.json`, `tsconfig.json` (strict, ES2022, Bundler), `vitest.config.ts`, source and test directories
- `packages/content/`: placeholder `README.md` (decision D006)
- `apps/web/`: Next.js 14 App Router app with TypeScript, Tailwind CSS, ESLint; named `"web"` in package.json; depends on `@signal-or-noise/game-engine: workspace:*`

*Part B — Game engine:*
- `src/types.ts`: Difficulty, RoundAction, Confidence, RunStatus, ScoreRoundInput/Output, CompletedRound, RunState, RunSummary
- `src/confidence.ts`: CONFIDENCE_CONFIG (from soul.md), calculateStake, STARTING_BANKROLL (easy 12500/medium 10000/hard 7500), CLASSIC_RUN_ROUNDS (20)
- `src/scoring.ts`: scoreRound — pass (0/0/same/−0.25/null), long/short (stake × return, capped loss, wasCorrect = rawReturn > 0)
- `src/run.ts`: createRunState, applyRoundResult (immutable), isBankrupt, summarizeRun (correct/wrong/pass counts, bestTrade, worstTrade)
- `src/index.ts`: re-exports all public exports

*Part B5–B6 — Tests (all passing):*
- `tests/scoring.test.ts`: 11 cases — correct/wrong long, correct/wrong short, pass, all-in win/loss, bankruptcy via capped short, short loss capped, calculateStake all levels, missing confidence throws
- `tests/run.test.ts`: 7 cases — createRunState defaults (3 difficulties), bankruptcy → throw, completed after totalRounds, immutability, summarizeRun stats

*Part C — Sample scenario data:*
- `apps/web/lib/sampleScenarios.ts`: 6 prototype scenarios (Netflix 2012, Apple 2007, BlackBerry 2008, Amazon 1999, Microsoft 2014, GameStop 2016), `buildRunScenarioList` with Fisher-Yates shuffle + cyclic repeat

*Part D — Web app screens:*
- `app/page.tsx` (landing): app name, tagline, explainer, Play Now button, disclaimer
- `app/play/page.tsx` (mode select): Classic Run (enabled), Daily Challenge + Portfolio Draft (disabled/Coming soon)
- `app/play/classic/page.tsx` (run setup): Easy/Medium/Hard with bankrolls via STARTING_BANKROLL
- `app/play/classic/run/page.tsx` (run — client component): top bar (round, bankroll, Signal Score), scenario card (era, description, macro, lookback sparkline, 3 clues), action toggle (Long/Short/Pass), confidence buttons (label/%/live $ stake, All-In amber styling, disabled on pass), Lock In, reveal view (company name, outcome chart, P&L, Signal Score delta, reveal text, fun fact), summary view (bankrupt/complete, all stats, best/worst trade with company names, Play Again/Home buttons)
- `components/Sparkline.tsx`: pure inline SVG polyline, teal/red color based on price direction
- `lib/format.ts`: formatMoney (round $), formatSignedMoney (±$), formatPercent (±%), formatSignalScore (±N)

**How to run:** `pnpm install` → `pnpm dev` → `pnpm test` (all from repo root)

**Tests:** 18 passing / 0 failing — `pnpm test` (Vitest, 2 test files, 18 tests)

**Known issues:**
- Node.js not pre-installed on dev machine; installed portable Node.js 24.18.0 + pnpm 9.15.0 at `%LOCALAPPDATA%\nodejs`
- Autoprefixer was initially missing from web app deps; added as devDependency
- TypeScript error in run.ts: `status` variable needed explicit `RunStatus` type annotation

**Blocked/Questions:** none

**Next recommended task:** Auditor review (A001) of handoff H001. Manual walkthrough of acceptance criteria 7–14 (full 20-round run, pass behavior, bankruptcy, signal score math, mobile 375px viewport, confidence button live dollar amounts).

### 2026-07-03 — Orchestrator — Groundwork setup

**What changed:**
- Initialized git repository; remote `origin` →
  https://github.com/Nicholas-Lawhon/Signal-or-Noise
- Created control files: `soul.md`, `AGENTS.md`, `CLAUDE.md`, `roadmap.md`,
  `progress.md`, `decisions.md`, `.gitignore`
- Created agent workflow: `agents/README.md`, 5 role files under `agents/roles/`
  (consultant, implementor, auditor, content-curator, growth),
  `agents/handoffs/TEMPLATE.md`, first handoff `H001_phase0_phase1_prototype.md`

**Tests:** n/a — no code yet

**Known issues:** none

**Blocked/Questions:** H001 awaiting user approval before an Implementor runs it.

**Next recommended task:** Run H001 with an Implementor agent.
