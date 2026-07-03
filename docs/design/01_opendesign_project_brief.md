# Signal or Noise? — OpenDesign Project Brief

## Project goal

Design a polished, mobile-first prototype for Signal or Noise?, a historical market prediction game.

The prototype should demonstrate the core loop:

1. Player enters a single-player run or daily challenge.
2. Player sees a disguised historical market scenario.
3. Player reviews a pre-decision lookback chart and clue card.
4. Player chooses Long, Short, or Pass.
5. Player chooses a confidence level tied to bankroll percentage.
6. Player locks the call.
7. Company and outcome are revealed.
8. Bankroll and Signal Score update.
9. Player continues to the next round or sees the final summary.

## Working name

Signal or Noise?

Use the question mark in the product name.

## Taglines

Primary:

Can you find the signal through the noise?

Secondary:

Read the clues. Make the call. Beat the reveal.

Supporting:

Play daily, climb leaderboards, and challenge friends.

## Product definition

Signal or Noise? is a mobile-first web game where players are shown disguised historical stock-market scenarios and must decide whether to go long, short, or pass. Players start each challenge with a fictional bankroll, choose their confidence level, and see how much money they would have made or lost after the company and historical outcome are revealed.

## Target audience

Primary audience:

- Wordle players.
- Trivia players.
- Fantasy sports players.
- Casual competitive gamers.
- People who enjoy guessing games and daily challenges.

Secondary audience:

- Finance-curious adults.
- Investing hobbyists who enjoy games.
- Students/kids later, through optional features that do not weaken the core game.

## Product positioning

Position as a game, not a finance product.

Preferred positioning:

A market-history guessing game where you read the clues, make the call, and see if you could have spotted the winner before the reveal.

Avoid positioning as:

- A stock simulator.
- A trading simulator.
- A financial education product first.
- An investing advice app.
- A brokerage-style app.

## MVP scope represented in design

Required design coverage:

- Landing page.
- Home / mode select.
- Classic run setup.
- Daily challenge setup.
- Gameplay round card.
- Pre-decision lookback chart.
- Long / Short / Pass controls.
- Confidence selector.
- Lock-in state.
- Reveal state.
- Run summary.
- Daily challenge summary.
- Leaderboards.
- Profile/stats.
- Login prompt.
- Settings.

## Game modes in design

MVP:

- Classic Run.
- Daily Challenge.

Post-prototype, pre-mobile:

- Portfolio Draft mode.

Do not design Portfolio Draft as a full MVP flow unless requested, but include it as a coming-soon card or future mode if useful.

## Game structure

Classic Run:

- 20 rounds.
- Configurable starting bankroll.
- Difficulty selected by player.
- Run ends after 20 rounds or when bankroll hits $0.

Daily Challenge:

- 10 rounds.
- One official leaderboard attempt per day.
- Same round set for all users.
- Fixed mixed difficulty.
- Run ends after 10 rounds or when bankroll hits $0.

Lifetime Profile Stats:

- Total rounds played.
- Correct calls.
- Long accuracy.
- Short accuracy.
- Pass count.
- Best run bankroll.
- Average final bankroll.
- Best streak.
- All-time Signal Score.
- Daily challenge results.

## Scoring design

Primary score:

- Bankroll.

Secondary score:

- Signal Score.

Confidence levels:

- Low = 10% bankroll, Signal Score +/-1.
- Medium = 40% bankroll, Signal Score +/-2.
- High = 70% bankroll, Signal Score +/-3.
- All-In = 100% bankroll, Signal Score +/-5.

Pass behavior:

- Completes the round.
- No bankroll change.
- Slightly lowers Signal Score.
- Preserves current streak but does not increase it.

Bankruptcy:

- If bankroll hits $0, the run ends.
- The score is logged.
- The player can start a new game in any available mode.

## Design emphasis

The prototype should make the following feel excellent:

- Reading a scenario card.
- Inspecting a clean lookback chart.
- Choosing a call.
- Selecting confidence.
- Locking in.
- Seeing the reveal.
- Watching bankroll update.
- Checking leaderboard movement.

## Output expectations

Create a mobile-first design with desktop-responsive layouts.

Preferred artifacts:

- Mobile app-like web prototype.
- Responsive desktop version.
- Reusable component system.
- Design tokens.
- Screen-by-screen flow.
- Strong gameplay UI.

