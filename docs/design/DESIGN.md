# Signal or Noise? — Design System Contract

## Product identity

Signal or Noise? is a mobile-first market-history game. Players are shown disguised historical stock-market scenarios, read clues, inspect a pre-decision lookback chart, choose Long, Short, or Pass, select a confidence level, and then see the company and outcome revealed.

Primary taglines:

- Can you find the signal through the noise?
- Read the clues. Make the call. Beat the reveal.
- Play daily, climb leaderboards, and challenge friends.

## Design north star

Make investing history feel like a sharp, fast, replayable guessing game.

The product should feel like:

- Wordle plus trivia plus fantasy sports plus historical market reveals.
- A premium mobile game with strong information design.
- A mystery card experience where every clue feels intentional.
- Competitive when users want it, casual when they do not.

The product should not feel like:

- Robinhood.
- A brokerage app.
- A finance dashboard.
- A stock terminal.
- A generic SaaS analytics product.
- AI-generated fintech slop.
- A gambling app.

## Brand personality

Use this tone:

- Smart.
- Punchy.
- Competitive but approachable.
- Curious.
- Modern.
- Slightly suspenseful.
- Game-first.

Avoid this tone:

- Wall Street bro.
- Corporate financial-advisor language.
- Overly educational classroom language.
- Meme-heavy or unserious.
- Casino/gambling language.

Use words like:

- Signal.
- Noise.
- Clue.
- Call.
- Reveal.
- Streak.
- Run.
- Challenge.
- Bankroll.
- Confidence.
- Long.
- Short.
- Pass.

Avoid words like:

- Bet, wager, casino, gamble, real money, brokerage, financial advice, buy recommendation, sell recommendation.

Exception: Internal implementation may use terms like stake or risk amount, but user-facing language should prefer confidence, bankroll, call, and position.

## Core visual concept

The UI should communicate that the player is filtering noisy market history to identify the real signal.

Visual themes:

- Dark interface with luminous signal accents.
- Card-based gameplay.
- Subtle grid, waveform, chart, static, or scanline motifs.
- Clear contrast between hidden information and revealed information.
- Strong reveal moments.
- High-quality typography and spacing.
- Mobile-first thumb-friendly controls.

## Visual style rules

Use:

- Deep navy or near-black app background.
- Slightly elevated cards.
- Crisp borders.
- Subtle noise/texture only if it improves the theme.
- Bright accent colors for actions and confidence levels.
- Clean chart lines and minimal axes.
- Large numbers for bankroll and return results.
- Rounded corners, but not overly bubbly.
- Satisfying motion for card transitions and reveal states.

Avoid:

- Neon overload.
- Random gradients.
- Meme coin / crypto casino visuals.
- Dense financial charting UI.
- Tiny text.
- Overuse of red/green trading language.
- Generic AI landing page blobs.
- Fake 3D coins or casino chips.

## Color direction

Suggested palette:

- App background: #08111F
- Elevated surface: #0E1A2D
- Card surface: #111F35
- Card border: #24324A
- Text primary: #F4F7FB
- Text secondary: #A9B7CA
- Text muted: #66758C
- Signal blue: #4DA3FF
- Signal cyan: #38D5E6
- Success green: #35D07F
- Warning amber: #FFB84D
- Danger red: #FF5C73
- All-in violet: #A875FF
- Noise gray: #4E5C70

Confidence colors:

- Low: calm blue/cyan.
- Medium: green.
- High: amber.
- All-In: violet or red-violet.

Do not rely only on color. Always pair colors with labels, percentages, and dollar amounts.

## Typography direction

Use a modern sans-serif. Recommended options:

- Inter.
- Geist.
- Satoshi.
- Manrope.
- IBM Plex Sans.

Use tabular numerals for bankroll, scores, returns, and leaderboard numbers.

Hierarchy:

- App title and major screen headings should be bold and compact.
- Scenario card text should be readable, not overly condensed.
- Clues should be scannable.
- Key decision labels should be large enough for mobile taps.

## Layout principles

Mobile-first layout order for gameplay:

1. Mode/run status.
2. Bankroll and round number.
3. Scenario title and historical window.
4. Pre-decision lookback chart.
5. Macro/company clue sections.
6. Long / Short / Pass decision controls.
7. Confidence controls with calculated dollar amount.
8. Lock-in action.

Desktop layout may use a two-column composition:

- Left: scenario card and chart.
- Right: decision panel, bankroll, current run stats, and mini leaderboard.

## Game interaction rules

The primary game action must be fast:

1. Read the card.
2. Make the call.
3. Choose confidence.
4. Reveal.
5. Continue.

Never force the player to read a long educational article before acting.

Reveal text should be short and punchy by default. Any deeper explanation should be optional or reserved for future versions.

