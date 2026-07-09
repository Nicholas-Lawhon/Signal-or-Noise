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
  Zod schema, validation CLI, 6 active sample JSON scenarios (Balanced Tension /
  D026). A005 MAJORs 1–3 closed by H018; A005 MINORs 1/2/4 closed by H020.
  **H021–H028 accepted:** H027 Hard rewrites + shared labels landed; H028 wrote
  fresh blind Gate 2 results for all 18 Easy/Medium/Hard payloads
  (`model: grok-4.5`, `promptVersion: guess.v1+direction.v1`,
  `testedAt: 2026-07-09T18:00:00.000Z`). Easy identity passes 6/6. Medium
  identity fails 6/6; Hard identity fails 6/6. `validate` 0/6 with Medium/Hard
  Gate 2 errors; `gate2 check` 14 errors / 12 warnings / 0 missing. Review
  report `agents/reports/R035_R034_review.md`. Active seeds are **not** Gate-2-clean.
  No auth, no DB.
- **Next task:** Draft a Medium+Hard identity rewrite handoff for all six seeds,
  preferably avoiding shared labels so the passing Easy Gate 2 results can stay
  valid. Re-export payloads and rejudge changed variants after rewrites.
- **Workflow state:** D029 added token-efficient context routing; D030 added
  state compaction. New handoffs require a Context Manifest, Context Budget, and
  Output Budget; Fable/high-reasoning executor runs require explicit user
  override with a cost/context rationale. Detailed Phase 0-3 history is archived
  in `agents/history/progress_phase_0_3.md`. Dispatch mode remains
  manual-by-default (D028).
- **Blocked/Questions:** none from H028. Identity failures are expected handoff
  outcomes — orchestrator decides rewrite scope.

## How to Run (updated as the app grows)

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server at http://localhost:3000
pnpm test             # run all package tests (game-engine 37 + content 50)
pnpm typecheck        # run TypeScript type checking
pnpm --filter @signal-or-noise/content validate   # validate scenario JSON seeds
pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H022_payloads.json
pnpm --filter @signal-or-noise/content gate2 -- check
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

### 2026-07-09 - Orchestrator - R034 accepted; H028 approved

**What changed:**
- Reviewed `agents/reports/R034_H028.md`, the active scenario JSON diff, and the
  H028 write-back against `agents/gate2/H027_payloads.json`.
- Confirmed the diff is limited to stored `review.gate2` entries and H028
  report/progress/status updates.
- Marked `agents/reports/R034_H028.md` approved and wrote
  `agents/reports/R035_R034_review.md`.

**How to run:** unchanged.

**Tests:** content validate 0/6 with expected Medium/Hard identity errors and 12
warnings; gate2 check 14 errors / 12 warnings / 0 missing; content 50/50; root
87/87; typecheck pass.

**Known issues:**
- Easy Gate 2 passes on all 6 active seeds.
- Medium and Hard Gate 2 fail identity on all 6 active seeds.

**Blocked/Questions:** none.

**Next recommended task:** Draft Medium+Hard identity rewrite handoff for all
six seeds, preferably preserving shared labels so Easy results remain valid.

### 2026-07-09 - Content Curator - H028 blind Gate 2 rejudge (all 18)

**What changed:**
- Blind-judged all 18 H027 payloads (Easy/Medium/Hard × 6) using only payload,
  difficulty, and payloadHash.
- Wrote `review.gate2.easy|medium|hard` on all 6 active scenario JSON files.
- Preserved card content, market data, sources, reveal, and review metadata
  other than gate2.
- Report: `agents/reports/R034_H028.md`. Handoff status → complete.

**How to run:** unchanged.

**Tests:** validate 0/6 (6 failed, 12 warnings — Medium/Hard identity); gate2
check 14 errors / 12 warnings / 0 missing; content 50/50; root 87/87;
typecheck pass.

