# 05 User Stories — Signal or Noise?

## User Types

### Guest Player

A player who has not logged in.

Can:

- Play Classic Run
- Play Daily Challenge unofficially
- See results
- Be prompted to create account
- View limited public leaderboards

Cannot:

- Submit official leaderboard scores
- Save profile stats across devices
- Claim leaderboard rank
- Join future friend challenges

### Logged-In Player

A player with an account.

Can:

- Save runs
- Submit leaderboard scores
- Track lifetime stats
- Play official Daily Challenge
- View profile
- Compete on leaderboards

### Future Premium Player

A player who has purchased content or subscription.

Can eventually access:

- Premium content packs
- Advanced stats
- Cosmetics
- Season pass content
- Private league features

Not needed for MVP.

### Content Admin / Developer

A developer or admin managing scenario cards.

Can:

- Generate scenario JSON
- Validate scenario JSON
- Import scenarios
- Mark scenarios active/inactive
- Assign scenarios to daily challenge pools
- Review source URLs
- Test scenarios by difficulty

A full admin UI is optional for MVP. Scripts are acceptable.

## Epic 1: Onboarding and Landing

### Story 1.1 — Understand the Game

As a new visitor, I want to quickly understand what Signal or Noise? is so I can decide whether to play.

Acceptance criteria:

- Landing page explains the game in one or two short sections.
- Includes working name and tagline.
- Includes a clear “Play Now” call to action.
- Explains that it is a historical market guessing game.
- Avoids finance-product positioning.

### Story 1.2 — Start Without Login

As a guest player, I want to start playing without creating an account so there is no friction.

Acceptance criteria:

- Guest can start Classic Run.
- Guest can play Daily Challenge unofficially.
- Guest is not blocked by signup before gameplay.
- Guest sees login prompt when trying to save or submit score.

## Epic 2: Classic Run

### Story 2.1 — Start Classic Run

As a player, I want to start a Classic Run so I can play a full session.

Acceptance criteria:

- Player can select Classic Run.
- Player chooses difficulty: Easy, Medium, or Hard.
- Run starts with configured bankroll.
- Run defaults to 20 rounds.

### Story 2.2 — View Scenario Card

As a player, I want to see a disguised historical scenario so I can make a call.

Acceptance criteria:

- Scenario card shows era/date context.
- Company name and ticker are hidden.
- Difficulty-specific hidden company description is shown.
- Macro context is shown.
- Three clues are shown.
- Pre-decision lookback chart is shown.
- Outcome chart is not shown before decision.

### Story 2.3 — Make a Decision

As a player, I want to choose Long, Short, or Pass so I can play the round.

Acceptance criteria:

- Long button is visible.
- Short button is visible.
- Pass button is visible.
- Player must select one before submitting unless Pass is selected directly.
- UI clearly shows selected decision.

### Story 2.4 — Select Confidence

As a player, I want to select my confidence level so I can control risk.

Acceptance criteria:

- Confidence choices are Low, Medium, High, All-In.
- Each choice shows percentage of bankroll.
- Each choice shows dollar stake based on current bankroll.
- Confidence is required for Long or Short.
- Confidence is disabled or irrelevant for Pass.
- Button styling communicates increasing risk.

### Story 2.5 — Reveal Result

As a player, I want to see the company and result after my decision so the round feels satisfying.

Acceptance criteria:

- Reveal shows company name and ticker.
- Reveal shows decision date and outcome period.
- Reveal shows actual return.
- Reveal shows player decision.
- Reveal shows confidence.
- Reveal shows stake.
- Reveal shows gain/loss.
- Reveal shows updated bankroll.
- Reveal shows Signal Score change.
- Reveal shows short punchy reveal text.
- Outcome chart is shown after reveal.

### Story 2.6 — Continue Run

As a player, I want to move to the next round so the run flows smoothly.

Acceptance criteria:

- Next round button is clear.
- Run progress is shown.
- Bankroll carries forward.
- Signal Score carries forward.
- Previous round results are saved.

### Story 2.7 — End Run

As a player, I want to see a summary at the end of my run.

Acceptance criteria:

- Summary appears after 20 rounds or bankruptcy.
- Shows final bankroll.
- Shows Signal Score.
- Shows correct calls, wrong calls, and passes.
- Shows best trade and worst trade.
- Shows streak stats.
- Shows leaderboard eligibility.
- Guest receives login prompt to save score.

### Story 2.8 — Bankruptcy

As a player, I want the run to end if I lose all my bankroll so the risk system feels meaningful.

Acceptance criteria:

- Bankroll cannot go below $0.
- If bankroll reaches $0, run ends immediately.
- Run score is logged as $0.
- Player sees bankruptcy/end screen.
- Player can start a new game.

## Epic 3: Daily Challenge

### Story 3.1 — Start Daily Challenge

As a player, I want to play the daily challenge so I can compare my score with others.

