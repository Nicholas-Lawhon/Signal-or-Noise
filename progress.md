# progress.md — Signal or Noise?

Every agent appends a session log entry here at the end of every working session.
Newest entries at the top of the log. Keep "Current Status" accurate — it is the
first thing the next agent reads.

## Current Status

- **Phase:** 0 + 1 COMPLETE (A002 PASS). Phase 2 COMPLETE under D024 via H012.
  Phase 3 (Scenario Schema & Content Pipeline) is next. Full Gate 1/Gate 2
  content enforcement returns for Phase 3 production content.
- **App state:** Monorepo scaffolded. Game engine: 37 passing tests. Phase 2 API
  complete (`calculateStake`, `scoreRound`, `applyRoundResult`, `createRunState`,
  `advanceRun`, `isBankrupt`, `summarizeRun`, `calculateLeaderboardTiebreakers`)
  plus streak tracking. 20-round Classic Run playable. 12 placeholder scenarios.
  No auth, no DB.
- **Next task:** Phase 3 content pipeline handoff, Gate A Growth, or composite
  score memo as planned.
- **Blocked/Questions:** none. Known prototype content issue: some placeholder
  Medium/Hard variants remain too guessable; accepted under D024 because Phase 3
  replaces placeholder content and restores full doc 09 gates.

## How to Run (updated as the app grows)

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server at http://localhost:3000
pnpm test             # run game-engine tests (37 tests)
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

### 2026-07-09 — Orchestrator — H012 review accepted under D024

**What changed:**
- Reviewed R009 and the H012 engine diff. Independently reran `pnpm typecheck`
  and `pnpm test`; both pass, with 37/37 tests green.
- Accepted H012 under D024; no formal audit needed for this pure engine hardening
  pass because tests cover the changed API and locked scoring math was preserved.
- Marked roadmap Phase 2 complete and advanced current phase to Phase 3.

**Tests:** 37 passing / 0 failing — `pnpm typecheck`; `pnpm test`.

**Known issues:** none for Phase 2 engine hardening.

**Blocked/Questions:** none.

**Next recommended task:** choose Phase 3 content pipeline, Gate A Growth, or
composite score memo.

### 2026-07-09 — Implementor — H012 Phase 2 game engine hardening

**What changed:**
- Hardened `packages/game-engine`: streak fields on `RunState`/`RunSummary`;
  `advanceRun`; `calculateLeaderboardTiebreakers` (+ optional `leaderboard.ts`);
  input guards on `createRunState` and leaderboard inputs; exported new types
  via package index. Scoring math unchanged.
- Expanded tests: zero return incorrect, streaks, advanceRun end/ongoing,
  leaderboard sortKey, guards. Suite 24 → 37 tests.
- Report: `agents/reports/R009_H012.md`. Handoff status → complete.
- Left all work uncommitted (D012).

**How to run:** unchanged (`pnpm test` now 37 tests).

**Tests:** 37 passing / 0 failing — `pnpm typecheck`; `pnpm test`.

**Known issues:**
- Web UI does not yet display streaks (out of H012 scope; state fields present).
- Placeholder content Gate 1/Gate 2 gaps deferred to Phase 3 (unchanged).

**Blocked/Questions:** none.

**Next recommended task:** Orchestrator review R009 + diff under D024; commit if
accepted; then Phase 3 or Gate A growth.

### 2026-07-09 — Orchestrator — H012 drafted for Phase 2 engine hardening

**What changed:**
- Drafted `agents/handoffs/H012_phase2_game_engine_hardening.md` for Grok 4.5:
  complete missing Phase 2 engine API (`advanceRun`, leaderboard tiebreakers),
  add streak tracking, preserve locked scoring math, and expand engine tests.

**Tests:** not run — handoff draft only.

**Known issues:** none.

**Blocked/Questions:** awaiting user approval before dispatch.

**Next recommended task:** approve H012, then orchestrator dispatches Grok 4.5.

### 2026-07-09 — Orchestrator — D024 development-speed review policy

**What changed:**
- Recorded D024: during prototype/MVP development, optimize for token-efficient
  progress. Formal audits are selective (phase gates, major feature additions,
  high-risk domains, production-readiness, or explicit request), not automatic for
  all medium-risk work.