**Known issues:**
- Easy Gate 2 passes on all 6.
- Medium and Hard Gate 2 fail identity on all 6 (too identifiable).
- No content rewrites in this handoff (per instructions).

**Blocked/Questions:** none — orchestrator should choose next rewrite scope.

**Next recommended task:** Orchestrator review R034; draft Medium+Hard identity
rewrite handoff for all six seeds.

### 2026-07-09 - Orchestrator - H028 blind Gate 2 rejudge approved

**What changed:**
- Drafted and approved `agents/handoffs/H028_blind_gate2_rejudge_h027_all.md`.
- Scoped H028 to blind-judge all 18 payloads in `agents/gate2/H027_payloads.json`
  because H027 shared-label edits invalidated Easy, Medium, and Hard results.
- Wrote `agents/reports/R033_h028_draft.md`.

**How to run:** unchanged.

**Tests:** not run - handoff/report/progress drafting only.

**Known issues:**
- Active seeds still have 18 missing Gate 2 results until H028 executes.

**Blocked/Questions:** none.

**Next recommended task:** Manually dispatch H028, then review
`agents/reports/R034_H028.md`.

### 2026-07-09 - Orchestrator - R031 accepted; H027 approved

**What changed:**
- Reviewed `agents/reports/R031_H027.md`, the active scenario JSON diff, and
  `agents/gate2/H027_payloads.json`.
- Confirmed H027 stayed within the shared-label exception: Easy/Medium prose and
  protected scenario facts are unchanged; stale Gate 2 entries were removed.
- Marked `agents/reports/R031_H027.md` approved and wrote
  `agents/reports/R032_R031_review.md`.

**How to run:** unchanged.

**Tests:** content validate 6/6 with 0 warnings; gate2 check 0 errors / 0
warnings / 18 missing; H027 export 18 payloads; content 50/50; root 87/87;
typecheck pass; build pass.

**Known issues:**
- No stored Gate 2 judgments remain after shared-label changes; active seeds are
  not Gate-2-clean until the next blind judge writes fresh results.

**Blocked/Questions:** none.

**Next recommended task:** Draft the blind Gate 2 rejudge handoff over
`agents/gate2/H027_payloads.json` for all 18 payloads.

### 2026-07-09 - Content Curator - H027 Hard Gate 2 identity rewrite

**What changed:**
- Rewrote Hard hidden-card fields on all 6 active seeds after H026 identity fails.
- Used shared-label exception on all 6: year-only `decisionDateLabel`; softened
  eras (except Visa era kept); retitled Amazon/Microsoft/Netflix/NVIDIA/Visa.
- Updated `review.hardLikelyGuesses`, factBank prohibited hooks, and reviewNotes.
- Removed all stored `review.gate2` entries (easy/medium/hard) as stale.
- Exported `agents/gate2/H027_payloads.json` (18 entries).
- Report: `agents/reports/R031_H027.md`. Handoff status → complete.

**How to run:** unchanged (use H027_payloads.json for next export/judge path).

**Tests:** validate 6/6; gate2 check 0 errors / 18 missing; content 50/50;
root 87/87; typecheck pass; build pass.

**Known issues:**
- No Gate 2 judgments stored; seeds are not Gate-2-clean yet.
- Follow-up blind judge must rejudge easy+medium+hard for all 6 scenarios.
- Lookback chart silhouettes unchanged (market data frozen by handoff).

**Blocked/Questions:** none.

**Next recommended task:** Orchestrator review R031; draft blind rejudge handoff
for all 18 H027 payloads.

### 2026-07-09 - Orchestrator - H027 Hard identity rewrite approved

**What changed:**
- Drafted and approved `agents/handoffs/H027_hard_gate2_identity_rewrite.md`.
- Scoped H027 to rewrite failing Hard variants after H026, remove stale Hard
  Gate 2 entries, and export `agents/gate2/H027_payloads.json`.
