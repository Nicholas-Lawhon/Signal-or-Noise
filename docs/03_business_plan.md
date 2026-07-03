# 03 Business Plan — Signal or Noise?

## Executive Summary

Signal or Noise? is a mobile-first market-history guessing game where players read disguised historical company scenarios, decide whether to go long, short, or pass, select a confidence level, and see how much fictional money they would have made or lost after the real company and outcome are revealed.

The product sits at the intersection of casual games, trivia, fantasy sports, and market history. It is not a brokerage tool, trading simulator, or financial advice app.

The initial business goal is to build a strong MVP that proves the core game loop is fun, repeatable, and shareable. Monetization should be designed for later, but not implemented before the product has evidence of retention.

## Vision

Create a replayable market-history game that makes business history, investing instincts, and hindsight bias fun to test.

## Mission

Help players discover whether they can find the signal through the noise by making fast, entertaining calls on real historical market scenarios.

## Core Value Proposition

Players get:

- Quick market-history challenges.
- The thrill of making a call with incomplete information.
- Satisfying company reveals.
- Bankroll-based scoring.
- Leaderboards.
- Daily challenges.
- Friend competition later.
- Fun facts and trivia without finance lectures.

## Market Position

Signal or Noise? should be positioned as:

```text
A daily market-history guessing game.
```

Not as:

```text
A stock trading app.
```

The game can borrow engagement patterns from Wordle, fantasy sports, trivia apps, and daily challenge games without adopting the complexity or regulatory feel of financial products.

## Target Users

### Primary Segment

Casual competitive players who enjoy:

- Wordle-style games
- Trivia
- Fantasy sports
- Leaderboards
- Social comparison
- Quick mobile sessions
- Daily streaks

### Secondary Segment

Gamers and finance-curious adults who enjoy:

- Market history
- Famous companies
- Business stories
- Prediction games
- Friendly competition

### Future Segment

Students, kids, and classrooms.

This audience should be considered in design choices, but not used as the main MVP positioning. Education should remain light, trivia-oriented, and optional.

## Customer Problems

Players may want:

- A quick game that feels smarter than generic mobile games.
- A competitive daily challenge.
- A way to test business instincts without risking money.
- A fun way to learn market history.
- A game they can compare with friends.
- A game that has enough depth to stay interesting.

## Product Differentiation

Signal or Noise? is different because:

- It hides the company identity.
- It uses real historical market outcomes.
- It turns hindsight into gameplay.
- It uses bankroll and confidence instead of abstract trivia points.
- It has a reveal moment after each round.
- It avoids finance-dashboard UX.
- It can support both casual and competitive play.

## Business Model Strategy

Monetization should be future-focused during MVP. The first milestone is retention and replayability.

Potential monetization paths:

### 1. Paid Full Game

Users can buy the full app on mobile app stores or web.

Possible structure:

- Free trial
- Limited free mode
- Paid unlock
- One-time purchase

### 2. Paid Content Packs

Players can buy more scenario content.

Examples:

- Famous Market Crashes
- Dot-Com Era Pack
- Financial Crisis Pack
- Pandemic Winners and Losers
- Big Tech Pack
- Meme Stock Era Pack
- Retail Giants Pack
- Forgotten Winners Pack

### 3. Era Packs

A specific type of content pack centered around market eras.

The MVP already targets 10 famous market eras, so the content structure should support paid era expansions later.

### 4. Cosmetics

Cosmetic profile items that do not affect score.

Examples:

- Profile badges
- Leaderboard frames
- Avatar themes
- Victory screen styles
- Streak badges
- Era-themed collectibles

### 5. Ad-Supported and Premium Ad-Free Tier

Possible later model:

- Free users see ads between runs or after daily challenge.
- Paid users remove ads.
- Ads must not disrupt round decisions or reveal quality.

### 6. Season Pass

Possible later model:

- Monthly or seasonal subscription
- Includes new scenario packs
- Premium cosmetics
- advanced stats
- private leagues
- season leaderboard access
- archive access

This should be handled carefully to avoid pay-to-win mechanics.

### 7. Advanced Stats

Premium feature candidate:

- Performance by sector
- Performance by difficulty
- Long vs short accuracy
- Confidence calibration
- Best/worst eras
- Risk-adjusted stats
- Scenario archive analysis

## Monetization Principles

Do:

- Charge for content, cosmetics, advanced stats, and optional premium modes.
- Preserve fair leaderboards.
- Keep free/trial version fun enough to convert.
- Keep paid offerings additive.

Do not:

- Sell score boosts.
- Sell better clues in leaderboard-eligible modes.
- Sell retries for official Daily Challenge.
- Sell anything that creates pay-to-win leaderboards.
- Use language that makes the product sound like gambling or investing advice.

## Pricing Strategy Placeholder

Pricing should be tested after retention exists.

Potential future pricing models:

