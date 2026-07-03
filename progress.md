# progress.md — Signal or Noise?

Every agent appends a session log entry here at the end of every working session.
Newest entries at the top of the log. Keep "Current Status" accurate — it is the
first thing the next agent reads.

## Current Status

- **Phase:** 1 - playable prototype COMMITTED (`232aa19`). H005+H006 fix-ups UNCOMMITTED in working tree (awaiting re-audit A002 + orchestrator review).
- **App state:** Monorepo scaffolded. Game engine: 24 passing tests. 20-round
  Classic Run playable - deep-navy `son` palette, two-line confidence buttons,
  call-locked state, wrong All-In bust (D014), Call the Company guess (D015), $1
  bankruptcy floor (D016), proportional payout (D017). 12 placeholder scenarios
  (pool doubled, no-repeat shuffle). Color ramp renders with static literal maps.
  Content leaks removed. Netflix shows +1135.6%. Reveal win/loss/pass banner.
  No auth, no DB, no server.
- **Next task:** **Re-audit A002** (handoff H007, GPT 5.5) covering H005 + H006 —
  browser-verify the two former blockers + variety/banner + 12-card leak scan.
  Orchestrator then commits both and closes Phase 1.
- **Blocked/Questions:** none. Orchestrator pre-review clean: 24/24 tests, 0
  interpolated Tailwind classes, guard fixed, 12 cards, 0 leak-string matches.

## How to Run (updated as the app grows)

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server at http://localhost:3000
pnpm test             # run game-engine tests (24 tests)
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

### 2026-07-03 — Implementor — H006 Scenario Variety + Win/Loss Reveal

**What changed:**
- Part A: Appended 6 new placeholder scenarios (Coca-Cola, Starbucks, Nvidia, GE, Boeing, Visa) to SCENARIOS array — total pool now 12. All hidden-card fields leak-checked per D018.
- Part B: Rewrote `buildRunScenarioList` — exhausts full pool in shuffled laps before repeating, with boundary-repeat guard (swaps first entry of new lap if it matches last emitted card).
- Part C: Added win/loss/pass/break-even banner at top of reveal card: green `+$…` for wins, red `−$…` for losses, neutral `You passed` / `Break-even`.

**Files changed:** `apps/web/lib/sampleScenarios.ts`, `apps/web/app/play/classic/run/page.tsx`

**How to run:** unchanged

**Tests:** 24 passing / 0 failing — `pnpm test`; `pnpm typecheck` clean; `pnpm lint` clean (no warnings or errors).

**Known issues:** None.

**Blocked/Questions:** None.

**Next recommended task:** Re-audit A002 covering H005+H006, then orchestrator commits and closes Phase 1.

### 2026-07-03 — Implementor — H005 A001 Fix-ups

**What changed:**
- Part A: Fixed final-round dead-end in `run/page.tsx` — guard no longer blocks locked/reveal/summary views when `scenario` is undefined (changed `(view === 'round' || view === 'locked')` to `view === 'round'`).
- Part B: Replaced runtime-interpolated Tailwind classes with fully-literal static maps (`CONFIDENCE_SELECTED_BOX`, `CONFIDENCE_SELECTED_TEXT`, `DECISION_SELECTED`). Deleted dead `confidenceColorClass`, `decisionColorClass`, and `const color = CONFIDENCE_COLORS[level]`. Confidence ramp and decision colors now render correctly.
- Part C: De-identified 4 placeholder strings: Amazon title ("Growth at Any Cost"), Amazon clue 1 (removed founder/mission-statement reference), Microsoft clue (removed "Windows"), BlackBerry title ("Losing the Screen War").
- Part D: Netflix `actualReturnPercent` corrected from 11.36 to 11.356 for `+1135.6%` display.

**Files changed:** `apps/web/app/play/classic/run/page.tsx`, `apps/web/lib/sampleScenarios.ts`

**How to run:** unchanged

**Tests:** 24 passing / 0 failing — `pnpm test`; `pnpm typecheck` clean; `pnpm lint` clean (no warnings or errors). grep for interpolated `border-${`/`bg-${`/`text-${` in run/page.tsx returned zero matches.

**Known issues:** None.

**Blocked/Questions:** None.

**Next recommended task:** Re-audit A002, then orchestrator commits and closes Phase 1. Then H006.

### 2026-07-03 — Orchestrator — Playtest round 2 (D019/D020, H006, role/roadmap)

**What changed:**
- Triaged 4 more playtest notes. Point "guess by name/ticker, case-forgiving" was
  already implemented (normalizeGuess + tickers in acceptedNames) — no work.
- D019: content-leakage is now a standing Auditor check (added to
  `agents/roles/auditor.md`) + an automated leakage/difficulty validator scheduled
  for the Phase 3 content pipeline (roadmap updated).
- D020 + H006: expand placeholder pool 6→12 (orchestrator-authored, leak-checked)
  and make `buildRunScenarioList` exhaust the pool before repeating; plus a clearer
  win/loss reveal banner. H006 depends on H005 (same files) — runs after it.
- Sounds/animation logged as a Phase 9 TODO (roadmap).

**Next recommended task:** Run H005 → re-audit A002 → commit/close Phase 1 → run H006.

### 2026-07-03 — Orchestrator — A001 review + H005 fix-up