- Added a bounded shared-label exception: if title/era/date/holding-period labels
  must change to break Hard identity, the executor must remove all affected stale
  Gate 2 entries and report the expanded rejudge scope.
- Wrote `agents/reports/R030_h027_draft.md`.

**How to run:** unchanged.

**Tests:** not run - handoff/report/progress drafting only.

**Known issues:**
- Active seeds still fail Hard Gate 2 until H027 and the follow-up blind judge
  pass land.

**Blocked/Questions:** none.

**Next recommended task:** Manually dispatch H027, then review
`agents/reports/R031_H027.md` and draft the blind rejudge handoff.

### 2026-07-09 - Orchestrator - R028 accepted; H026 approved

**What changed:**
- Reviewed `agents/reports/R028_H026.md`, the active scenario JSON diff, and
  `agents/handoffs/H026_blind_gate2_rejudge_medium_hard.md`.
- Confirmed H026 stayed scoped to stored `review.gate2.medium|hard` write-back:
  Easy Gate 2 and scenario content were preserved.
- Marked `agents/reports/R028_H026.md` approved and wrote
  `agents/reports/R029_R028_review.md`.

**How to run:** unchanged.

**Tests:** content validate 0/6 with 6 expected Hard identity errors and 8
warnings; gate2 check 6 errors / 8 warnings / 0 missing; content 50/50; root
87/87; typecheck pass.

**Known issues:**
- All 6 Hard variants fail Gate 2 identity under D031 thresholds.
- Medium identity passes but still warns on 5 plausible guesses per card.
- Duplicate R-number process artifact remains:
  `agents/reports/R028_h026_draft.md` and `agents/reports/R028_H026.md`.

**Blocked/Questions:** none; threshold gaming is not recommended.

**Next recommended task:** Draft Hard rewrite handoff with explicit permission
to inspect/freeze-break title, era, date, and holding-period labels, then export
and blind-rejudge Hard only.

### 2026-07-09 - Content Curator - H026 blind Gate 2 rejudge Medium/Hard

**What changed:**
- Blind-judged 12 Medium/Hard payloads from `agents/gate2/H025_payloads.json`
  (payload-only; Easy ignored).
- Wrote `review.gate2.medium` and `review.gate2.hard` on all 6 active seeds;
  preserved Easy Gate 2 and all card content. Report: `agents/reports/R028_H026.md`.
  Handoff status → complete.

**How to run:** unchanged.

**Tests:** content validate 0/6 (6 Hard identity errors, 8 warns); gate2 check
6 errors / 8 warns / 0 missing; content 50/50; root 87/87; typecheck pass.

**Known issues:**
- All 6 Hard Gate 2 fail: correct company #1 with conf ≥15 after H025 rewrite.
- Medium: identity OK; plausible-count WARN (5 vs 2–4) on all six.
- Easy direction WARNs remain (Amazon/Visa).

**Blocked/Questions:** Orchestrator decision on Hard content fix path before
active seeds can pass validate.

**Next recommended task:** Orchestrator review R028; draft Hard rewrite handoff
if accepted as raw judge output.

### 2026-07-09 - Orchestrator - H026 blind rejudge drafted

**What changed:**
- Drafted `agents/handoffs/H026_blind_gate2_rejudge_medium_hard.md` to judge the
  12 rewritten Medium/Hard payloads in `agents/gate2/H025_payloads.json`.
- Scoped H026 to preserve existing Easy Gate 2 entries and write only
  `review.gate2.medium|hard`.
- Wrote `agents/reports/R028_h026_draft.md`.

**How to run:** unchanged.

**Tests:** not run - handoff/report/progress drafting only.

**Known issues:**
- Medium/Hard Gate 2 remains missing until H026 executes.
- Missing Gate 2 still not fail-closed.

**Blocked/Questions:** H026 awaits user approval before manual dispatch.

**Next recommended task:** Approve and manually dispatch H026 to Grok 4.5.

### 2026-07-09 - Orchestrator - R026 accepted; H025 approved

