# H001 — Monorepo Setup + Playable Classic Run Prototype

**Role:** Implementor
**Phase:** 0 + 1
**Status:** approved
**Depends on:** none
**Estimated scope:** large — full scaffold plus a complete playable local game loop.
Expect this to be your entire session (or two).

## Context

The repo currently contains only `docs/` and agent control files. Nothing has been
built. This handoff produces the entire Phase 0 scaffold and the Phase 1 playable
prototype: a local, client-only 20-round Classic Run with hardcoded scenario data.
There is NO database, NO auth, NO server-side logic in this handoff. Product rules
come from `soul.md`; read it first. Reference material: `docs/07_technical_architecture.md`
(structure), `docs/08_ui_ux_direction.md` (screens), `docs/10_agentic_coding_handoff.md`
(phase definitions).

## Objective

`pnpm install && pnpm dev` starts a Next.js app where a user can pick a difficulty,
play a full 20-round Classic Run (Long/Short/Pass + confidence), see correct bankroll
and Signal Score math on every reveal, go bankrupt on a bad All-In, and reach an
end-of-run summary — with all scoring math living in `packages/game-engine` and
covered by passing Vitest tests.

---

## Part A — Monorepo Scaffold (Phase 0)

### A1. Workspace root

Create these files at the repo root:

**`pnpm-workspace.yaml`:**
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**`package.json`** (root):
```json
{
  "name": "signal-or-noise",
  "private": true,
  "scripts": {
    "dev": "pnpm --filter web dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck",
    "lint": "pnpm --filter web lint"
  },
  "packageManager": "pnpm@9.15.0"
}
```

(If pnpm is missing on the machine, run `corepack enable` first; if corepack is
unavailable, `npm install -g pnpm`.)

**`.env.example`:**
```env
DATABASE_URL=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# Auth (Phase 5+, provider TBD)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
# Content generation (never used in production gameplay)
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
```

**`README.md`:** name + primary tagline, one-paragraph description (copy the
one-sentence description from `soul.md`), quickstart (`pnpm install`, `pnpm dev`,
`pnpm test`), monorepo layout summary, link to `docs/` and `AGENTS.md`, and the
disclaimer paragraph from `soul.md`.

**`.prettierrc`:**
```json
{ "singleQuote": true, "semi": true, "trailingComma": "all", "printWidth": 100 }
```

### A2. packages/game-engine

```text
packages/game-engine/
  package.json
  tsconfig.json
  vitest.config.ts
  src/
    types.ts
    confidence.ts
    scoring.ts
    run.ts
    index.ts
  tests/
    scoring.test.ts
    run.test.ts
```

**`package.json`:**
```json
{
  "name": "@signal-or-noise/game-engine",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

`tsconfig.json`: `strict: true`, `target: ES2022`, `module: ESNext`,
`moduleResolution: Bundler`, `noEmit: true`, include `src` and `tests`.
`vitest.config.ts`: default config including `tests/**/*.test.ts`.

This package must import NOTHING from Next.js, React, or any I/O library. Pure
TypeScript only. `index.ts` re-exports everything public from the other files.

### A3. packages/content (placeholder only)

Create `packages/content/README.md` stating: "Scenario content pipeline — schemas,
seed JSON, and validation scripts arrive in Phase 3. Prototype sample data lives in
`apps/web/lib/sampleScenarios.ts` until then (decision D006)." Nothing else.

### A4. apps/web

Create a Next.js App Router app in `apps/web` with TypeScript, Tailwind CSS, and
ESLint (via `pnpm create next-app` or manually — manual is fine if cleaner). Then:

- Name it `"web"` in its package.json; add `"typecheck": "tsc --noEmit"` script.
- Add dependency `"@signal-or-noise/game-engine": "workspace:*"`.
- Remove all default boilerplate content (default landing page, Vercel logos).

---

## Part B — Game Engine Implementation

### B1. `src/types.ts`

```ts
export type Difficulty = 'easy' | 'medium' | 'hard';
export type RoundAction = 'long' | 'short' | 'pass';
export type Confidence = 'low' | 'medium' | 'high' | 'all_in';
export type RunStatus = 'in_progress' | 'completed' | 'bankrupt';

