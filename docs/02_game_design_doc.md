# 02 Game Design Document — Signal or Noise?

## Core Game Loop

Signal or Noise? is built around disguised historical market scenarios.

Each round follows this flow:

1. Player receives a scenario card.
2. Player reviews the hidden company profile, macro context, balanced tension,
   setup hints, and pre-decision lookback chart.
3. Player chooses Long, Short, or Pass.
4. Player chooses a Confidence level.
5. The app calculates the simulated result using the actual historical return.
6. The company is revealed.
7. The player sees gain/loss, updated bankroll, Signal Score change, and a short reveal.
8. The player advances to the next round or ends the run.

## Core Actions

### Long

The player believes the stock will go up during the outcome period.

### Short

The player believes the stock will go down during the outcome period.

For MVP, shorting is simplified:

- If the stock goes down, the short gains by the same percentage.
- If the stock goes up, the short loses by the same percentage.
- Losses are capped at the amount staked.
- No borrow fees, margin requirements, or unlimited losses are modeled.

### Pass

The player chooses not to make a call.

MVP behavior:

- Pass counts as a completed round.
- Pass causes no bankroll gain or loss.
- Pass preserves the player’s streak but does not increase it.
- Pass lowers Signal Score very slightly.
- Smart pass scoring is a post-prototype, pre-mobile priority.

Recommended MVP Signal Score penalty for Pass:

```text
Pass = -0.25 Signal Score
```

This makes Pass useful but not free.

## Scoring Contexts

The app has three scoring contexts:

1. Runs
2. Daily Challenges
3. Lifetime Profile Stats

### 1. Classic Runs

A Classic Run is the main single-player mode.

Default rules:

```text
Rounds: Easy 10 / Medium 15 / Hard 20
Starting bankroll: configurable by mode/difficulty
Default starting bankroll: $10,000
End condition: finish all rounds or hit $0
Primary score: final bankroll
Secondary score: Signal Score
```

The starting bankroll should be configurable because harder game modes may start with less bankroll.

Recommended starting bankroll by difficulty:

```text
Easy: $12,500
Medium: $10,000
Hard: $7,500
```

These values are placeholders and should be tuned during playtesting.

### 2. Daily Challenges

A Daily Challenge is the retention mode.

Default rules:

```text
Rounds: 10
Starting bankroll: configurable, default $10,000
One official leaderboard submission per logged-in user per day
Same scenario set for all players
Fixed mixed difficulty unless otherwise configured
```

Daily Challenge should be part of MVP completion, but Classic Run should be implemented first.

### 3. Lifetime Profile Stats

Lifetime stats track long-term behavior across modes.

Track:

- Total runs started
- Total runs completed
- Total rounds played
- Correct calls
- Wrong calls
- Passes
- Win rate
- Best run bankroll
- Average final bankroll
- Best Daily Challenge rank
- Best streak
- Current streak
- Total Signal Score
- Average Signal Score per round
- Best single trade
- Worst single trade
- Most profitable long
- Most profitable short
- Highest confidence hit
- All-in attempts
- All-in wins
- All-in losses

## Confidence System

Confidence controls how much of the player’s current bankroll is staked.

The UI should show the confidence name, percentage, and actual dollar amount.

Example with $1,000 bankroll:

```text
Low
10%
$100

Medium
40%
$400

High
70%
$700

All-In
100%
$1,000
```

Confidence levels:

```text
Low = 10% of current bankroll
Medium = 40% of current bankroll
High = 70% of current bankroll
All-In = 100% of current bankroll
```

Each confidence level also affects Signal Score:

```text
Correct Low = +1
Wrong Low = -1

Correct Medium = +2
Wrong Medium = -2

Correct High = +3
Wrong High = -3

Correct All-In = +5
Wrong All-In = -5

Pass = -0.25
```

## Primary Score: Bankroll

Bankroll is the main game score.

Formula for Long:

```text
stake = currentBankroll * confidencePercentage
profitOrLoss = stake * actualReturnPercent
newBankroll = currentBankroll + profitOrLoss
```

Formula for Short:

```text
stake = currentBankroll * confidencePercentage
shortReturnPercent = actualReturnPercent * -1
profitOrLoss = stake * shortReturnPercent
loss is capped at stake
newBankroll = currentBankroll + profitOrLoss
```

Pass:

```text
newBankroll = currentBankroll
```

