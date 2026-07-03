# H003 — Playtest Fixes: All-In Bust, Call the Company, Reset Bug, Data Rebalance

**Role:** Implementor
**Phase:** 1 (fix-up)
**Status:** approved
**Depends on:** H001, H002 (both executed; work is uncommitted in the working tree)
**Estimated scope:** medium — one engine rule change, one new engine mechanic,
one UI bug fix, one data rebalance, explainer copy.

## Context

User playtesting surfaced five findings, resolved as decisions **D013–D016**
(read them in `decisions.md`, plus the amended `soul.md` Locked Game Rules).
The tree contains H001+H002 uncommitted work — build on it, never revert it,
and do not commit (D012).

## Objective

Wrong All-In calls bust the player instantly; players can optionally "Call the
Company" for Signal Score bonuses; decision buttons reset between rounds; sample
returns feel like markets instead of lotteries; and the setup screen explains
scoring. All engine changes covered by tests (24 total after this handoff).

---

## Part A — Game Engine (`packages/game-engine`)

### A1. Types (`src/types.ts`)

- `ScoreRoundInput`: add `companyGuessCorrect?: boolean | null;`
  (`true` = correct guess, `false` = wrong guess, `null`/absent = no guess).
- `CompletedRound`: add `companyGuess: string | null;` and
  `companyGuessCorrect: boolean | null;`
- `RunSummary`: add `companiesCalled: number;` (count of rounds with
  `companyGuessCorrect === true`).

### A2. Constants (`src/confidence.ts`)

```ts
export const GUESS_CORRECT_BONUS = 2;
export const GUESS_WRONG_PENALTY = -1;
export const BANKRUPTCY_FLOOR = 1; // bankroll below this = bankrupt (D016)
```

### A3. `scoreRound` (`src/scoring.ts`) — two rule changes

**Rule 1 — All-In bust (D014):** for long/short with `confidence === 'all_in'`
and `wasCorrect === false`: `pnlAmount = -stakeAmount` and `newBankroll = 0`,
regardless of the return's magnitude. Correct All-In is unchanged.

**Rule 2 — guess bonus (D015):** after computing the base result (including the
pass branch), adjust the signal delta:

```ts
const guessDelta =
  input.companyGuessCorrect === true ? GUESS_CORRECT_BONUS
  : input.companyGuessCorrect === false ? GUESS_WRONG_PENALTY
  : 0;
// final signalScoreDelta = base delta + guessDelta (applies to pass too)
```

The guess never affects stake, pnl, or bankroll.

### A4. `run.ts`

- `applyRoundResult` input: add `companyGuess?: string | null` and
  `companyGuessCorrect?: boolean | null`; pass the latter into `scoreRound`;
  record both on the `CompletedRound` (default `null`).
- Bankruptcy check (D016): status is `'bankrupt'` when
  `newBankroll < BANKRUPTCY_FLOOR` (was `<= 0`).
- `summarizeRun`: compute `companiesCalled`.

### A5. Tests — exact expected values

`tests/scoring.test.ts` — CHANGE case 7 and ADD cases 12–15 (bankroll 10000):

| # | Case | Input | Expected |
|---|------|-------|----------|
| 7 (changed) | All-In loss now busts | long, all_in, −0.40 | stake 10000, pnl **−10000**, bankroll **0**, delta −5, correct false |
| 12 | Correct guess bonus | long, medium, +0.25, guessCorrect true | stake 4000, pnl +1000, bankroll 11000, delta **+4**, correct true |
| 13 | Wrong guess penalty | long, medium, +0.25, guessCorrect false | same money values, delta **+1** |
| 14 | Pass + correct guess | pass, +0.25, guessCorrect true | stake 0, pnl 0, bankroll 10000, delta **+1.75** |
| 15 | All-In win + wrong guess | long, all_in, +0.35, guessCorrect false | stake 10000, pnl +3500, bankroll 13500, delta **+4** |

Case 8 (bankruptcy via capped short) is unchanged and must still pass.

`tests/run.test.ts` — ADD:

- **Floor test:** `createRunState({difficulty:'medium', startingBankroll: 2, totalRounds: 5})`,
  apply `{action:'long', confidence:'high', actualReturnPercent: -0.9}` →
  stake 1.4, pnl −1.26, newBankroll ≈ 0.74 (`toBeCloseTo(0.74, 6)`),
  status `'bankrupt'`.
- **companiesCalled:** a run with one correct-guess round, one wrong-guess round,
  one no-guess round → `summarizeRun(...).companiesCalled === 1`.

After this handoff: **24 tests total** (15 scoring + 9 run), all passing.

## Part B — Sample Data Rebalance (D013)

In `apps/web/lib/sampleScenarios.ts`:

1. Add `acceptedNames: string[]` to `PrototypeScenario` and every scenario
   (lowercase entries):
   Netflix `["netflix","nflx"]` · Apple `["apple","apple inc","aapl"]` ·
   BlackBerry `["blackberry","rim","research in motion","bbry"]` ·
   Amazon `["amazon","amazon.com","amzn"]` · Microsoft `["microsoft","msft"]` ·
   GameStop `["gamestop","gme"]`.
2. Retune four scenarios (Netflix and Amazon are unchanged — they are the two
   intentional dramatic cards). Update `id`, `outcomeLabel`,
   `holdingPeriodLabel`, `actualReturnPercent`, `outcomePrices`; decision dates
   and lookbackPrices stay:

| Scenario | New id | Window / label | Return | New outcomePrices |
|---|---|---|---|---|
| Apple | `proto_apple_2007_2008` | Jan 2007 → Jul 2008, "18 months" | `0.45` | `[3.4, 3.8, 4.4, 5.6, 6.1, 5.2, 4.6, 4.9]` |
| BlackBerry | `proto_blackberry_2008_2010` | Jun 2008 → Jun 2010, "2 years" | `-0.52` | `[68, 60, 48, 41, 55, 47, 38, 33]` |
| Microsoft | `proto_microsoft_2014_2016` | Jan 2014 → Jan 2016, "2 years" | `0.38` | `[37, 40, 44, 47, 43, 46, 49, 51]` |
| GameStop | `proto_gamestop_2016_2018` | Jan 2016 → Jan 2018, "2 years" | `-0.33` | `[28, 26, 24, 25, 22, 21, 19, 19]` |

Adjust reveal text/fun facts only if they now contradict the window (keep edits
minimal and period-accurate in tone; still placeholder-grade).

## Part C — Web App

### C1. Reset bug fix

In `handleNext` (run page): when returning to the round view, reset
`setAction(null)`, `setConfidence(null)`, and clear the company-guess input.

### C2. Call the Company UI (round view)

Below the clues, above "Make the Call":

- Label: `Call the Company (optional)`
- Text input, placeholder `Name the hidden company`
- Microcopy line (muted, xs): `Right: +2 Signal · Wrong: −1 Signal · Blank: no change`

Matching helper in `apps/web/lib/format.ts` or a new `lib/guess.ts`:

```ts
export function normalizeGuess(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}
// correct if acceptedNames.map(normalizeGuess).includes(normalizeGuess(input))
```

At Lock In: `companyGuess` = trimmed input or null if blank;
`companyGuessCorrect` = null if blank, else the match result. Pass both to
`applyRoundResult`. The guess input stays enabled for Pass (D015).

### C3. Locked view

If a guess was made, add line: `Company call: <guess>`.

### C4. Reveal view

Add a guess-result line in the results block:
- Correct: `You called it — it was <Company>. +2 Signal` in `son-green`.
- Wrong: `Your company call: "<guess>" — not quite. −1 Signal` in `son-red`.
- No guess: no line.

### C5. Scoring explainer (setup page `/play/classic`)

Add a bordered card below the difficulty selector, title `How scoring works`,
body (exact copy):

> **Bankroll** is your money score. Each round you stake a slice of it and earn
> the stock's real historical return — win big when the market moved big.
> A wrong All-In ends your run.
>
> **Signal Score** measures how well you read the market: bolder correct calls
> score higher (+1 to +5), wrong calls cost the same, and passing costs 0.25.
> Name the hidden company for +2 — but a wrong name costs 1.

### C6. Summary view

Add row `Companies Called` showing `summary.companiesCalled`.

## Do NOT

- Change CONFIDENCE_CONFIG values, pass penalty, or starting bankrolls.
- Add a multiple-choice guess UI, autocomplete, or hint system — free text only.
- Touch the composite-score/Information-Tier idea (open question, not decided).
- Modify Netflix or Amazon scenario returns.
- Commit or push (D012). Nothing on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `pnpm test` — 24/24 passing, including changed case 7 and the floor test. — *run it*
2. `pnpm typecheck` + `pnpm lint` clean. — *run them*
3. In-app: wrong All-In on any scenario → bankroll $0 → bankruptcy summary. — *play it*
4. Guess "netflix" on The Streaming Pivot + any correct call at Medium → reveal
   shows `+2 Signal` guess line and Signal Score delta totals base+2. — *play it*
5. Wrong guess shows −1 line; blank guess shows no guess line. — *play it*
6. Pass + correct guess → Signal Score changes by +1.75 for the round. — *verify number*
7. After Next Round, no action/confidence/guess is pre-selected. — *play two rounds*
8. Setup page shows the How-scoring-works card with the exact copy. — *open it*
9. Summary shows Companies Called count. — *finish a run*
10. Four retuned scenarios show new windows/returns in reveal; Netflix still
    +1,135.6%. — *observe*

## Reporting

Set Status `complete`, update `progress.md`, write `agents/reports/R003_H003.md`.
Do NOT commit — orchestrator reviews and commits (D012).
