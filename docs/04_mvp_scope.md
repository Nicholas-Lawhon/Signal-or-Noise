# 04 MVP Scope and Implementation Plan — Signal or Noise?

## MVP Goal

Build a mobile-first responsive web app that proves the core game loop:

> Read a disguised historical scenario, make a long/short/pass call, choose confidence, reveal the company, and see bankroll and Signal Score update.

The MVP should prove fun, retention, and clarity before monetization or native mobile development.

## MVP Must-Haves

### Product

- Working title: Signal or Noise?
- Mobile-first responsive web app
- Game-first visual identity
- Single-player Classic Run
- Daily Challenge mode
- Basic accounts and profile
- Guest play
- Login-gated leaderboard submission

### Gameplay

- Curated scenario cards
- Long / Short / Pass decisions
- Confidence levels
- Bankroll scoring
- Signal Score
- Bankruptcy behavior
- End-of-run summary
- Company reveal
- Lookback chart before decision
- Outcome chart after reveal
- Difficulty selection for Classic Run
- Mixed difficulty for Daily Challenge

### Content

- 100 curated scenario cards
- 10 daily challenge pools
- 10 famous market eras
- Each scenario supports Easy, Medium, and Hard variants
- Cards generated as schema-valid JSON seed files
- Source URLs stored for review but not shown to players

### Data

- Scenario card data model
- User model
- Run model
- Round decision model
- Daily challenge model
- Leaderboard model or query strategy
- Player stats aggregation

### Admin/Content

For MVP, a full admin UI is optional. Required minimum:

- Seed JSON format
- Validation script
- Import script
- Ability to mark scenarios as active/inactive
- Ability to assign scenarios to daily challenge pools
- Ability to group scenarios by era/pack

## MVP Should-Haves

- Shareable end-of-run result copy or image placeholder
- Basic theme/design system
- Basic onboarding
- Simple landing page
- Mobile-friendly chart component
- Game rules/help screen
- Disclaimers for entertainment-only historical gameplay
- Error boundaries
- Basic analytics events

## MVP Could-Haves

- Friend code placeholder
- Profile badges placeholder
- Scenario archive placeholder
- Pack/category filter
- Better chart interactions
- Leaderboard filters by difficulty
- Local guest stats before login

## Explicitly Out of Scope for MVP

- Native mobile app
- Portfolio Draft mode
- Friend challenges
- Private leagues
- Public matchmaking
- Smart pass scoring
- Optional clue reveals
- Paid monetization
- Ads
- Season pass
- Real-money trading
- Options
- Leverage
- Broker integrations
- Dynamic AI generation in production
- ETFs, indexes, crypto, commodities
- Classroom mode
- Multi-tone reveal system

## Implementation Phases

### Phase 0: Project Setup and Documentation

Deliverables:

- Repository setup
- Monorepo structure
- Agent documentation
- Development workflow
- Environment variable examples
- Code style rules
- Initial README
- Planning docs in `/docs`

Important note:

The user will have agents create agent-specific files such as AGENTS.md, .clinerules, roadmap.md, and progress.md. The implementation plan should explicitly instruct the coding agent to create these.

### Phase 1: Static Web Prototype

Goal:

A playable Classic Run using hardcoded local scenario data.

Features:

- Landing page
- Start Classic Run
- Scenario card
- Lookback chart placeholder or static chart data
- Long / Short / Pass
- Confidence selector
- Bankroll calculation
- Signal Score calculation
- Reveal screen
- Next round
- End-of-run summary
- Bankruptcy handling

No database required yet.

### Phase 2: Scenario Schema and Seed System

Goal:

Replace hardcoded scenarios with validated JSON scenario cards.

Features:

- Scenario JSON schema
- Scenario validation script
- Seed file structure
- Import-ready content format
- 5–10 test scenario cards
- Difficulty variants
- Source URL fields
- Era/pack metadata

### Phase 3: Database-Backed MVP Foundation

Goal:

Persist scenarios, runs, round decisions, users, and stats.

Features:

- PostgreSQL
- Prisma schema
- Scenario import script
- User model
- Guest session strategy
- Run model
- Round decision model
- Stats aggregation
- Basic profile page

