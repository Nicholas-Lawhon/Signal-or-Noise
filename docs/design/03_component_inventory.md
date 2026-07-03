# Signal or Noise? — Component Inventory

## App shell

Purpose:

Wrap all screens in a consistent mobile-first layout.

Elements:

- App header.
- Optional top nav for desktop.
- Bottom nav for mobile.
- Main content area.
- Toast/notification area.

## Logo / wordmark

Text-based MVP wordmark:

Signal or Noise?

Possible treatment:

- Emphasize Signal in bright accent.
- Make Noise slightly muted or textured.
- Keep the question mark prominent.

Avoid overly literal stock icons.

## Mode Card

Used for:

- Classic Run.
- Daily Challenge.
- Portfolio Draft coming soon.

Fields:

- Mode name.
- Short description.
- Round count.
- Status badge.
- Primary action.

## Scenario Card

Core gameplay component.

Fields:

- Scenario codename/title.
- Decision date.
- Holding period.
- Sector/industry.
- Macro context.
- Company description.
- Three clues.
- Difficulty badge.

Requirements:

- Must be readable on mobile.
- Must not reveal company name or ticker.
- Must support Easy / Medium / Hard content variants.

## Lookback Chart Card

Fields:

- Chart title: Lookback before the call.
- Date range.
- Minimal line chart.
- Optional volatility marker.

Requirements:

- No company name.
- No ticker.
- No future outcome.
- Mobile-readable.
- Minimal axes.

## Outcome Chart Card

Shown only after reveal.

Fields:

- Company name.
- Ticker.
- Outcome date range.
- Actual return.
- Outcome line chart.

## Decision Button Group

Buttons:

- Long.
- Short.
- Pass.

States:

- Default.
- Hover/focus.
- Selected.
- Disabled after lock.

Rules:

- Long and Short should have equal visual weight.
- Pass should be clearly valid.

## Confidence Selector

Buttons:

- Low.
- Medium.
- High.
- All-In.

Each button displays exactly two lines (no Signal Score impact — hidden formula,
decision D010):

- Line 1: Name (percentage).
- Line 2: Dollar amount based on current bankroll (visually dominant).

Example:

Medium (40%)
$4,000

States:

- Default.
- Selected.
- Warning state for All-In.
- Disabled if bankroll is $0.

## Bankroll Display

Fields:

- Current bankroll.
- Change from previous round.
- Optional starting bankroll comparison.

Use tabular numerals.

## Signal Score Display

Fields:

- Current Signal Score.
- Change from previous round.

This is secondary to bankroll but should still feel meaningful.

## Round Progress Indicator

Fields:

- Current round.
- Total rounds.
- Optional mini dots for completed rounds.

Examples:

Round 7 of 20
Round 3 of 10

## Reveal Panel

Fields:

- Company name.
- Ticker.
- Result label.
- Actual return.
- Player result.
- New bankroll.
- Signal Score delta.
- Short reveal copy.
- Fun fact.

Visual tone:

- Satisfying.
- Clear.
- Not casino-like.

## Result Delta

Fields:

- Gain/loss amount.
- Percentage return.
- New bankroll.

States:

- Positive.
- Negative.
- Neutral/pass.
- Bankrupt.

## Leaderboard Table/Card

Fields:

- Rank.
- Player.
- Bankroll/score.
- Secondary stat.
- Movement indicator.

Mobile version should use stacked cards or compact rows.

## Profile Stat Tile

Examples:

- Best Run.
- All-Time Signal Score.
- Accuracy.
- Best Streak.
- Daily Challenge Wins.

## Difficulty Selector

Options:

- Easy.
- Medium.
- Hard.

Each option should explain how it changes the clue experience.

Example:

Easy
More direct clues.

Medium
Balanced clues.

Hard
Less obvious company context.

## Login Gate Prompt

Used when:

- Guest finishes a run.
- Guest wants leaderboard submission.
- Guest wants profile persistence.

Copy direction:

Sign in to save this run and join the leaderboard.

Buttons:

- Sign In.
- Keep Playing as Guest.

## Empty State

Examples:

- No leaderboard entries yet.
- No saved runs yet.
- No daily challenge completed.

Should feel game-like and encouraging without being childish.

## Error State

Examples:

- Scenario failed to load.
- Score failed to save.
- Authentication failed.

Keep copy clear and non-technical.

## Loading/Skeleton State

Use for:

- Loading scenarios.
- Loading leaderboard.
- Preparing reveal.

Could use signal/noise shimmer motif if subtle.