Acceptance criteria:

- Daily Challenge is accessible from main menu.
- It contains 10 rounds.
- It uses the official scenario set for the day.
- It uses configured starting bankroll.
- It shows daily progress.

### Story 3.2 — Official Attempt

As a logged-in player, I want one official Daily Challenge attempt so the leaderboard is fair.

Acceptance criteria:

- Logged-in user can submit one official score per day.
- Replays are either blocked or marked unofficial.
- Official attempt status is shown.
- Score submission is automatic or clearly confirmed.

### Story 3.3 — Guest Daily Challenge

As a guest, I want to try the Daily Challenge without logging in.

Acceptance criteria:

- Guest can play Daily Challenge unofficially.
- Guest sees result.
- Guest cannot submit to leaderboard without login.
- Guest is prompted to sign in after completion.

### Story 3.4 — Daily Leaderboard

As a player, I want to see today’s leaderboard so I can compare my performance.

Acceptance criteria:

- Leaderboard ranks by final bankroll.
- Tiebreakers use Signal Score, correct calls, passes, and completion time.
- Logged-in official scores appear.
- Guest scores do not appear.

## Epic 4: Profile and Stats

### Story 4.1 — View Profile

As a logged-in player, I want a profile page so I can track progress.

Acceptance criteria:

- Profile shows username/display name.
- Shows best run bankroll.
- Shows total Signal Score.
- Shows run count.
- Shows round stats.
- Shows Daily Challenge stats.
- Shows best streak.

### Story 4.2 — Track Lifetime Stats

As a player, I want my stats to persist over time.

Acceptance criteria:

- Runs are saved.
- Round decisions are saved.
- Stats aggregate across eligible modes.
- Stats update after runs complete.

## Epic 5: Leaderboards

### Story 5.1 — Best Run Leaderboard

As a player, I want to see the best 20-round runs.

Acceptance criteria:

- Leaderboard ranks by final bankroll.
- Only logged-in eligible runs count.
- Difficulty filter is supported or planned.
- Tiebreakers are defined.

### Story 5.2 — Signal Score Leaderboard

As a player, I want to see who has the best Signal Score.

Acceptance criteria:

- Leaderboard ranks by Signal Score.
- Time period filters can be added later.
- Signal Score is shown separately from bankroll.

### Story 5.3 — Weekly and Monthly Leaderboards

As a player, I want time-based leaderboards so I have fresh goals.

Acceptance criteria:

- Weekly leaderboard is planned for MVP or near-MVP.
- Monthly leaderboard is planned after MVP if not included.
- Daily leaderboard exists through Daily Challenge.

## Epic 6: Scenario Content

### Story 6.1 — Load Scenario Cards

As a player, I want each scenario to feel clear and fair.

Acceptance criteria:

- Scenario includes Easy/Medium/Hard variants.
- Scenario hides company identity before reveal.
- Scenario includes a valid lookback chart period.
- Scenario includes an outcome period.
- Scenario includes actual return data.
- Scenario includes reveal text.

### Story 6.2 — Validate Scenario Cards

As a developer, I want to validate scenario cards before import.

Acceptance criteria:

- JSON schema exists.
- Validation script checks required fields.
- Validation script checks difficulty variants.
- Validation script checks source URL fields.
- Validation script checks date consistency.
- Invalid cards fail import.

### Story 6.3 — Import Scenario Cards

As a developer, I want to import approved scenario cards into the database.

Acceptance criteria:

- Seed/import script exists.
- Cards can be loaded into database.
- Duplicate IDs are handled safely.
- Active/inactive status is preserved.

## Epic 7: Settings and Help

### Story 7.1 — View Game Rules

As a player, I want to understand how scoring works.

Acceptance criteria:

- Rules page explains Long, Short, Pass.
- Rules page explains Confidence.
- Rules page explains Bankroll.
- Rules page explains Signal Score.
- Rules page explains Daily Challenge eligibility.

### Story 7.2 — Entertainment Disclaimer

As a product owner, I want the app to make clear that this is not financial advice.

Acceptance criteria:

- Disclaimer exists in footer/help.
- Language says scenarios are historical and for entertainment/gameplay.
- No real-money trading is offered.
- No live stock recommendations are offered.

## Future User Stories

### Friend Challenges

As a player, I want to challenge friends so we can compare performance in the same scenario set.

### Private Leagues

As a player, I want to create a private league so my friends can compete over time.

### Portfolio Draft

As a player, I want to choose multiple hidden companies from a set so I can build a mini portfolio.

### Smart Pass Scoring

As a player, I want Pass to be strategically meaningful so avoiding noisy scenarios can be rewarded.

### Paid Content Packs

As a player, I want to buy extra eras or challenge packs so I can keep playing fresh content.

### Expo Mobile App

As a player, I want a native mobile app so I can play more easily from my phone.