### Phase 4: Auth and Leaderboards

Goal:

Allow optional login and leaderboard submission.

Features:

- Auth provider integration
- Guest play
- Login required for leaderboard submission
- Best Classic Run leaderboard
- All-time Signal Score leaderboard
- Profile stats
- Score submission rules

### Phase 5: Daily Challenge

Goal:

Implement the main retention loop.

Features:

- Daily challenge schedule
- 10-round daily challenge
- Official attempt enforcement
- Daily leaderboard
- Logged-in user submission
- Guest play without leaderboard submission
- Daily Challenge end summary
- Mixed difficulty logic

### Phase 6: Content Expansion to MVP Target

Goal:

Reach 100 curated scenario cards.

Features:

- AI-assisted scenario generation workflow
- Human review workflow
- 100 scenario cards
- 10 daily challenge pools
- 10 famous market eras
- Scenario quality checklist
- Difficulty tuning pass

### Phase 7: MVP Polish

Goal:

Make the product feel like a real game, not a rough prototype.

Features:

- Mobile-first UI polish
- Reveal animations
- Better chart visuals
- Loading states
- Empty states
- Error states
- Settings/help/disclaimer pages
- Basic analytics
- Accessibility pass
- Performance pass
- QA checklist

## Immediate Post-Prototype Priorities

Before native mobile app:

1. Smart pass scoring.
2. Portfolio Draft mode.
3. Improved stats and leaderboard filters.
4. Better chart interactivity.
5. Shared package cleanup for Expo readiness.

## Immediate Post-MVP Priorities

After MVP:

1. Expo mobile app.
2. Friend challenges.
3. Private leagues.
4. More content packs.
5. Shareable result cards.
6. Paid content experiments.
7. Cosmetic profile items.
8. Advanced stats.

## Starting Bankroll Rules

Starting bankroll should be configurable by game mode and difficulty.

Recommended defaults:

```text
Classic Easy: $12,500
Classic Medium: $10,000
Classic Hard: $7,500

Daily Challenge: $10,000 unless configured otherwise
```

This can be tuned later.

## Confidence Rules

```text
Low = 10% of current bankroll
Medium = 40% of current bankroll
High = 70% of current bankroll
All-In = 100% of current bankroll
```

Each button must display:

- Confidence name
- Percentage
- Dollar amount based on current bankroll

Example:

```text
Low
10%
$1,000
```

## Bankroll Rules

- Bankroll is the primary score.
- Bankroll cannot go below $0.
- If bankroll hits $0, the run ends.
- The run score is logged.
- The user can start a new game in any available mode.

## Signal Score Rules

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

Signal Score is meaningful, tracked, and leaderboard-supported, but not the main game score.

## Daily Challenge Rules

- 10 rounds.
- Same scenarios for everyone.
- One official attempt per logged-in user per day.
- Guests can play but cannot submit to leaderboard.
- Leaderboard primary ranking: final bankroll.
- Tiebreakers:
  1. Higher Signal Score
  2. More correct calls
  3. Fewer passes
  4. Earlier completion time, if needed

## Classic Run Rules

- Difficulty-configured length: Easy 10 rounds, Medium 15 rounds, Hard 20 rounds.
- Player chooses difficulty.
- Starting bankroll depends on difficulty.
- Player may abandon/restart.
- Official logged-in runs are saved.
- Best run bankroll appears on leaderboard.
- Practice/guest runs can be played freely.

## MVP Acceptance Criteria

The MVP is ready for broader testing when:

- A user can play a full Classic Run on mobile web at the selected difficulty length.
- A user can complete a 10-round Daily Challenge.
- Bankroll math is correct.
- Signal Score math is correct.
- Bankruptcy works.
- Pass behavior works.
- Lookback chart does not reveal outcome.
- Outcome reveal works.
- Leaderboards work for logged-in users.
- Guest users can play without signup.
- Guest users are prompted to log in before leaderboard submission.
- Scenario cards load from validated seed/database content.
- At least 100 scenario cards exist and pass validation.
- Basic profile stats work.
- The UI feels game-like and mobile-first.
