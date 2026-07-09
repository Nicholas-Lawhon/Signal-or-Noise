# H014 — Variable Classic Run Lengths

**Role:** Implementor
**Phase:** 3 pre-work / gameplay tuning
**Status:** complete
**Model:** grok-4.5
**Risk:** medium
**Audit:** optional — orchestrator review + tests/typecheck should be enough under D024 unless the diff expands
**Depends on:** D025
**Estimated scope:** small — game-engine default config, focused tests, and UI copy

## Context

Playtests showed the old 20-round Classic Run default is too long for normal
play. D025 now defines Classic Run length by difficulty:

```text
Easy:   10 rounds
Medium: 15 rounds
Hard:   20 rounds
```

Daily Challenge remains 10 rounds. Starting bankrolls and all scoring math are
unchanged. The docs are already updated; this handoff makes runtime behavior and
visible app copy match D025.

## Objective

Update the game engine and web app so Classic Run defaults to 10/15/20 rounds by
selected difficulty, while preserving explicit `totalRounds` overrides in tests
and future callers.

## Prescriptive Instructions

1. In `packages/game-engine/src/confidence.ts`, replace the flat
   `CLASSIC_RUN_ROUNDS = 20` export with a difficulty-keyed config:

   ```ts
   export const CLASSIC_RUN_ROUNDS: Record<Difficulty, number> = {
     easy: 10,
     medium: 15,
     hard: 20,
   };
   ```

   `Difficulty` is already imported at the top of this file.

2. In `packages/game-engine/src/run.ts`, keep the existing import name and update
   the default total-rounds line to:

   ```ts
   totalRounds: params.totalRounds ?? CLASSIC_RUN_ROUNDS[params.difficulty],
   ```

   Do not change the `totalRounds` override behavior or validation.

3. In `packages/game-engine/tests/run.test.ts`, update `createRunState` tests:
   - Medium default should expect `totalRounds` to be `15`.
   - Easy default should assert bankroll `12500` and `totalRounds` `10`.
   - Hard default should assert bankroll `7500` and `totalRounds` `20`.
   Keep the existing explicit `totalRounds` tests unchanged.

4. Update visible web copy:
   - `apps/web/app/page.tsx`: remove the hardcoded “20 rounds.” phrase and use
     concise non-specific copy such as “Real historical companies.”
   - `apps/web/app/play/page.tsx`: replace `20 rounds · Choose difficulty · Build
     your bankroll` with `10–20 rounds · Choose difficulty · Build your bankroll`.
   - `apps/web/app/play/classic/page.tsx`:
     - Import `CLASSIC_RUN_ROUNDS` alongside `STARTING_BANKROLL`.
     - Replace `20 rounds. Choose your difficulty.` with
       `Choose your difficulty and run length.`
     - Replace each difficulty card’s `20 rounds` text with
       `{CLASSIC_RUN_ROUNDS[d.key]} rounds`.

5. Do not change the run page round display logic. It already uses
   `run.totalRounds`, and `buildRunScenarioList(initialRun.totalRounds)` already
   receives the configured length.

6. Search for current, non-historical user-facing hardcoded 20-round copy in app
   source:

   ```powershell
   rg -n "20 rounds|20-round|Round .*20" apps packages
   ```

   It should not find stale current-app copy after your changes, except test names
   or comments if still accurate. If it finds a runtime string, fix it.

## Do NOT

- Change scoring math, confidence percentages, Signal Score, bankruptcy, or
  starting bankrolls.
- Change Daily Challenge rules.
- Change scenario content, schema, validator, or sample scenario data.
- Refactor unrelated UI or engine code.
- Edit historical handoffs/audits/reports that mention old 20-round behavior.
- Anything on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `createRunState({ difficulty: 'easy' }).totalRounds === 10`.
2. `createRunState({ difficulty: 'medium' }).totalRounds === 15`.
3. `createRunState({ difficulty: 'hard' }).totalRounds === 20`.
4. Passing an explicit `totalRounds` still overrides the difficulty default.
5. The Classic setup page displays the correct round count per difficulty.
6. Current app copy no longer says all Classic Runs are 20 rounds.
7. `pnpm typecheck` passes.
8. `pnpm test` passes.

## Verification Steps for the Implementor

Run from repo root:

```powershell
pnpm typecheck
pnpm test
rg -n "20 rounds|20-round|Round .*20" apps packages
```

For the `rg` check, explain any remaining hits in your report.

## Reporting

On completion: set Status to `complete`, append a session entry to `progress.md`
(template at top of that file), and write a completion report to
`agents/reports/R###_H014.md` per `agents/reports/TEMPLATE.md`.
**Do NOT commit or push anything** — the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).
If blocked: set Status note, log the question in `progress.md` Blocked/Questions,
stop.