**What changed:**
- Reviewed `agents/reports/R026_H025.md`, the active-seed diff, and
  `agents/gate2/H025_payloads.json`.
- Confirmed Easy hidden cards, Easy Gate 2 entries, metadata, market data,
  reveal, sources, status, and company identity are unchanged.
- Marked R026 approved and wrote `agents/reports/R027_R026_review.md`.

**How to run:** unchanged.

**Tests:** content validate 6/6 with 2 pre-existing Easy direction WARNs; gate2
check 0 errors / 2 warnings / 12 missing; exported 18 payloads; content 50/50;
root 87/87; typecheck pass; build pass.

**Known issues:**
- Medium/Hard Gate 2 still needs blind Grok 4.5 re-judgment.
- Missing Gate 2 still not fail-closed.
- Easy direction WARNs on Amazon/Visa remain.

**Blocked/Questions:** none.

**Next recommended task:** Draft and dispatch the blind Gate 2 judge handoff
against `agents/gate2/H025_payloads.json`.

### 2026-07-09 - Content Curator - H025 medium/hard content rewrite

**What changed:**
- Rewrote Medium and Hard hidden-card fields for all 6 active sample seeds,
  removing H023 triangulation leaks while keeping Long/Short decision tension.
- Updated `review.factBank`, `mediumLikelyGuesses` (4 each), `hardLikelyGuesses`
  (≥4 each), and `reviewNotes`; removed stale `review.gate2.medium|hard`; kept
  Easy text and Easy Gate 2.
- Exported `agents/gate2/H025_payloads.json` (18 payloads). Report:
  `agents/reports/R026_H025.md`. Handoff status → complete.

**How to run:** unchanged. Prefer `H025_payloads.json` for the next Gate 2 judge.

**Tests:** content validate 6/6 (2 Easy direction WARNs); gate2 check 0 errors /
2 warns / 12 missing; content 50/50; root 87/87; typecheck pass; build pass.

**Known issues:**
- Medium/Hard Gate 2 not re-judged yet (payloads ready for follow-up handoff).
- Missing Gate 2 still not fail-closed.
- Easy direction WARNs on Amazon/Visa remain.

**Blocked/Questions:** none.

**Next recommended task:** Orchestrator review R026; commit on approval; dispatch
blind Grok Gate 2 judge for Medium/Hard write-back.

### 2026-07-09 - Orchestrator - H025 medium/hard rewrite drafted

**What changed:**
- Drafted `agents/handoffs/H025_medium_hard_content_rewrite.md` for rewriting
  the failing Medium/Hard active seed variants after H023 Gate 2 identity
  failures.
- Routed the handoff to GPT 5.5 as high-risk Content Curator work; formal blind
  Gate 2 judgment remains a follow-up Grok handoff per D032.
- Wrote `agents/reports/R026_h025_draft.md`.

**How to run:** unchanged.

**Tests:** not run - handoff/report/progress drafting only.

**Known issues:**
- Active Medium/Hard seed copy remains too identifiable until H025 executes.
- Missing Gate 2 is still not fail-closed.

**Blocked/Questions:** H025 awaits user approval before manual dispatch.

**Next recommended task:** Approve and manually dispatch H025 to GPT 5.5.

### 2026-07-09 - Orchestrator - R024 accepted; H023/H024 approved

**What changed:**
- Reviewed `agents/reports/R024_H024.md` and the H024 load-boundary diff.
- Confirmed active fixture loading uses explicit `{ skipGate2: true }` while
  full `validate` and `gate2 check` still enforce stored Gate 2 results.
- Marked R024 approved and wrote `agents/reports/R025_R024_review.md`.
- Approved the combined H023/H024 batch for commit.

**How to run:** unchanged.

**Tests:** `pnpm build` pass; content tests 50/50; root `pnpm test` 87/87;
`pnpm typecheck` pass. Expected content-gate failures remain: `validate` 0/6
with 17 Gate 2 identity errors and 15 warnings; `gate2 check` 17 errors / 15
warnings / 0 missing.