export type ScoreRoundInput = {
  action: RoundAction;
  confidence?: Confidence;
  currentBankroll: number;
  actualReturnPercent: number; // decimal: +35% = 0.35
};

export type ScoreRoundOutput = {
  stakeAmount: number;
  pnlAmount: number;
  newBankroll: number;
  signalScoreDelta: number;
  wasCorrect: boolean | null; // null for pass
};

export type CompletedRound = {
  roundIndex: number; // 0-based
  scenarioId: string;
  action: RoundAction;
  confidence: Confidence | null;
  stakeAmount: number;
  pnlAmount: number;
  bankrollBefore: number;
  bankrollAfter: number;
  signalScoreDelta: number;
  wasCorrect: boolean | null;
};

export type RunState = {
  mode: 'classic_run';
  difficulty: Difficulty;
  startingBankroll: number;
  currentBankroll: number;
  signalScore: number;
  totalRounds: number;
  currentRoundIndex: number; // 0-based; index of the round being played
  status: RunStatus;
  rounds: CompletedRound[];
};

export type RunSummary = {
  finalBankroll: number;
  signalScore: number;
  correctCalls: number;
  wrongCalls: number;
  passes: number;
  bestTrade: CompletedRound | null;  // highest pnlAmount, only rounds with a stake
  worstTrade: CompletedRound | null; // lowest pnlAmount, only rounds with a stake
  wentBankrupt: boolean;
};
```

### B2. `src/confidence.ts`

Copy `CONFIDENCE_CONFIG` **exactly** as written in `soul.md` (Low 0.10/1,
Medium 0.40/2, High 0.70/3, All-In 1.00/5). Also export:

```ts
export function calculateStake(currentBankroll: number, confidence: Confidence): number {
  return currentBankroll * CONFIDENCE_CONFIG[confidence].bankrollPercent;
}
```

Also export starting bankrolls:

```ts
export const STARTING_BANKROLL: Record<Difficulty, number> = {
  easy: 12500,
  medium: 10000,
  hard: 7500,
};
export const CLASSIC_RUN_ROUNDS = 20;
```

### B3. `src/scoring.ts` — `scoreRound`

Implement **exactly** this logic (it is the locked spec from `docs/06_data_model.md`):

```ts
export function scoreRound(input: ScoreRoundInput): ScoreRoundOutput {
  if (input.action === 'pass') {
    return {
      stakeAmount: 0,
      pnlAmount: 0,
      newBankroll: input.currentBankroll,
      signalScoreDelta: -0.25,
      wasCorrect: null,
    };
  }
  if (!input.confidence) {
    throw new Error('Confidence is required for long/short actions.');
  }
  const config = CONFIDENCE_CONFIG[input.confidence];
  const stakeAmount = input.currentBankroll * config.bankrollPercent;
  const rawReturn =
    input.action === 'long' ? input.actualReturnPercent : input.actualReturnPercent * -1;
  const rawPnl = stakeAmount * rawReturn;
  const cappedPnl = Math.max(rawPnl, stakeAmount * -1); // losses capped at stake
  const newBankroll = Math.max(0, input.currentBankroll + cappedPnl);
  const wasCorrect = rawReturn > 0; // exactly 0 counts as incorrect (decision D007)
  const signalScoreDelta = wasCorrect ? config.signalScoreValue : config.signalScoreValue * -1;
  return { stakeAmount, pnlAmount: cappedPnl, newBankroll, signalScoreDelta, wasCorrect };
}
```

### B4. `src/run.ts`

```ts
export function createRunState(params: {
  difficulty: Difficulty;
  startingBankroll?: number; // defaults to STARTING_BANKROLL[difficulty]
  totalRounds?: number;      // defaults to CLASSIC_RUN_ROUNDS
}): RunState;

export function applyRoundResult(
  run: RunState,
  input: { scenarioId: string; action: RoundAction; confidence?: Confidence; actualReturnPercent: number },
): RunState;

export function isBankrupt(run: RunState): boolean; // currentBankroll <= 0

