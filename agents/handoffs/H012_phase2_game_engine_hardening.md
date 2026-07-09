# H012 — Phase 2 Game Engine Hardening

**Role:** Implementor
**Phase:** Phase 2 — Game Engine Hardening
**Status:** complete
**Model:** Grok 4.5 (clear TypeScript implementation + tests; bounded local judgment)
**Risk:** medium (pure game-engine API hardening; no scoring-rule changes)
**Audit:** optional (D024: orchestrator review + tests by default; formal audit only if review finds risk)
**Depends on:** H001–H011
**Estimated scope:** medium — add missing game-engine API surface and tests inside `packages/game-engine`

## Context

Phase 0 + 1 are complete. The game engine already lives in
`packages/game-engine` (D005), so Phase 2 is a hardening/completion pass, not a
migration. Existing scoring behavior includes D014 wrong All-In bust, D015 Call
the Company Signal Score bonus/penalty, D016 bankruptcy floor below $1, and D017
proportional payout. Do not change any locked scoring math.

D024 is active: optimize for efficient development. Use tests + typecheck as the
primary proof. Do not create an audit handoff.

## Objective

Complete the Phase 2 game-engine package API listed in `roadmap.md` / doc 10:
`calculateStake`, `scoreRound`, `applyRoundResult`, `createRunState`,
`advanceRun`, `isBankrupt`, `summarizeRun`, and
`calculateLeaderboardTiebreakers`, with focused unit tests for the durable rules.

## Prescriptive Instructions

1. Work only in `packages/game-engine` plus `progress.md` and your report.
   Expected code files are:
   - `packages/game-engine/src/types.ts`
   - `packages/game-engine/src/run.ts`
   - `packages/game-engine/src/index.ts`
   - optionally `packages/game-engine/src/leaderboard.ts`
   - `packages/game-engine/tests/*.test.ts`

2. Keep all existing public behavior passing. Do not change the expected outputs
   of the current 24 tests unless a test is only being expanded to assert new
   fields.

3. Add streak tracking to the engine state because `soul.md` says Pass preserves
   streak and does not increase it:
   - Add `currentStreak: number` and `bestStreak: number` to `RunState`.
   - Add `currentStreak: number` and `bestStreak: number` to `RunSummary`.
   - `createRunState` initializes both to `0`.
   - In `applyRoundResult`:
     - `wasCorrect === true`: `currentStreak += 1`; `bestStreak = max(bestStreak, currentStreak)`.
     - `wasCorrect === false`: `currentStreak = 0`; `bestStreak` unchanged.
     - `wasCorrect === null` (Pass): `currentStreak` and `bestStreak` unchanged.
   - Company guess correctness never affects streak.

4. Add an exported `advanceRun` helper. It should not duplicate scoring logic;
   call `applyRoundResult` internally.

   Required shape:

   ```ts
   export type AdvanceRunOutput = {
     run: RunState;
     round: CompletedRound;
     summary: RunSummary | null;
     didEndRun: boolean;
   };

   export function advanceRun(
     run: RunState,
     input: ApplyRoundResultInput,
   ): AdvanceRunOutput;
   ```

   You may introduce and export `ApplyRoundResultInput` for the existing
   `applyRoundResult` input object. `advanceRun` returns the next run state, the
   newly completed round, `summary` when the next run status is not
   `in_progress`, and `summary: null` otherwise.

5. Add exported leaderboard tiebreaker calculation. Do not use `Date.now()` or
   any I/O inside the engine.

   Required shape:

   ```ts
   export type LeaderboardTiebreakerInput = {
     finalBankroll: number;
     signalScore: number;
     correctCalls: number;
     passes: number;
     completionTimeMs: number;
   };

   export type LeaderboardTiebreakers = {
     finalBankroll: number;
     signalScore: number;
     correctCalls: number;
     fewerPasses: number;
     fasterCompletion: number;
     sortKey: readonly [number, number, number, number, number];
   };

   export function calculateLeaderboardTiebreakers(
     input: LeaderboardTiebreakerInput,
   ): LeaderboardTiebreakers;
   ```

   `sortKey` must be suitable for descending numeric comparison in this exact
   order from `roadmap.md`: bankroll → Signal Score → correct calls → fewer
   passes → completion time. Therefore:
   - `sortKey[0] = finalBankroll`
   - `sortKey[1] = signalScore`
   - `sortKey[2] = correctCalls`
   - `sortKey[3] = -passes`
   - `sortKey[4] = -completionTimeMs`
   - `fewerPasses = -passes`
   - `fasterCompletion = -completionTimeMs`

6. Add input guards only where they prevent invalid engine states without
   changing game rules:
   - `createRunState` throws if `startingBankroll` is provided and is negative.
   - `createRunState` throws if `totalRounds` is provided and is less than `1`.
   - `calculateLeaderboardTiebreakers` throws if any input number is not finite,
     if `passes < 0`, `correctCalls < 0`, or `completionTimeMs < 0`.
   Do not add broad validation beyond this handoff.

7. Expand tests in `packages/game-engine/tests/`:
   - Preserve all existing tests.
   - Add a test that exactly `actualReturnPercent: 0` is incorrect for both Long
     and Short (`wasCorrect === false` and negative Signal Score).
   - Add streak tests: correct calls increase streak, wrong call resets it, Pass
     preserves but does not increase it, company guess does not affect streak.
   - Add `advanceRun` tests: returns the new round, returns `summary: null` for
     ongoing runs, and returns a populated summary when a run completes or goes
     bankrupt.
   - Add leaderboard tests verifying every `sortKey` position, fewer passes, and
     faster completion values.
   - Add guard tests for invalid `createRunState` and invalid leaderboard input.

8. Export all new types/functions from `packages/game-engine/src/index.ts`.

## Do NOT

- Do NOT touch `apps/web`, scenario content, docs, or UI code.
- Do NOT alter locked scoring math in `soul.md`.
- Do NOT add dependencies.
- Do NOT add database/auth/server concepts.
- Do NOT implement actual leaderboard storage or sorting UI.
- Do NOT run `git commit` or `git push`.
- Do NOT build anything on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `packages/game-engine` exports all Phase 2 functions:
   `calculateStake`, `scoreRound`, `applyRoundResult`, `createRunState`,
   `advanceRun`, `isBankrupt`, `summarizeRun`, and
   `calculateLeaderboardTiebreakers`.
2. Existing scoring behavior is unchanged: current 24 tests still pass, with
   additional tests passing too.
3. Streak state follows `soul.md`: correct increases, wrong resets, Pass
   preserves and does not increase.
4. `advanceRun` returns the new run, latest round, and a summary only when the
   run ended.
5. Leaderboard tiebreaker `sortKey` implements bankroll → Signal Score →
   correct calls → fewer passes → faster completion.
6. Guard tests cover invalid run creation and invalid tiebreaker inputs.
7. `pnpm typecheck` and `pnpm test` pass from repo root. If `pnpm` is not on
   PATH, prepend `%LOCALAPPDATA%\nodejs\node-v24.18.0-win-x64` to PATH.
8. `progress.md` and `agents/reports/R009_H012.md` are updated. Work is left
   uncommitted.

## Verification Steps for the Implementor

Run from repo root:

```powershell
$env:PATH = "$env:LOCALAPPDATA\nodejs\node-v24.18.0-win-x64;$env:PATH"
pnpm typecheck
pnpm test
```

No browser/dev-server check is required because this handoff is pure engine code.

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R009_H012.md` per
`agents/reports/TEMPLATE.md`.

Do NOT commit or push anything. The orchestrator reviews the report and diff,
reruns cheap verification, then commits if accepted under D024.