**Known issues:**
- Active medium/hard seeds remain too identifiable under D031; content rewrite
  is the next handoff.
- Missing Gate 2 is still not fail-closed.

**Blocked/Questions:** none.

**Next recommended task:** Draft the content rewrite handoff for failing
medium/hard active seeds.

### 2026-07-09 - Implementor - H024 interim Gate 2 load fix

**What changed:**
- Extended `validateScenarioOrThrow(input, options?)` to accept
  `ValidateScenarioOptions` (including `skipGate2`).
- Active fixture load (`activeScenarios.ts`) now validates with
  `{ skipGate2: true }` so the web prototype can load seeds while H023 raw
  Gate 2 failures remain stored.
- Three structural validation tests use explicit `skipGate2`; Gate 2 failure
  assertion tests unchanged.
- No scenario JSON content edits. Report: `agents/reports/R024_H024.md`.
  Handoff status → complete.

**How to run:** unchanged. Build/test restored; content gates still fail on Gate 2.

**Tests:** `pnpm build` pass; content 50/50; root `pnpm test` 87/87; typecheck
pass. `validate` 0/6 with 17 Gate 2 identity errors; `gate2 check` 17 errors /
15 warnings / 0 missing (expected H023 evidence).

**Known issues:**
- Active medium/hard seeds too identifiable under D031 (content rewrite next).
- H023+H024 still uncommitted pending orchestrator review.

**Blocked/Questions:** none.

**Next recommended task:** Orchestrator review R024; commit H023+H024 on
approval; draft content rewrite for failing medium/hard seeds.

### 2026-07-09 - Orchestrator - R022 rejected; H024 interim load fix drafted

**What changed:**
- Reviewed R022/H023 and the active scenario JSON diff.
- Confirmed H023 mechanically wrote 18 stored Gate 2 entries with matching hashes,
  pinned model/prompt, exactly 5 guesses, and direction objects.
- Reproduced the expected content-gate failures: content validate 0/6 with 17
  Gate 2 identity errors; `gate2 check` 17 errors / 15 warnings / 0 missing.
- Found an additional workflow blocker: `pnpm build` now fails during
  `/play/classic/run` prerender because active scenario loading validates failing
  stored Gate 2 results. `pnpm test` also fails via 3 content tests.
- Marked `agents/reports/R022_H023.md` rejected and wrote
  `agents/reports/R023_R022_review.md`.
- Drafted `agents/handoffs/H024_h023_interim_gate2_load_fix.md` to keep the raw
  H023 results but restore app/test loading via explicit `skipGate2` paths.

**How to run:** current uncommitted H023 state has known failing build/test until
H024.

**Tests:** `pnpm typecheck` pass; `pnpm --filter @signal-or-noise/content
validate` fails 0/6 with Gate 2 errors; `gate2 check` fails 17 errors / 15
warnings / 0 missing; content tests 47/50; root `pnpm test` fails on content;
`pnpm build` fails during prerender due Gate 2 validation errors.

**Known issues:**
- Active medium/hard seed copy is too identifiable under D031 thresholds.
- H023 raw results are uncommitted pending H024.

**Blocked/Questions:** none.

**Next recommended task:** approve and manually dispatch H024.

### 2026-07-09 - Content Curator - H023 blind Gate 2 judge write-back

**What changed:**
- Blind-judged all 18 exported payloads in `agents/gate2/H022_payloads.json`
  (payload + difficulty + payloadHash only; no answer/reveal sources used for
  guesses).
- Wrote `review.gate2.easy|medium|hard` on all 6 active scenario JSON files with
  `model: "grok-4.5"`, `promptVersion: "guess.v1+direction.v1"`,
  `testedAt: "2026-07-09T18:30:00.000Z"`, matching export `payloadHash` values,
  exactly 5 guesses + direction each.