## Required MVP screens

1. Landing page.
2. Home / mode select.
3. Classic run setup.
4. Daily challenge setup.
5. Gameplay round card.
6. Decision locked state.
7. Reveal screen.
8. Run summary.
9. Daily challenge summary.
10. Leaderboards.
11. Profile / stats.
12. Login / create account prompt.
13. Settings.
14. Basic content/admin seed-data viewer may be designed as an internal screen, not polished for public launch.

## Required MVP components

- App shell.
- Top navigation.
- Mobile bottom navigation.
- Mode card.
- Scenario card.
- Lookback chart card.
- Clue block.
- Decision buttons: Long / Short / Pass.
- Confidence selector: Low / Medium / High / All-In.
- Bankroll display.
- Signal Score display.
- Round progress indicator.
- Reveal panel.
- Result delta component.
- Leaderboard table/card.
- Profile stat tile.
- Streak indicator.
- Difficulty selector.
- Login gate prompt.
- Empty state.
- Error state.
- Loading/skeleton state.

## Confidence selector rules

Confidence levels are tied to a percentage of the current bankroll.

- Low = 10% of bankroll, Signal Score impact +/-1.
- Medium = 40% of bankroll, Signal Score impact +/-2.
- High = 70% of bankroll, Signal Score impact +/-3.
- All-In = 100% of bankroll, Signal Score impact +/-5.

Each button must display exactly two lines — name with percentage, then the
calculated dollar amount:

Line 1: Confidence name (percentage).
Line 2: Calculated dollar amount (visually dominant).

Do NOT display the Signal Score impact on the buttons. Signal Score math is a
hidden formula (decision D010); it appears only in results/reveal contexts.

Example:

Low (10%)
$1,000

## Decision buttons

The decision area should show:

- Long.
- Short.
- Pass.

Long and Short should feel like equally valid calls. Do not visually bias the user toward Long.

Pass should feel useful, not like a disabled state. For MVP, Pass completes the round, causes no bankroll change, and applies a very small Signal Score penalty. Pass preserves streak but does not increase it.

## Chart rules

Before the player makes a call, show only the pre-decision lookback chart.

Do not show outcome-period data before the player locks a decision.

Chart requirements:

- No company name.
- No ticker.
- No exact future outcome.
- Show historical price trend up to the decision date.
- Keep axes minimal.
- Make the chart readable on mobile.
- After reveal, show the outcome chart and result.

## Difficulty rules

Every scenario card has Easy, Medium, and Hard variants.

Classic mode:

- Player chooses difficulty for the run.

Daily challenge:

- Fixed mixed difficulty.

Difficulty affects:

- How identifying the clues are.
- How specific the company description is.
- How specific the industry is.
- How much useful macro context is shown.
- How direct or indirect the three clues are.

Difficulty does not affect:

- Actual company.
- Historical date range.
- Return calculation.
- Bankroll scoring math.

## Motion rules

Motion should be useful and satisfying, not distracting.

Recommended motion:

- Round cards slide horizontally or vertically between rounds.
- Lock-in button briefly compresses or pulses.
- Reveal screen flips, wipes, or resolves through a signal/noise transition.
- Bankroll count animates from previous value to new value.
- Leaderboard movement animates subtly.

Avoid:

- Long animations blocking gameplay.
- Excessive confetti.
- Casino-like flashing.
- Motion that makes the app feel cheap.

## Accessibility rules

- Meet WCAG-friendly contrast wherever possible.
- Do not rely on red/green alone.
- All buttons need clear labels.
- Confidence levels must include text, percentage, and dollar amount.
- Charts need readable labels or summary text.
- Touch targets should be at least 44px high.
- The game should be usable in reduced motion mode.

## Content tone rules

Default reveal tone:

- Short.
- Punchy.
- Lightly educational.
- More like trivia/fun fact than lesson.

Example:

That was Netflix. The market was skeptical, but streaming adoption exploded. A bold long call would have crushed this round.

Do not write long essays in the default reveal state.

## Monetization design notes

Do not implement monetization in the MVP design unless specifically requested.

Future monetization should support:

- Paid game purchase.
- Free trial or limited free mode.
- Paid challenge packs.
- Famous market era packs.
- Cosmetic profile items.
- Premium/ad-free tier.
- Season pass bundling content and features.
- Advanced stats.

Avoid pay-to-win mechanics.

## Final design test

A screen is on-brand if a user can describe it as:

- Fast.
- Curious.
- Smart.
- Game-like.
- Premium.
- Mobile-first.
- About finding the hidden signal.

A screen is off-brand if it feels like:

- Robinhood.
- Bloomberg terminal.
- Generic startup dashboard.
- Casino app.
- AI-generated finance landing page.