- Updated agent workflow docs (`AGENTS.md`, `agents/README.md`, `routing.md`,
  role files, templates) to make tests + orchestrator review the default
  development loop and restore stricter gates for production readiness.
- Accepted H011 as a prototype content improvement under D024. A004 remains a
  useful strict-content audit record, but it no longer blocks moving to Phase 2.

**Tests:** docs/process change only; verification pending in orchestrator session.

**Known issues:**
- Placeholder content still has known Gate 1/Gate 2 weakness on some Medium/Hard
  cards. Deferred to Phase 3 production content pipeline.

**Blocked/Questions:** none.

**Next recommended task:** Phase 2 game-engine hardening.

### 2026-07-09 — Auditor — H011 / A004 content re-audit: FAIL (see `agents/audits/A004_H011.md`)

### 2026-07-09 — Implementor (curator) — H011 placeholder content fix-up

**What changed:**
- Rewrote A003-flagged variants in `apps/web/lib/sampleScenarios.ts` (visa /
  microsoft / starbucks Medium; blackberry / boeing Hard; gamestop / boeing Easy;
  starbucks Easy; boeing / blackberry Medium) plus titles where needed.
- Reshaped BlackBerry and Boeing `lookbackPrices` (last price still matches
  `outcomePrices[0]`; length 8 preserved).
- Updated `agents/reports/R007_H009_redteam.md`; filed `agents/reports/R008_H011.md`
  with Gate 1 lists and Gate 2 attempt-1/attempt-2 transcripts.
- Self-Verification item 4: stopped after two rewrite attempts on variants that
  still fail Gate 2; flagged for orchestrator (not iterated further).

**How to run:** unchanged.

**Tests:** 24 passing / 0 failing — `pnpm typecheck`; `pnpm test`.

**Known issues:**
- Gate 2 still FAIL after 2 attempts: visa Medium, microsoft Medium, starbucks
  Medium, blackberry Hard, boeing Hard, boeing Medium, gamestop Hard (variance
  vs A003 PASS). blackberry Medium PASS on attempt 2. Easy rewrites + distinctive
  hooks PASS Gate 2.

**Blocked/Questions:**
- Orchestrator: accept partial + re-audit, or authorize H012 for SV4 flags only?
- GameStop Hard non-determinism (A003 PASS vs H011 FAIL)?

**Next recommended task:** Orchestrator review of R008 + uncommitted diff; then
GPT 5.5 re-audit or narrow content follow-up.

### 2026-07-09 — Auditor — H010 / A003 content audit of H009: FAIL (see `agents/audits/A003_H009.md`)

### 2026-07-08 — Orchestrator — D023: Grok 4.5, characteristic routing, direct CLI dispatch

**What changed:**
- Recorded D023 (user approved): Grok 4.5 replaces the Claude Sonnet/Opus
  subagent execution tier (medium work); Claude subagents become orchestrator
  utility helpers only; GPT 5.5 expands to hard implementation, design/UI/UX,
  and content/scenario (Curator) work; DeepSeek v4 Pro unchanged. Routing is
  now characteristic-based (ranked model table: Intelligence/Cost/Style from
  the user, Speed/Autonomy proposed), with handoff prescriptiveness calibrated
  to the executor's autonomy.
- Direct CLI dispatch replaces manual paste: orchestrator launches executors
  headlessly (`grok -p`, `codex exec` via stdin pipe, `opencode run --auto -m
  deepseek/deepseek-v4-pro`). Risk-based approval gate (low = dispatch on task
  agreement; medium/high = user approves handoff first). Cross-model audit rule.
- Rewrote `agents/routing.md`; synced `agents/roles/orchestrator.md`,
  `agents/README.md`, `agents/handoffs/TEMPLATE.md` (Model tier → Model field).
  Fixed a pre-existing D012 contradiction in README's Implementor row
  ("commits" listed under Does).
- Smoke-tested all three CLIs headlessly against this repo (read-only prompt):
  Grok 4.5 and GPT 5.5 pass; found codex needs stdin piping and opencode needs
  `--auto` when headless (documented in routing.md).

**Tests:** n/a — docs-only change; CLI smoke tests passed as above.