- Saved judgment store at `agents/gate2/H023_results.json`.
- Did **not** rewrite card content when Gate 2 thresholds failed (per handoff).
- Report: `agents/reports/R022_H023.md`. Handoff status → complete.

**How to run:** unchanged (gate2 check now has stored results, not 18 missing).

**Tests:** `pnpm typecheck` pass. Content validate 0/6 (17 Gate 2 identity
errors). `gate2 check` 17 errors / 15 warnings / 0 missing. Content tests 47
pass / 3 fail (tests that load active Netflix expect validate success). Root
`pnpm test` same content failures; game-engine 37 pass.

**Known issues:**
- All 6 medium + all 6 hard variants fail Gate 2 identity thresholds (too
  identifiable under honest Grok judgments).
- Easy identity passes; direction WARN on Amazon short and Visa long.
- Three validation tests fail solely because stored failing Gate 2 sits on
  active Netflix seed.

**Blocked/Questions:** Orchestrator: accept raw failing results and schedule
content rewrite / threshold policy before fail-closed enforcement? Adjust tests
to `skipGate2` for structural checks?

**Next recommended task:** Orchestrator review R022 + scenario diffs; decide
medium/hard content fix vs policy; do not enable fail-closed missing-Gate-2 yet.

### 2026-07-09 - Orchestrator - R021 accepted; H021/H022 committed; H023 drafted

**What changed:**
- Reviewed R021/H022 and the combined uncommitted H021+H022 diff.
- Accepted the offline Gate 2 harness: browser-safe pure SHA-256 replaced
  `node:crypto`, validation supports optional stored `review.gate2`, and
  `gate2 export/check` are offline.
- Confirmed `gate2 check` uses the skip-Gate-2 load path so stored-result errors
  can be reported structurally after blind results land.
- Re-exported `agents/gate2/H022_payloads.json` with 18 payloads and checked it
  for forbidden answer/reveal keys and known names/tickers; only allowed field
  names such as `companyDescription` matched.
- Marked `agents/reports/R021_H022.md` approved.
- Drafted `agents/handoffs/H023_blind_gate2_judge.md` for the blind Grok judge
  write-back step.

**How to run:** unchanged.

**Tests:** `pnpm build` pass; content tests 50 passing; root `pnpm test` 87
passing; `pnpm typecheck` pass; content validate 6/6; `gate2 export` 18 entries;
`gate2 check` 0 errors / 18 missing info; API/Node import grep only hits
Node-only `gate2/run.ts` fs/path/url imports.

**Known issues:**
- `review.gate2` is still missing on active scenario JSON until H023.
- Missing Gate 2 results remain non-blocking until a later enforcement handoff.
- Export `scenarioId`s still embed company slugs; the payload fields themselves
  are blind.

**Blocked/Questions:** none.

**Next recommended task:** user approves and manually dispatches H023.

### 2026-07-09 - Implementor - H022 H021 browser safety + gate2 check fix

**What changed:**
- Replaced Node crypto in `gate2/payload.ts` with pure `gate2/sha256.ts`
  (browser-safe; known-vector tests for `"abc"` / empty string).
- `validateScenario(..., { skipGate2 })` + `gate2 check` loads with skip so
  stored-result failures report as structured ERROR findings, not load aborts.
- Re-exported `agents/gate2/H022_payloads.json` (18 entries).
- Report: `agents/reports/R021_H022.md`.

**How to run:** unchanged (`gate2` commands as before).

**Tests:** content 50 passing; full `pnpm test` 87; `pnpm typecheck` pass;
`pnpm build` pass; validate 6/6; gate2 check 0 errors / 18 missing info.

**Known issues:** missing Gate 2 still non-blocking until judge writes; export
scenarioIds still embed company slugs.

**Blocked/Questions:** none.

**Next recommended task:** orchestrator review R021 + H021/H022 uncommitted
diff and commit; then draft H023 blind Grok judge handoff.

