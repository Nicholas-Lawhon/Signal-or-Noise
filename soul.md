# soul.md — Signal or Noise?

This is the product constitution. Every agent reads this file before doing any work.
Nothing in this file may be changed by an implementing agent. Changes require an
orchestrator decision recorded in `decisions.md` with user approval.

## What This Product Is

**Signal or Noise?** (always with the question mark) is a mobile-first web game where
players read disguised historical stock-market scenarios and decide whether to go
**Long**, **Short**, or **Pass**. Players stake a fictional bankroll based on their
confidence, then see the company revealed and how much they would have made or lost.

Taglines (locked):

- Primary: *Can you find the signal through the noise?*
- Secondary: *Read the clues. Make the call. Beat the reveal.*
- Feature line: *Play daily, climb leaderboards, and challenge friends.*

## What This Product Is NOT

This is a **game**, not a finance product. It must never feel like or become:

- A brokerage app, trading platform, or paper-trading terminal
- A stock screener or finance dashboard
- A financial advice product
- A gambling product

It should feel like: Wordle, trivia games, fantasy sports, daily challenges,
competitive guessing games.

## Product Pillars

1. **Game first** — every decision prioritizes the game loop, clarity, replayability, fun.
2. **Mobile first** — design for phone width first; desktop enhances.
3. **Curated historical scenarios** — schema-driven, human-reviewed seed content only.
   No dynamic AI-generated content in production gameplay for MVP.
4. **Fast decisions, satisfying reveals** — read card, check chart, make the call,
   reach the reveal quickly. The reveal is the reward.
5. **Competition optional, not overbearing** — leaderboards are a retention layer,
   not the pitch.
6. **No financial advice** — ever, in any copy, feature, or positioning.

## Locked Game Rules

These numbers are locked. Do not change them without an entry in `decisions.md`.

### Confidence

| Level  | Bankroll % | Signal Score (correct / wrong) |
|--------|-----------|-------------------------------|
| Low    | 10%       | +1 / −1                       |
| Medium | 40%       | +2 / −2                       |
| High   | 70%       | +3 / −3                       |
| All-In | 100%      | +5 / −5                       |

```ts
export const CONFIDENCE_CONFIG = {
  low: { label: 'Low', bankrollPercent: 0.10, signalScoreValue: 1 },
  medium: { label: 'Medium', bankrollPercent: 0.40, signalScoreValue: 2 },
  high: { label: 'High', bankrollPercent: 0.70, signalScoreValue: 3 },
  all_in: { label: 'All-In', bankrollPercent: 1.00, signalScoreValue: 5 },
} as const;
```

### Pass

```text
Bankroll change: $0
Signal Score: −0.25
Counts as a completed round
Preserves streak, does not increase it
```

### Bankroll (primary score)

- Long: `pnl = stake × actualReturnPercent`
- Short: `pnl = stake × (−actualReturnPercent)`, **loss capped at stake**
- **All-In exception (D014): a wrong All-In call loses the entire stake — bankroll
  goes to $0 and the run ends, regardless of the return's magnitude.**
- `actualReturnPercent` is a decimal (`+35% = 0.35`, `−20% = −0.20`)
- Bankroll can never go below $0. At $0 — or below $1 (D016) — the run ends
  (bankruptcy), score is logged.

### Call the Company (D015)

Before locking a call, the player may optionally name the hidden company:

```text
Correct guess: +2 Signal Score
Wrong guess:   −1 Signal Score
No guess:      no change
Allowed with any action, including Pass.
Never affects bankroll.
```

### Signal Score (secondary score)

Measures how accurate and bold the calls were. Has its own leaderboard, but never
replaces bankroll as the primary score.

### Modes

```text
Classic Run:      20 rounds, player-chosen difficulty.
                  Starting bankroll: Easy $12,500 / Medium $10,000 / Hard $7,500
Daily Challenge:  10 rounds, same scenarios for everyone, mixed difficulty,
                  default $10,000, one official attempt per logged-in user per day.
                  Guests play unofficially.
```

### Difficulty

Difficulty changes only the hidden-card presentation (how identifying the clues and
descriptions are). It never changes the company, dates, actual return, reveal, or
scoring math.

## Content Integrity Rules

- Hidden card content must never include company name, ticker, founder/CEO names,
  or unmistakable product names/slogans.
- The pre-decision lookback chart must never include the outcome period.
- Before decision submission, the client must never receive: company name, ticker,
  end price, actual return, reveal text, or outcome chart (relaxed for local
  prototype only).
- Every scenario has Easy/Medium/Hard variants, each with exactly 3 clues.
- Source URLs are stored for review, never shown to players.

## Copy Rules

Use: "Make the call", "Beat the reveal", "Find the signal", "Hidden company",
"Scenario", "Bankroll", "Confidence", "Signal Score".

Never use: "Place bet" (in main UI), "Investment advice", "Buy/sell recommendation",
"Profit strategy", "Guaranteed", "Real trading".

Tone: short, punchy, game-like, smart without being academic, fun without being
goofy, competitive without being finance-bro.

Example reveal tone:
> That was Netflix. The market was skeptical, but streaming adoption exploded.
> A bold long call would have crushed this round.

## Visual Identity

- Dark, high-contrast game surface; clean card panels; subtle signal/noise motif;
  bold typography for bankroll and reveal moments.
- The scenario card is the core UI object — it is the trivia "question".
- Bankroll, round number, and Signal Score are always visible during play.
- Confidence buttons always show: label, percentage, dollar stake.
- Avoid: brokerage red/green language, ticker rows, order-book styling, dense chart
  toolbars, generic purple/blue gradient AI-app look, glassmorphism overload.

## Legal Positioning

Required disclaimer (must appear in the app footer/disclaimer page):

> Signal or Noise? is a game using historical market scenarios for entertainment
> and trivia. It does not provide financial advice, investment recommendations,
> or real-money trading.

## MVP Exclusions (do not build)

Native mobile app, real-money trading, brokerage connections, financial advice,
options, leverage, true short mechanics, ETFs/crypto/indexes, friend challenges,
private leagues, Portfolio Draft, smart pass scoring, optional clue reveals, paid
monetization, ads, season pass, dynamic AI-generated production gameplay,
classroom mode, multi-tone reveals.

These are documented futures, not MVP work. If a task seems to require one, stop
and escalate to the orchestrator.