Bankroll cannot go below $0.

If bankroll reaches $0:

```text
Run ends.
Score is logged.
Player may start a new game in any available mode.
```

## Secondary Score: Signal Score

Signal Score measures how accurate and bold the player’s calls were.

Bankroll answers:

> How much did you make?

Signal Score answers:

> How well did you read the signal?

Signal Score should have its own leaderboard and profile stat, but it should not replace bankroll as the primary score.

## Rounds Won

Because Classic Runs and Daily Challenges have configured lengths, “Rounds Won” should not be a primary leaderboard. It should still be tracked in summaries and profiles.

Track:

- Correct rounds
- Incorrect rounds
- Passed rounds
- Win rate
- Confidence-weighted Signal Score

## Game Modes

### Mode 1: Classic Run

This is the main MVP mode.

Player chooses:

- Difficulty
- Optional era/pack if available
- Starts a difficulty-configured run
- Attempts to finish with the highest bankroll possible

Default run length follows difficulty: Easy 10 / Medium 15 / Hard 20.

### Mode 5: Daily Challenge

This is the Wordle-style retention mode.

Rules:

- 10 rounds
- Same scenarios for all users that day
- One official leaderboard submission per logged-in user
- Guest users may play but cannot submit to leaderboards
- Daily leaderboard ranks by final bankroll
- Signal Score appears as secondary ranking/tiebreaker

### Mode 2: Portfolio Draft

Documented as immediate post-prototype priority.

Concept:

- Player sees a set of hidden companies from a shared time period.
- Player chooses a small portfolio from the available options.
- Portfolio outcome is revealed after selection.
- Best portfolio value wins.

Portfolio Draft should be added before the native mobile app if the Classic and Daily loops are stable.

## Difficulty System

Every scenario card should support:

- Easy
- Medium
- Hard

The underlying scenario truth does not change by difficulty.

Difficulty changes:

- How identifying the setup hints and hidden-card wording are
- How specific the industry description is
- How much company detail is shown
- How specific the macro context is
- Whether market cap range is shown
- How obvious the clue wording is
- How much the lookback chart helps

Difficulty does not change:

- Company
- Ticker
- Decision date
- Outcome period
- Historical return
- Reveal
- Scoring math

Classic Mode:

```text
Player chooses Easy, Medium, or Hard for the whole run.
```

Daily Challenge:

```text
Uses a fixed mixed difficulty set.
```

## Chart System

The pre-decision chart must not reveal the outcome.

Each scenario needs two chart periods:

### Pre-Decision Lookback Chart

Shown before the player chooses.

Example:

```text
Decision Date: Jan 2012
Pre-Decision Chart: Jan 2009 to Jan 2012
```

### Outcome Chart

Shown after reveal.

Example:

```text
Outcome Period: Jan 2012 to Jan 2017
```

The MVP should show the lookback chart as part of the main clue card.

Recommended layout:

- Always visible on desktop/tablet.
- Compact but visible on mobile.
- More detailed chart interactions can be added later.

## Clue Layer

MVP:

- Base scenario card information is shown immediately.
- No optional clue reveal system yet.

Post-MVP:

- Players may reveal more information.
- Revealing extra clues may affect Signal Score, Bankroll multiplier, or difficulty rating.
- This system should be added only after the core loop is proven.

## Reveal

The reveal should be short and punchy by default.

Reveal should include:

- Company name
- Ticker
- Time period
- Actual return
- Player decision
- Confidence level
- Stake amount
- Gain/loss
- Updated bankroll
- Signal Score change
- Short reveal blurb
- Fun fact/trivia item

Optional “Why?” details can be implemented later.

## End-of-Run Summary

At the end of a Classic Run or Daily Challenge, show:

- Final bankroll
- Signal Score
- Correct calls
- Wrong calls
- Passes
- Best trade
- Worst trade
- Highest confidence win
- Biggest missed opportunity
- Streak
- Leaderboard eligibility
- Login prompt if guest user wants to save or submit score

## Fairness Rules

A leaderboard-eligible attempt should use:

- Fixed scenario list
- Fixed starting bankroll
- Fixed difficulty setting or official mixed difficulty
- One official attempt for Daily Challenge
- No editing results after reveal
- No replaying same daily set for improved official score

Practice and guest runs may be replayed freely but should not contaminate official leaderboards.