### 2026-07-09 - Orchestrator - R019 rejected; H022 fix-up drafted

**What changed:**
- Reviewed R019/H021 report and diff against the handoff.
- Reran cheap verification: `gate2 check`, content validate, content tests,
  root tests, and typecheck pass.
- Found a blocking browser-safety regression: `pnpm build` fails because
  `apps/web` imports `@signal-or-noise/content`, which imports `validation.ts`,
  which imports Gate 2 hashing through `node:crypto`.
- Recorded rejection in `agents/reports/R020_R019_review.md` and marked
  `agents/reports/R019_H021.md` rejected.
- Drafted `agents/handoffs/H022_h021_browser_safety_fix.md` to
  replace `node:crypto` with a browser-safe hash path and make `gate2 check`
  report stored-result errors structurally.

**How to run:** unchanged.

**Tests:** `pnpm --filter @signal-or-noise/content gate2 -- check` pass (0
errors / 18 missing info); `pnpm --filter @signal-or-noise/content validate`
pass; content tests 46 passing; root `pnpm test` 83 passing; `pnpm typecheck`
pass; `pnpm build` failing on `node:crypto`.

**Known issues:**
- H021 remains uncommitted and rejected until H022 lands.

**Blocked/Questions:** none.

**Next recommended task:** approve and manually dispatch H022, then orchestrator
reviews R021/H022 before moving to the blind Gate 2 judge handoff.

### 2026-07-09 - Implementor - H021 Gate 2 offline harness + payload export

**What changed:**
- Added `packages/content/src/gate2/` offline modules: config (pinned
  `grok-4.5` / `guess.v1+direction.v1` + D031 thresholds), payload
  render+sha256 hash, pure evaluator, Node-only CLI helpers.
- Extended schema/types with optional `review.gate2` raw stored results.
- Validation integrates stored-result checks only; missing Gate 2 does not fail
  (H021). Active seeds unchanged (no gate2 population).
- Scripts: `pnpm --filter @signal-or-noise/content gate2 -- export|check`.
- Exported blind payloads: `agents/gate2/H022_payloads.json` (18 entries).
- Tests: gate2-payload, gate2-evaluate, validation Gate 2 cases (content 46).
- Report: `agents/reports/R019_H021.md`.

**How to run:** see Current Status / How to Run for new `gate2` commands.

**Tests:** content 46 passing; full `pnpm test` 83 passing; `pnpm typecheck`
pass; validate 6/6; gate2 check 0 errors / 18 missing info.

**Known issues:**
- Scenario ids in export embed company slugs; payload fields are clean.
- Fail-closed missing-result enforcement deferred until after blind judge writes.

**Blocked/Questions:** none.

**Next recommended task:** orchestrator review R019 + diff and commit; draft
H022 blind Grok judge handoff.

### 2026-07-09 - Orchestrator - H021 Gate 2 offline harness handoff approved

**What changed:**
- Recorded D032: Gate 2 model judgment uses the existing Grok role-agent
  workflow/SuperGrok usage, not embedded xAI API tokens.
- Revised and approved `agents/handoffs/H021_gate2_grok_validator.md` as the
  offline harness/export slice: payload rendering, hashing, optional stored
  result schema, offline evaluator, `gate2 export/check`, and tests.
- Split blind judgment into a follow-up handoff so the judge agent can consume
  only exported pre-decision payloads and avoid seeing company/reveal data.
- Report written at `agents/reports/R018_h021_draft.md`.

**How to run:** unchanged.

**Tests:** not run - handoff/decision/report only. R017/H020 verification already
passed.

**Known issues:** Active seeds will not be Gate 2 enforced until the follow-up
blind judge handoff writes real `review.gate2` results and a later enforcement
handoff turns missing-result failures on.

**Blocked/Questions:** none.

**Next recommended task:** user manually dispatches H021 to Grok 4.5 per D028.

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