**What changed:**
- Reviewed audit A001 (verdict FAIL). Independently verified both BLOCKERs in code:
  final-round guard at run/page.tsx:71 wrongly includes `view === 'locked'`, and
  confidence/decision buttons build Tailwind classes from runtime-interpolated
  color names (JIT never emits them).
- Found an additional content leak the audit missed: Microsoft card names the
  product "Windows" (same class as the Amazon MAJOR).
- Logged D018 (placeholder content still bound by soul.md content integrity).
- Authored `H005_a001_fixups.md` (approved) with exact before/after code for both
  blockers and exact replacement text for 4 content strings + Netflix precision.

**Next recommended task:** Run H005 (Implementor) → R005 → re-audit A002 → commit.

### 2026-07-03 - Auditor - A001

Audit filed at `agents/audits/A001_H001-H003.md` with verdict FAIL: full 20-round runs dead-end after Round 20 Lock In, and selected confidence ramp styles do not render.

### 2026-07-03 - Implementor - H003 Gameplay Fixes

**What changed:**
- Added D014 wrong All-In bust logic: incorrect All-In calls now lose the full stake,
  set bankroll to $0, and end the run.
- Added D015 Call the Company support: accepted-name matching, correct/wrong/no-guess
  Signal Score deltas, locked/reveal display lines, and Companies Called summary count.
- Added D016 bankruptcy floor at bankroll below $1.
- Fixed next-round state reset for action, confidence, and company guess.
- Rebalanced Apple, BlackBerry, Microsoft, and GameStop prototype scenarios to the H003
  windows/returns; added accepted names to all six scenarios.
- Added the setup-page scoring explainer card.
- Expanded game-engine tests to 24 total.

**How to run:** unchanged - `pnpm install`, `pnpm dev`, `pnpm test`, `pnpm typecheck`,
`pnpm lint` from repo root. Portable Node/pnpm may need to be on PATH on this machine.

**Tests:** 24 passing / 0 failing - `pnpm test`; `pnpm typecheck` clean; `pnpm lint`
clean; `pnpm install` clean.

**Known issues:**
- Netflix was not retuned per H003's Do NOT section. The current app displays its
  unchanged existing prototype return as `+1136.0%`; H003's acceptance text says
  `+1,135.6%`, which appears to be a pre-existing precision/display mismatch.

**Blocked/Questions:** none.

**Next recommended task:** Auditor review A001 covering H001 + H002 + H003, including
browser verification of wrong All-In bust, Call the Company, reset state, summary row,
and the retuned scenario reveals.

### 2026-07-03 — Orchestrator — Playtest decisions D013–D016 + H003

**What changed:**
- User playtest findings triaged: reset-between-rounds bug confirmed
  (run/page.tsx handleNext); "$14,200 gain" verified as correct math on the
  Netflix +1,135.6% card (deck balance issue, not engine bug).
- Decisions logged: D013 return-mix rebalance + content guideline, D014 wrong
  All-In = instant bust (soul.md amended), D015 "Call the Company" bonus guess
  (+2/−1/0, soul.md amended), D016 $1 bankruptcy floor.
- Open design question logged (NOT decided): composite Final Score /
  Information Tiers; bankroll remains primary score pending a design memo.
- Authored `H003_gameplay_fixes.md` (approved) covering all of the above.

**Next recommended task:** Run H003 (Implementor) → R003 review → then Auditor
A001 covering H001+H002+H003 → orchestrator commits the prototype.

### 2026-07-03 — Implementor — H002 Design Alignment

**What changed:**
- Extended Tailwind config with `son` color namespace from `docs/design/04_design_tokens.json` (deep-navy bg #08111F, signalBlue #4DA3FF, signalCyan #38D5E6, green #35D07F, amber #FFB84D, red #FF5C73, violet #A875FF)
- Replaced all `zinc-*` and `teal-*` classes across every screen with `son-*` tokens (grep clean: zero zinc/teal remaining)
- Redesigned confidence buttons to exactly two lines: `Label (40%)` / `$amount` (large bold), removed Signal Score impact from buttons (D010)
- Confidence color ramp: Low=son-signalCyan, Medium=son-green, High=son-amber, All-In=son-violet
- Decision button accents: Long=son-green, Short=son-red, Pass=son-textSecondary
- Sparkline component: added `variant` prop — lookback always son-signalCyan, outcome son-green/son-red by direction
- Difficulty selector: added explainer line per difficulty (Easy→"More direct clues.", Medium→"Balanced clues.", Hard→"Less obvious company context.")
- Added "Call locked" view state between round and reveal (D011): Lock In → centered card with "Call locked.", your call/confidence/at risk, "Reveal Result" button → reveal
- Primary action buttons (Play Now, Lock In, Next Round, Reveal Result, See Summary) use `son-signalBlue` with dark `son-textInverse` text
- Cards use `rounded-2xl`, buttons use `rounded-lg` per token radius scale

**How to run:** unchanged — `pnpm install && pnpm dev && pnpm test` from repo root

**Tests:** 18 passing / 0 failing — `pnpm test` (all H001 tests still green)

**Known issues:** none

**Blocked/Questions:** none

**Next recommended task:** Auditor review (A001) of H001 + H002 combined; manual walkthrough of locked state flow, confidence color ramp, 375px viewport

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