export function summarizeRun(run: RunState): RunSummary;
```

`applyRoundResult` behavior, precisely:
1. Throw if `run.status !== 'in_progress'`.
2. Call `scoreRound` with the run's `currentBankroll`.
3. Append a `CompletedRound` (bankrollBefore = old, bankrollAfter = new,
   confidence = input.confidence ?? null, roundIndex = run.currentRoundIndex).
4. Return a **new** RunState (do not mutate) with updated `currentBankroll`,
   `signalScore` (+= delta), `currentRoundIndex` (+1), and `status`:
   - `'bankrupt'` if newBankroll <= 0
   - `'completed'` if rounds.length === totalRounds and not bankrupt
   - else `'in_progress'`.

`summarizeRun`: counts from `rounds` (`wasCorrect === true` → correct,
`=== false` → wrong, action `'pass'` → passes). bestTrade/worstTrade consider only
rounds where `stakeAmount > 0`; null if none. `wentBankrupt` = status === 'bankrupt'.

### B5. Required tests — `tests/scoring.test.ts`

Write EXACTLY these cases with these expected values (use `toBeCloseTo(x, 6)` for
any value that could carry float error):

| # | Case | Input | Expected |
|---|------|-------|----------|
| 1 | Correct long | long, medium, bankroll 10000, return +0.25 | stake 4000, pnl +1000, bankroll 11000, delta +2, correct true |
| 2 | Wrong long | long, high, 10000, −0.20 | stake 7000, pnl −1400, bankroll 8600, delta −3, correct false |
| 3 | Correct short | short, medium, 10000, −0.30 | stake 4000, pnl +1200, bankroll 11200, delta +2, correct true |
| 4 | Wrong short | short, low, 10000, +0.50 | stake 1000, pnl −500, bankroll 9500, delta −1, correct false |
| 5 | Pass | pass, 10000, +0.25 | stake 0, pnl 0, bankroll 10000, delta −0.25, correct null |
| 6 | All-In win | long, all_in, 10000, +0.35 | stake 10000, pnl +3500, bankroll 13500, delta +5, correct true |
| 7 | All-In loss | long, all_in, 10000, −0.40 | stake 10000, pnl −4000, bankroll 6000, delta −5, correct false |
| 8 | Bankruptcy via capped short | short, all_in, 10000, +1.50 | stake 10000, pnl −10000 (capped), bankroll 0, delta −5, correct false |
| 9 | Short loss capped at stake | short, medium, 10000, +3.00 | stake 4000, pnl −4000 (capped, not −12000), bankroll 6000, delta −2, correct false |
| 10 | calculateStake all levels | bankroll 8000 | low 800, medium 3200, high 5600, all_in 8000 |
| 11 | Missing confidence throws | long, no confidence | throws Error |

### B6. Required tests — `tests/run.test.ts`

1. `createRunState({difficulty:'medium'})` → bankroll 10000, 20 rounds, round index 0,
   status in_progress, empty rounds. `'easy'` → 12500, `'hard'` → 7500.
2. Applying a bankrupting result (short all_in on +1.50) sets status `'bankrupt'`,
   bankroll 0; a further `applyRoundResult` throws.
3. Applying `totalRounds` non-bankrupting results (use totalRounds: 3 for the test,
   pass three long/low/+0.10 rounds) sets status `'completed'`.
4. `applyRoundResult` does not mutate its input (old state unchanged after call).
5. `summarizeRun` on a run with: correct long (+0.25, medium), wrong long (−0.20, low),
   and a pass → correctCalls 1, wrongCalls 1, passes 1, bestTrade is the correct long,
   worstTrade is the wrong long, signalScore 2 − 1 − 0.25 = 0.75.

## Part C — Sample Scenario Data

Create `apps/web/lib/sampleScenarios.ts`. These are **placeholder-grade** (decision
D006): approximate returns, same card text for all difficulties. File must start with:

```ts
// PROTOTYPE PLACEHOLDER DATA (decision D006).
// Approximate returns, unverified. Replaced by curated content in Phase 3.
```

Type (define here, not in game-engine):

```ts
import type { Scenario } from './types'; // or define inline