**Blocked/Questions:** Grok 4.5 Style rating is TBD — user rates it after
Grok's first 2–3 handoffs.

**Next recommended task:** small pilot task routed and dispatched under D023
end-to-end; then the pending R007/H009 review + Auditor pass.

### 2026-07-07 - Implementor - H009 Difficulty Variants

**What changed:**
- Restructured `apps/web/lib/sampleScenarios.ts` from flat hidden fields to
  `hidden.easy/medium/hard` variants for all 12 placeholder scenarios.
- Rewrote all scenario titles and hidden-card copy to use difficulty-scaled
  clue counts: Easy 3, Medium 2, Hard 1.
- Updated Classic Run rendering to select `scenario.hidden[difficulty]` and
  updated setup-page difficulty explainers to the exact H009 copy.
- Added required red-team appendix at `agents/reports/R007_H009_redteam.md`.

**How to run:** unchanged.

**Tests:** 24 passing / 0 failing - `pnpm install`; `pnpm typecheck`;
`pnpm test`; `pnpm dev` responded 200 at `http://localhost:3000/play/classic`.
T3 preview at 375px confirmed setup explainer copy, Easy/Medium/Hard round cards
rendering 3/2/1 clues, and three Pass -> Lock In -> Reveal samples at each
difficulty.

**Known issues:** none.

**Blocked/Questions:** none.

**Next recommended task:** Orchestrator review of R007/H009, then Auditor pass
for leakage scan and Gate 2 guessability spot checks.

### 2026-07-07 — Orchestrator — C001 accepted; rulebook fixes landed; H009 drafted

**What changed:**
- Reviewed C001 (verdict: adopt with fixes — found the rulebook exploitable
  via cross-field triangulation despite sentence-level compliance). Accepted
  all 10 fixes; recorded as D022 second amendment with two adaptations
  (dropped the any-guess->50%-fails-Hard clause: a confident WRONG guess is
  camouflage, not a leak; temperature-0 pinning applies to the Phase 3
  automated validator, manual runs just fix model + prompt).
- Doc 09 updated: distinctive-hook + hindsight-thesis bans, ladder escalation
  rules, M broadened to Market-position/setup, spec table gains
  plausible-alternative minimums (Easy ≥2 / Medium 2–4 / Hard ≥4), sharpened
  informativeness floor, two-gate guessability protocol (human whole-card
  review + thresholded model test), calibrated pass/fail examples, reasoned
  guess lists. Curator role + prompt template synced. H008 marked complete.
- Authored H009 (draft): per-difficulty hidden cards for all 12 placeholder
  scenarios + `hidden.easy/medium/hard` type restructure + difficulty-aware
  rendering + title rewrites + red-team record file. Routed claude-subagent
  tier, risk medium (Auditor pass required).

**Tests:** n/a — docs only this session.

**Blocked/Questions:** none.

**Next recommended task:** user approves H009; orchestrator spawns the
subagent.

### 2026-07-07 - Consultant - H008 rulebook review: memo filed at `agents/consultations/C001_rulebook_review.md`; recommendation: adopt D022 rulebook with targeted fixes before H009.

### 2026-07-06 — Orchestrator — D022 amendment: merged GPT 5.5 memo additions into the rulebook

**What changed:**
- User shared an independent GPT 5.5 memo on scenario difficulty. Compared it
  against the committed rulebook; adopted 4 additions (D022 amendment, user
  approved): literal/triangulation leak terminology, mandatory fact-bank
  authoring step, Hard-first generation order, red-team likely-guesses lists
  (Medium calibrated to 2–4 plausible alternatives). Rejected: its retention
  of 3-clues-everywhere (user re-confirmed 3/2/1) and its claim that
  triangulation can't be auto-checked (guessability test does exactly that).
- Doc 09: rewrote AI Generation Workflow → Authoring Workflow (fact bank,
  Hard-first, red-team steps), merged the prompt template, extended review
  metadata + validation checklist, added leak terminology to Universal Bans.
- Curator role: fact bank + red-team duties added; triangulation leaks and
  vague-Hard added to Never list.
- H008 (still draft) context updated so the reviewer attacks the merged
  rulebook instead of re-proposing the memo's ideas.