```text
Free trial + paid full unlock
Free daily challenge + paid content packs
Free core game + premium subscription
One-time paid app + optional packs
Ad-supported free + premium ad-free
```

Recommended starting assumption:

```text
Launch with a generous free/trial experience, then monetize content packs and/or a full-game unlock.
```

## MVP Cost Notes

The app can likely be prototyped with free or low-cost infrastructure, but pricing must be verified before production.

As of July 2026:

- Vercel lists a free Hobby tier and Pro starting at $20/month.
- Supabase lists a free plan and Pro at $25/month.
- Clerk lists free usage up to 50,000 monthly retained users and Pro starting at $20/month.
- Neon lists a free tier and Launch usage-based pricing, with typical spend examples around $15/month.

These are planning assumptions, not budget guarantees. Check current provider pricing before committing to production.

## Go-To-Market Strategy

### Early Private Testing

Test with:

- Friends
- Gamers
- Trivia players
- Fantasy sports players
- Finance-curious users
- Developer/product communities

Goal:

- Validate whether people want to play more than one run.
- Validate whether the reveal is satisfying.
- Validate whether the bankroll/confidence system is understandable.
- Validate whether users share results.

### Public MVP

Launch as:

```text
A daily market-history guessing game.
```

Public messaging should emphasize:

- Daily challenge
- Hidden company reveal
- Leaderboards
- Bankroll score
- Fun market-history scenarios

### Social Sharing

Future share card:

```text
Signal or Noise?
Daily Challenge

Final Bankroll: $14,820
Signal Score: +11
Correct Calls: 7/10
Best Call: +$2,400
Can you beat my run?
```

### Content Marketing

Possible channels:

- TikTok/YouTube Shorts reveal clips
- “Could you have spotted this winner?”
- Daily challenge posts
- Market-history trivia threads
- Famous company hindsight breakdowns
- Finance/gaming crossover content

## Competitive Landscape

The app competes broadly with:

- Daily puzzle games
- Trivia apps
- Fantasy sports
- Stock simulators
- Market education apps
- Casual mobile games

Its advantage is the combination of:

- Historical market truth
- Hidden company identity
- Fast prediction gameplay
- Bankroll scoring
- Reveal-driven satisfaction

## Key Risks

### 1. Content Quality Risk

Bad scenario cards will make the game feel random or unfair.

Mitigation:

- Use schema-driven AI generation.
- Include sources.
- Human review cards.
- Playtest difficulty.
- Keep reveal short and clear.

### 2. Game Balance Risk

All-In and high confidence may dominate or create frustrating wipeouts.

Mitigation:

- Start with defined confidence percentages.
- Track balance metrics.
- Tune bankroll, round count, returns, and Signal Score.
- Consider difficulty-specific bankroll.

### 3. Product Identity Risk

The app could look too much like a finance tool.

Mitigation:

- Game-first UI.
- Avoid brokerage language.
- Avoid finance dashboard layout.
- Avoid dense technical charting.

### 4. Regulatory/Trust Risk

Users may confuse the game with investing advice.

Mitigation:

- Strong disclaimers.
- Entertainment framing.
- Historical data only for MVP.
- No real-money trading.
- No live stock recommendations.

### 5. Retention Risk

Users may enjoy one run but not return.

Mitigation:

- Daily Challenge.
- Streaks.
- Leaderboards.
- Scenario packs.
- Shareable results.
- Friend challenges later.

## Success Metrics

### Prototype Metrics

- Percent of testers who finish a 20-round run.
- Average rounds played per session.
- Percent who start a second run.
- Comprehension of scoring.
- Enjoyment of reveal.
- Reported likelihood to share.

### MVP Metrics

- Daily active users.
- Daily Challenge completion rate.
- Guest-to-account conversion.
- Average runs per user.
- Retention after day 1, day 7, day 30.
- Leaderboard participation.
- Share-card usage.
- Content pack interest.

### Business Metrics Later

- Free-to-paid conversion.
- Pack purchase rate.
- Subscription conversion.
- Ad revenue per active user.
- Churn.
- Lifetime value.
- Customer acquisition cost.

## Milestones

### Milestone 1: Playable Static Prototype

- Hardcoded scenarios.
- Single-player Classic Run.
- Bankroll math.
- Signal Score.
- Reveal screen.

### Milestone 2: Content-Backed Web MVP

- Scenario seed files.
- Database import.
- User accounts.
- Guest play.
- Profiles.
- Leaderboards.

### Milestone 3: Daily Challenge

- 10-round daily challenge.
- Official attempt system.
- Daily leaderboard.
- Login requirement for score submission.

### Milestone 4: Post-Prototype Improvements

- Smart pass scoring.
- Portfolio Draft.
- Better player stats.
- Mobile app preparation.

### Milestone 5: Expo Mobile App

- Shared game logic.
- Mobile-native experience.
- App store readiness.