export type PrototypeScenario = {
  id: string;
  companyName: string;
  ticker: string;
  title: string;
  era: string;
  decisionDateLabel: string;
  outcomeLabel: string;      // e.g. "Jan 2012 → Jan 2017"
  holdingPeriodLabel: string;
  actualReturnPercent: number; // decimal
  companyDescription: string;
  macroContext: string;
  clues: [string, string, string];
  revealShortText: string;
  funFact: string;
  lookbackPrices: number[]; // pre-decision only — must NOT hint at outcome
  outcomePrices: number[];  // shown ONLY after reveal
};
```

Create exactly these 6 scenarios (write natural clue text following the Medium
difficulty style in `docs/09_content_and_round_creation.md`; never include company
name/ticker/founder names in description, macro, or clues):

| id | Company/Ticker | Title | Era | Window | Return | lookbackPrices | outcomePrices |
|----|----|----|----|----|----|----|----|
| `proto_netflix_2012_2017` | Netflix / NFLX | The Streaming Pivot | Post-financial-crisis tech expansion | Jan 2012 → Jan 2017 (5 years) | `11.36` | `[5.5, 6.8, 9.2, 14.5, 25.1, 42.7, 30.9, 10.3]` | `[10.3, 13.2, 25.4, 48.8, 62.5, 98.1, 110.4, 127.5]` |
| `proto_apple_2007_2012` | Apple / AAPL | The Pocket Computer Bet | Smartphone platform era | Jan 2007 → Jan 2012 (5 years) | `3.79` | `[1.2, 1.7, 2.4, 2.9, 3.1, 2.6, 3.0, 3.4]` | `[3.4, 4.8, 6.1, 3.2, 5.5, 9.3, 12.6, 16.3]` |
| `proto_blackberry_2008_2013` | BlackBerry / BBRY | The Keyboard King | Smartphone platform era | Jun 2008 → Jun 2013 (5 years) | `-0.90` | `[8, 11, 16, 24, 39, 61, 70, 68]` | `[68, 55, 40, 28, 18, 12, 9, 7]` |
| `proto_amazon_1999_2001` | Amazon / AMZN | Everything Store, Everything Crash | Dot-com bubble and aftermath | Dec 1999 → Sep 2001 (~2 years) | `-0.87` | `[2, 4, 7, 15, 28, 45, 62, 76]` | `[76, 64, 41, 30, 18, 12, 8, 10]` |
| `proto_microsoft_2014_2019` | Microsoft / MSFT | The Sleeping Giant | Cloud software expansion | Jan 2014 → Jan 2019 (5 years) | `1.76` | `[26, 25, 27, 28, 30, 32, 34, 37]` | `[37, 42, 47, 55, 64, 78, 95, 102]` |
| `proto_gamestop_2016_2020` | GameStop / GME | Game Over for Retail? | Rate-hike / retail disruption era | Jan 2016 → Jan 2020 (4 years) | `-0.82` | `[22, 30, 38, 42, 36, 30, 28, 28]` | `[28, 24, 21, 16, 14, 12, 7, 5]` |

For Netflix, use the Medium-variant text from `docs/06_data_model.md`
(companyDescription, macroContext, clues) and the reveal/funFact text from the same
example. For the other five, write your own text in the same style and length:
description one sentence, macro one sentence, three clue sentences, reveal one or
two punchy sentences naming the company, funFact one sentence of trivia.

Also export `function buildRunScenarioList(totalRounds: number): PrototypeScenario[]`
— shuffle the 6 scenarios (Fisher-Yates) and repeat the shuffled order cyclically
until the list has `totalRounds` entries.

## Part D — Web App Screens (Phase 1)

Global: dark theme. Background near-black (`zinc-950`), card panels `zinc-900`
with subtle border, white/zinc-100 text, one accent color — **teal** family — for
primary actions. Bold large type for money values. Mobile-first: design at 375px
width; center content in a `max-w-md` column on larger screens. Every button has a
visible text label. This is a prototype: functional and clean beats polished
(polish is Phase 9). Follow the copy rules in `soul.md` everywhere.

### D1. `/` — Landing

- App name `Signal or Noise?` large, primary tagline under it.
- 2–3 sentence explainer (use the "Read a disguised market scenario…" copy from
  `docs/08_ui_ux_direction.md` §Landing).
- Primary button `Play Now` → `/play`.
- Footer: the exact disclaimer paragraph from `soul.md`.

### D2. `/play` — Mode Select

Three mode cards:
- **Classic Run** — "20 rounds · Choose difficulty · Build your bankroll" → `/play/classic`.
- **Daily Challenge** — "10 rounds · Same challenge for everyone · Climb today's
  leaderboard" — visually disabled, label `Coming soon`.
- **Portfolio Draft** — disabled, `Coming soon`.

### D3. `/play/classic` — Run Setup

- Three difficulty options (radio-style cards): Easy / Medium / Hard, each showing
  `20 rounds · Starting bankroll: $12,500 / $10,000 / $7,500` (values imported from
  `STARTING_BANKROLL`, never hardcoded in the UI).
- `Start Run` button → `/play/classic/run?difficulty=<easy|medium|hard>`.

### D4. `/play/classic/run` — The Run (single client component page)

One client component (`'use client'`) that owns the whole run in React state:

```ts
const [run, setRun] = useState<RunState>(() => createRunState({ difficulty }));
const [scenarios] = useState(() => buildRunScenarioList(run.totalRounds));
const [view, setView] = useState<'round' | 'reveal' | 'summary'>('round');
const [lastRound, setLastRound] = useState<CompletedRound | null>(null);
```

Read `difficulty` from the search param, default `'medium'` if absent/invalid.

**Round view** (this is the most important screen — see wireframe in
`docs/08_ui_ux_direction.md`):
- Top bar, always visible: `Round {run.currentRoundIndex + 1}/{run.totalRounds}`,
  `Bankroll: $X,XXX` (format with `toLocaleString`, no cents), `Signal Score: +N`
  (signed, up to 2 decimals only when fractional).
- Scenario card panel: era badge, decision date + holding period line,
  companyDescription, macroContext, **lookback sparkline** (see D6), then the 3
  clues as a numbered list. NEVER render companyName, ticker, actualReturnPercent,
  or outcomePrices in this view. (Data may be in the client bundle — acceptable
  for the prototype per soul.md; just never render it pre-reveal.)
- Section "Make the Call": three toggle buttons `Long` / `Short` / `Pass`;
  selected state clearly visible (accent border + fill).
- Section "Confidence": four buttons, each showing three lines — label, percent,
  dollar stake computed via `calculateStake(run.currentBankroll, level)` and
  formatted as currency. Disabled (dimmed) while `Pass` is selected or no action
  chosen. Visual risk ramp: Low = muted/safe, All-In = dramatic (e.g. amber/red
  border) — but labels carry the meaning, never color alone.
- `Lock In` button: enabled when (action is `pass`) OR (action is long/short AND a
  confidence is selected). On click:

```ts
const scenario = scenarios[run.currentRoundIndex];
const next = applyRoundResult(run, {
  scenarioId: scenario.id,
  action,
  confidence: action === 'pass' ? undefined : confidence,
  actualReturnPercent: scenario.actualReturnPercent,
});
setLastRound(next.rounds[next.rounds.length - 1]);
setRun(next);
setView('reveal');
```

**Reveal view:**
- Headline: `That was {companyName}.` (large)
- Lines: ticker, `{outcomeLabel}`, `Actual return: +1,135.6%` (format
  `actualReturnPercent * 100` with one decimal and sign).
- Outcome sparkline (outcomePrices).
- Your call / Confidence / Stake / `Gain: +$X` or `Loss: −$X` / New bankroll /
  `Signal Score {+2|−2|−0.25}` — all from `lastRound`. For a pass, show
  "You passed" and skip stake/gain lines.
- revealShortText, then funFact (smaller, labeled "Fun fact").
- Button: if `run.status === 'in_progress'` → `Next Round` (`setView('round')`);
  else → `See Summary` (`setView('summary')`).

**Summary view:**
- If `run.status === 'bankrupt'`: headline `Bankrupt.` + one line ("Your bankroll
  hit $0 — the run is over."). Else headline `Run Complete.`
- Stats list from `summarizeRun(run)`: Final Bankroll, Signal Score, Correct Calls,
  Wrong Calls, Passes, Best Trade (`+$X on {company}` — company via scenarioId
  lookup), Worst Trade.
- Buttons: `Play Again` → `/play/classic`, `Home` → `/`.

### D5. Currency & number formatting

One helper module `apps/web/lib/format.ts`: `formatMoney(n)` → `$10,000` (round to
nearest dollar for display), `formatSignedMoney(n)` → `+$1,000` / `−$1,400`,
`formatPercent(decimal)` → `+25.0%` / `−90.0%`, `formatSignalScore(n)` → `+2` /
`−0.25`. All display formatting goes through this module.

### D6. Sparkline component

`apps/web/components/Sparkline.tsx`: pure inline SVG, props
`{ prices: number[]; height?: number }`. Normalize prices to the viewBox, draw a
single polyline with the accent color, no axes, no labels, no grid, no tooltips
(this is a game clue, not a finance chart). Width 100%, height ~96px.

## Do NOT

- No database, Prisma, auth, API routes, or server actions.
- No state libraries (Zustand/Redux/React Query) — plain React state only.
- No charting library — the SVG sparkline is specified above.
- No shadcn/ui or component library; plain Tailwind.
- No daily challenge, leaderboards, profile, rules page, or share features.
- No animations beyond simple CSS transitions (reveal animation is Phase 9).
- No difficulty-variant card text (D006 — same text all difficulties for now).
- No extra scenarios, no extra engine functions beyond Part B.
- Nothing on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `pnpm install` succeeds from repo root on Windows. — *run it*
2. `pnpm test` runs all game-engine tests; **all 16 cases above pass**. — *run it*
3. `pnpm typecheck` passes with zero errors. — *run it*
4. `pnpm dev` serves the app; `/` shows name, tagline, Play Now, disclaimer. — *open it*
5. Mode select shows Classic enabled, Daily Challenge + Portfolio Draft disabled
   "Coming soon". — *open `/play`*
6. Each difficulty shows its correct starting bankroll; starting a Hard run begins
   at $7,500. — *play it*
7. A full 20-round Medium run is completable start → summary. — *play it*
8. Round view never shows company name, ticker, return, or outcome chart before
   Lock In. — *inspect each round view*
9. Confidence buttons show label + % + live dollar amount that changes as bankroll
   changes between rounds. — *observe across two rounds*
10. Manual math check: on a fresh Medium run ($10,000), choose Long + Medium on any
    scenario; verify stake shown is $4,000 and reveal numbers equal
    `10000 + 4000 × return` (compute by hand from the scenario's return in
    sampleScenarios.ts). — *do the arithmetic*
11. Pass: bankroll unchanged, Signal Score drops exactly 0.25, round counter
    advances. — *play it*
12. All-In Short on a scenario with a large positive return (e.g. The Streaming
    Pivot) → bankroll $0, bankruptcy summary appears, run ends early. — *play it*
13. Summary shows final bankroll, Signal Score, correct/wrong/pass counts, best and
    worst trade. — *observe*
14. Viewport at 375px width: no horizontal scroll, all buttons tappable. — *devtools*
15. `progress.md` updated with a session entry per the template. — *read it*

## Verification Steps for the Implementor

1. `pnpm install` → `pnpm test` → `pnpm typecheck` (all green).
2. `pnpm dev`, then walk criteria 4–14 in order, in a 375px-wide viewport.
3. Deliberately play one bankruptcy run and one full 20-round run.
4. Grep the web app for forbidden copy: `bet`, `investment advice`, `guaranteed`,
   `recommendation` — none in UI strings (`Pass` ≠ bet language; "place bet" is
   what's banned).

## Reporting

Commits (message prefixes): `phase0:` for Part A, `phase1:` for Parts B–D — at
minimum one commit per part, more at logical checkpoints. Do not push.
On completion: set Status to `complete`, update `progress.md` (session entry +
Current Status + How to Run), and recommend the next task (expected: Auditor pass
A001 on this handoff).
If blocked: log under Blocked/Questions in `progress.md` and stop — do not guess.