**Tests:** n/a — docs only.

**Blocked/Questions:** none.

**Next recommended task:** unchanged — user approves + runs H008 on GPT 5.5,
then H009 placeholder regeneration.

### 2026-07-06 — Orchestrator — D022: difficulty-scaled clues + Scenario Content Rulebook

**What changed:**
- Playtest feedback: repetition (expected — 12 cards, 20 rounds) and trivial
  company guessability even on Medium. Root causes found: placeholder cards
  have NO per-difficulty variants (one hidden-text set for all difficulties,
  D006 shortcut — difficulty only changed bankroll), and doc 09's difficulty
  rules were one vague sentence per level.
- Recorded D022 (user approved): clue counts scale Easy 3 / Medium 2 / Hard 1;
  binding Scenario Content Rulebook written into doc 09 — universal bans +
  three-companies test, field roles, L1–L4 specificity ladder with per-
  difficulty caps, B/S/M clue taxonomy, decision-informativeness floor,
  title-must-pass-Hard-bar rule, LLM guessability test (manual now, automated
  in the Phase 3 validator per D019).
- Amended `soul.md` (Difficulty section + content-integrity clue rule + title
  rule). Synced `content-curator.md` and `auditor.md` clue-count checks.
- Authored H008 (draft): GPT 5.5 adversarial review of the rulebook →
  `agents/consultations/C001`. First handoff using the D021 routing fields.
- Known code follow-up for H009: `apps/web/lib/sampleScenarios.ts` type is
  `clues: [string, string, string]` and has no difficulty variants; run page
  must select variant by chosen difficulty.

**Tests:** n/a — docs only; no code touched.

**Blocked/Questions:** none.

**Next recommended task:** user approves + runs H008 on GPT 5.5; then H009
placeholder regeneration under the final rulebook.

### 2026-07-06 — Orchestrator — Workflow rework: model routing & risk tiers (D021)

**What changed:**
- Recorded D021 in `decisions.md`: routing-first workflow — orchestrator (Fable)
  classifies every task's type + risk and routes to the cheapest capable tier:
  DeepSeek (easy, manual handoff), Claude Sonnet/Opus subagent (medium,
  orchestrator-spawned in-session), GPT 5.5 (hard, manual handoff). Goal:
  efficiency + lower token cost. D012 review loop unchanged.
- New `agents/routing.md`: tier table, risk levels (low/medium/high) with review
  gates (Auditor pass now risk-driven, replacing "code-heavy"), micro-role policy.
- `agents/handoffs/TEMPLATE.md`: added Model tier + Risk header fields and an
  optional Task Framing (micro-role) section.
- `agents/roles/orchestrator.md`: added Route step to the loop, in-session
  subagent execution procedure, token-economy rules, micro-role guidance.
- `agents/README.md` + `agents/roles/implementor.md`: synced to the above.
- Rejected (recorded in D021 rationale): lifecycle folders, role renames,
  workflows/ dir, memory-file split.

**Tests:** n/a — docs-only change.

**Blocked/Questions:** none.

**Next recommended task:** unchanged — pick the next thread (Gate A Growth
positioning, composite-score design memo, or Phase 2 hardening) and route it
through the new `agents/routing.md` as its first real exercise.

### 2026-07-03 — Orchestrator — A002 review, Phase 1 closed

**What changed:**
- Reviewed A002 (PASS, 0 findings). Independently re-ran tests (24/24) and static
  checks earlier; accepted the browser-only criteria on the auditor's evidence.
- Committed H005+H006 app changes (audited) as the Phase-1 closeout commit.
- Acted on the audit's one note: stopped tracking `apps/web/tsconfig.tsbuildinfo`
  (build artifact) and added `*.tsbuildinfo` to `.gitignore`.
- Marked R005/R006 approved; roadmap Phases 0 + 1 → ✅; current phase → 2.

**Next recommended task:** Orchestrator + user pick the next thread — Gate A Growth
positioning, the composite-score design memo, or Phase 2 engine hardening.

### 2026-07-03 - Auditor - A002

Audit filed at `agents/audits/A002_H005-H006.md` with verdict PASS: H005/H006 criteria verified, former blockers fixed, 12-card leakage scan clean.

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
