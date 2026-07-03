# Signal or Noise? — Screen Flow Specification

## Navigation model

Mobile navigation should be simple and game-first.

Suggested bottom tabs:

1. Play.
2. Daily.
3. Leaderboards.
4. Profile.

Settings can be accessed from Profile.

Desktop navigation can use a top bar:

- Signal or Noise?
- Play
- Daily Challenge
- Leaderboards
- Profile

## Screen 1: Landing Page

Purpose:

Introduce the game and drive the user into a quick start.

Primary content:

- Logo/name: Signal or Noise?
- Tagline: Can you find the signal through the noise?
- Supporting line: Read the clues. Make the call. Beat the reveal.
- Primary CTA: Play a Demo Run
- Secondary CTA: View Daily Challenge
- Visual preview of a scenario card and reveal card.

Design notes:

- Should feel like a premium game landing page, not a financial app.
- Include a subtle chart/noise/signal visual motif.
- Avoid fake trader imagery.

## Screen 2: Home / Mode Select

Purpose:

Let the user choose how to play.

Mode cards:

- Classic Run
- Daily Challenge
- Portfolio Draft — Coming Soon

Classic Run card should show:

- 20 rounds.
- Choose difficulty.
- Build your bankroll.

Daily Challenge card should show:

- 10 rounds.
- Same challenge for everyone today.
- One official leaderboard attempt.

Portfolio Draft card should show:

- Coming after prototype.
- Pick a basket of hidden companies.

## Screen 3: Classic Run Setup

Purpose:

Configure a single-player run.

Controls:

- Difficulty: Easy / Medium / Hard.
- Starting bankroll: default value based on difficulty.
- Start Run button.

Suggested starting bankroll by difficulty:

- Easy: $12,500.
- Medium: $10,000.
- Hard: $7,500.

These values can change later. UI should support configuration.

## Screen 4: Daily Challenge Setup

Purpose:

Start the official daily challenge.

Content:

- Date.
- 10 rounds.
- Mixed difficulty.
- Starting bankroll.
- One leaderboard attempt.
- Login required to submit score.

If guest user:

- Allow practice attempt.
- Show login prompt for leaderboard submission.

## Screen 5: Gameplay Round Card

Purpose:

Present the hidden scenario and collect the player's decision.

Header:

- Mode name.
- Round count.
- Bankroll.
- Signal Score.

Scenario card:

- Scenario title or codename.
- Historical decision date.
- Holding period.
- Sector/industry clue.
- Macro climate.
- Company description.
- Three clues.

Chart card:

- Pre-decision lookback chart.
- No company name.
- No ticker.
- No outcome-period data.

Decision area:

- Long.
- Short.
- Pass.

Confidence area:

- Low (10%): calculated dollar amount.
- Medium (40%): calculated dollar amount.
- High (70%): calculated dollar amount.
- All-In (100%): calculated dollar amount.

Signal Score impact is NOT shown on the buttons (hidden formula, decision D010).

CTA:

- Lock In Call.

States:

- No decision selected.
- Decision selected, no confidence selected.
- Ready to lock.
- Locked.
- Loading reveal.

## Screen 6: Decision Locked State

Purpose:

Create suspense before reveal.

Content:

- Your call.
- Your confidence.
- Amount at risk.
- Brief signal/noise transition.

Button:

- Reveal Result.

This state may be very brief, but should be visually distinct.

## Screen 7: Reveal Screen

Purpose:

Show company, outcome, and score impact.

Content:

- Company name.
- Ticker.
- Actual historical date range.
- Player's call.
- Confidence.
- Amount risked.
- Actual return.
- Gain/loss.
- New bankroll.
- Signal Score change.
- Updated streak.
- Outcome chart.
- Short punchy reveal text.
- Fun fact/trivia line.

CTA:

- Next Round.
- View Leaderboard, only if appropriate.

Design notes:

- Reveal should be satisfying and clear.
- Avoid long educational explanation by default.
- Outcome chart is allowed only after reveal.

## Screen 8: Run Summary

Purpose:

End the 20-round Classic Run.

Content:

- Final bankroll.
- Starting bankroll.
- Net gain/loss.
- Final Signal Score.
- Correct calls.
- Wrong calls.
- Passes.
- Accuracy.
- Best call.
- Worst call.
- Best streak.
- Difficulty.
- Leaderboard eligibility.

CTAs:

- Play Again.
- Try Daily Challenge.
- View Leaderboard.
- Create Account / Sign In if guest and score is not saved.

## Screen 9: Daily Challenge Summary

Purpose:

End the 10-round Daily Challenge.

Content:

- Final bankroll.
- Daily rank.
- Percentile.
- Signal Score.
- Accuracy.
- Best call.
- Streak.
- Shareable result card preview.

CTAs:

- View Daily Leaderboard.
- Share Result.
- Play Practice Run.

## Screen 10: Leaderboards

Purpose:

Show competitive ranking.

Tabs:

- Daily Challenge.
- Best Classic Runs.
- All-Time Signal Score.
- All-Time Stats.
- Friends later.

Filters:

- Today.
- Weekly.
- Monthly.
- All-Time.

Leaderboard row should show:

- Rank.
- Player display name.
- Final bankroll or score.
- Signal Score if relevant.
- Accuracy or round count when useful.

## Screen 11: Profile / Stats

Purpose:

Show long-term progression.

Content:

- Display name.
- Avatar/badge.
- Best bankroll.
- All-time Signal Score.
- Total rounds played.
- Correct calls.
- Accuracy.
- Best streak.
- Daily challenge history.
- Favorite mode.
- Long vs Short performance.

Future monetization placeholders:

- Cosmetics.
- Badges.
- Premium stats.

Do not overbuild monetization in MVP design.

## Screen 12: Login Prompt

Purpose:

Gate persistence without blocking quick play.

Copy direction:

- Play as guest immediately.
- Sign in to save stats, join leaderboards, and keep your streak.

Avoid aggressive signup walls.

## Screen 13: Settings

Purpose:

Manage basic preferences.

MVP settings:

- Display name.
- Preferred difficulty.
- Reduced motion.
- Chart detail level.
- Theme, if supported later.

Future setting:

- Reveal tone.

Do not design multiple reveal tones as MVP content.

