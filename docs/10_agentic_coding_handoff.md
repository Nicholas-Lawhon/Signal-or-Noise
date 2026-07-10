# 10 Agentic Phase Guide — Signal or Noise?

## Purpose

This document preserves broad product-planning context. The numbered phase examples
below are a historical planning snapshot, not an execution queue. Active execution
policy lives in `AGENTS.md`, the authoritative sequence lives in `roadmap.md`, and
the current phase contract lives under `agents/phases/`.

The user plans to use a mix of OpenCode, Claude Code, and Codex, while reviewing work in VS Code.

One high-autonomy Phase Owner should normally implement an entire roadmap phase
without intermediate handoffs or reviews. Internal checkpoints are allowed; the
single independent review occurs when the full phase acceptance criteria pass.

## Project Summary

Signal or Noise? is a mobile-first web game where players are shown disguised historical stock-market scenarios and must decide whether to go long, short, or pass.

Players start each challenge with a fictional bankroll, choose their confidence level, and see how much money they would have made or lost after the company and historical outcome are revealed.

The product is a game, not a finance product.

## Locked Product Decisions

### Name

Signal or Noise?

Use the question mark.

### Taglines

Primary:

```text
Can you find the signal through the noise?
```

Secondary:

```text
Read the clues. Make the call. Beat the reveal.
```

Feature line:

```text
Play daily, climb leaderboards, and challenge friends.
```

### MVP Product Definition

The MVP includes:

- Mobile-first responsive web app
- Single-player Classic Run
- Daily Challenge
- Hidden-company scenario cards
- Long / Short / Pass
- Confidence selector
- Fictional bankroll
- Signal Score
- Company reveal
- Score/bankroll breakdown
- Daily leaderboard
- Basic accounts
- Guest play
- Basic profile
- Curated scenario database
- 40 curated production scenario cards
- 10 daily challenge pools
- 10 famous market eras
- Admin/content seed system

### MVP Exclusions

Do not implement yet:

- Native mobile app
- Real-money trading
- Brokerage connections
- Financial advice
- Options
- Leverage
- True short mechanics
- ETFs/crypto/indexes
- Friend challenges
- Portfolio Draft
- Paid monetization
- Ads
- Dynamic AI-generated production gameplay
- Classroom mode

## Agent Documentation

The repository uses these control files:

```text
AGENTS.md
roadmap.md
progress.md
```

Purpose:

- `AGENTS.md` or `.clinerules`: coding-agent rules and project conventions.
- `soul.md`: product identity, design principles, and boundaries.
- `roadmap.md`: planned phases and phase-level acceptance.
- `progress.md`: compact current implementation status, not a session log.
- `agents/phases/`: one active charter per roadmap phase.
- `agents/phase-closeouts/`: one concise completion artifact per phase.

Claude Code, Codex, T3 Code, and other harnesses follow the same repository rules.
A dedicated phase branch is recommended; a separate worktree is optional and most
useful for parallelism or dirty-checkout isolation.

## Recommended Repository Structure

Use a monorepo because the web app should later share logic with an Expo mobile app.

```text
signal-or-noise/
  apps/
    web/
    mobile/

  packages/
    game-engine/
    content/
    database/
    shared-types/
    ui/

  docs/
    01_product_overview.md
    02_game_design_doc.md
    03_business_plan.md
    04_mvp_scope.md
    05_user_stories.md
    06_data_model.md
    07_technical_architecture.md
    08_ui_ux_direction.md
    09_content_and_round_creation.md
    10_agentic_coding_handoff.md

  .env.example
  README.md
  package.json
  pnpm-workspace.yaml
```

## Recommended Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- PostgreSQL
- Prisma
- Clerk, Supabase Auth, or Auth.js
- Vercel for web hosting
- Supabase or Neon for database
- Expo mobile app later
- Vitest for game-engine tests
- Zod for scenario validation

## Implementation Rule

The roadmap is already sequenced as vertical product phases. Execute the current
phase as one autonomous job, using internal slices only as an implementation
technique. Do not begin later database/auth/UI phases early, and do not create
review/report gates between internal slices.

## Phase 0 — Project Setup

Tasks:

1. Create monorepo.
2. Create Next.js web app.
3. Create `packages/game-engine`.
4. Create `packages/content`.
5. Create docs folder.
6. Add `.env.example`.
7. Add README.
8. Add agent documentation files.
9. Add formatting/linting basics.
10. Add Vitest.

Acceptance criteria:

- App runs locally.
- Game-engine package builds.
- Tests can run.
- Docs are present.
- Agent docs are present.

## Phase 1 — Static Classic Run Prototype

Goal:

A playable 20-round Classic Run using local hardcoded scenario data.

Implement:

- Landing page
- Mode select
- Classic Run setup
- Scenario card
- Lookback chart placeholder
- Long / Short / Pass
- Confidence buttons
- Bankroll scoring
- Signal Score
- Reveal screen
- Next round
- End-of-run summary
- Bankruptcy handling

Use 5–10 local sample scenarios first.

Do not implement auth yet.

Do not implement database yet.

Acceptance criteria:

- User can complete a Classic Run.
- Bankroll updates correctly.
- Signal Score updates correctly.
- Pass applies -0.25 Signal Score.
- All-In can bankrupt player.
- Company reveal works.
- Outcome chart is not visible before decision.

## Phase 2 — Game Engine Package

Move pure logic into `packages/game-engine`.

Required functions:

- calculateStake
- scoreRound
- applyRoundResult
- createRunState
- advanceRun
- isBankrupt
- summarizeRun
- calculateLeaderboardTiebreakers

Core config:

```ts
export const CONFIDENCE_CONFIG = {
  low: { label: 'Low', bankrollPercent: 0.10, signalScoreValue: 1 },
  medium: { label: 'Medium', bankrollPercent: 0.40, signalScoreValue: 2 },
  high: { label: 'High', bankrollPercent: 0.70, signalScoreValue: 3 },
  all_in: { label: 'All-In', bankrollPercent: 1.00, signalScoreValue: 5 },
} as const;
```

Pass rule:

```text
Pass = no bankroll change, -0.25 Signal Score, no streak increase, streak preserved.
```

Test required:

- Correct long
- Wrong long
- Correct short
- Wrong short
- Pass
- All-In win
- All-In loss
- Bankruptcy
- Short loss capped at stake
- Confidence stake calculation

## Phase 3 — Scenario Schema and Content Pipeline

Implement:

- Zod or JSON Schema scenario validator
- Seed file folder
- Scenario type definitions
- Validation script
- Import-ready structure
- 5–10 valid sample scenario JSON files

Scenario rules:

- Every scenario has Easy, Medium, Hard variants.
- Every difficulty has a Balanced Tension variant: `situation`, `longCase`,
  `shortCase`, and setup hints scaled by difficulty.
- Hidden card content must not include company name or ticker.
- Pre-decision chart must not include outcome period.
- Sources are stored but not shown to players.

Acceptance criteria:

- Invalid cards fail validation.
- Valid cards pass validation.
- Web app can load scenario cards from JSON.

## Phase 4 — Database

Implement:

- Prisma schema
- PostgreSQL connection
- Scenario import script
- Run persistence
- RoundDecision persistence
- User/profile tables
- DailyChallenge model
- Leaderboard query/table

Do not trust client-calculated scores for official leaderboard submissions.

Server should calculate official results.

Acceptance criteria:

- Scenarios import into database.
- Run can be created.
- Round decision can be submitted.
- Score is calculated server-side.
- Run can be completed.
- Profile stats can update.

## Phase 5 — Auth and Guest Play

Implement optional login.

Rules:

- Guest can play Classic Run.
- Guest can play Daily Challenge unofficially.
- Login required for leaderboard submission.
- Logged-in user can save runs and stats.

Acceptance criteria:

- Guest has smooth gameplay.
- Logged-in player can save scores.
- Guest sees login prompt after run.
- Guest cannot submit official leaderboard score without login.

## Phase 6 — Leaderboards

Implement MVP leaderboards:

- Daily Challenge Bankroll
- Best Classic Run Bankroll
- All-Time Signal Score

Daily Challenge ranking:

1. Final bankroll
2. Signal Score
3. Correct calls
4. Fewer passes
5. Earlier completion time if needed

Classic Run ranking:

1. Final bankroll
2. Signal Score
3. Completion status
4. Difficulty if using combined leaderboard

Acceptance criteria:

- Leaderboard displays logged-in eligible scores.
- Guest scores are excluded.
- Tiebreakers work.
- Profile links work if profile exists.

## Phase 7 — Daily Challenge

Implement:

- 10-round Daily Challenge.
- Same scenario pool for all users.
- One official attempt per logged-in user per day.
- Guest unofficial play.
- Daily leaderboard.
- Mixed difficulty scenario set.

Acceptance criteria:

- Daily challenge can be completed.
- Official attempt rules work.
- Duplicate official submissions are prevented.
- Guest prompt works.
- Leaderboard updates.

## Phase 8 — Content Expansion

Generate and validate:

- 40 scenario cards (D034; was 100)
- 10 daily challenge pools
- 10 famous market eras

Process:

1. Generate AI-assisted scenario JSON.
2. Validate.
3. Review.
4. Correct.
5. Mark active.
6. Import.

Do not use unreviewed dynamic AI content in production gameplay.

## Phase 9 — MVP Polish

Polish:

- Mobile UI
- Scenario card layout
- Confidence button design
- Reveal animation
- Bankroll count-up/down
- Leaderboards
- Profile stats
- Rules page
- Disclaimer page
- Accessibility
- Performance
- QA

## Core Game Rules

### Classic Run

```text
Easy 10 / Medium 15 / Hard 20 rounds
Difficulty selected by player
Starting bankroll configurable by difficulty
Default: Easy $12,500, Medium $10,000, Hard $7,500
Ends after the configured round count or bankruptcy
```

### Daily Challenge

```text
10 rounds
Same scenario set for everyone
Starting bankroll default $10,000 unless configured
One official attempt per logged-in user per day
Guests can play unofficially
```

### Confidence

```text
Low = 10% bankroll, ±1 Signal Score
Medium = 40% bankroll, ±2 Signal Score
High = 70% bankroll, ±3 Signal Score
All-In = 100% bankroll, ±5 Signal Score
```

### Pass

```text
Bankroll change: $0
Signal Score: -0.25
Counts as completed round
Preserves streak
Does not increase streak
```

### Bankruptcy

```text
If bankroll hits $0, the run ends.
Score is logged.
User can start new game.
```

## Anti-Cheat Rules

Before decision submission, do not send the client:

- Company name
- Ticker
- End price
- Actual return
- Reveal text
- Outcome chart

After decision submission, server returns reveal payload.

For local prototype, this can be relaxed, but database-backed leaderboard mode should protect reveal data.

## UI Direction

Build a game interface, not a finance app.

Required screens:

- Landing
- Mode select
- Classic setup
- Scenario round
- Reveal
- End summary
- Daily challenge
- Leaderboards
- Profile
- Rules
- Disclaimer

Main UI elements:

- Scenario card
- Lookback chart
- Decision buttons
- Confidence buttons
- Bankroll display
- Signal Score display
- Reveal card
- End summary card

## Copy Rules

Use:

- “Make the call”
- “Beat the reveal”
- “Find the signal”
- “Hidden company”
- “Scenario”
- “Bankroll”
- “Confidence”
- “Signal Score”

Avoid:

- “Place bet” in main UI
- “Investment advice”
- “Buy recommendation”
- “Sell recommendation”
- “Profit strategy”
- “Guaranteed”

## Safety and Legal Positioning

This is a historical game for entertainment.

Include disclaimer:

```text
Signal or Noise? is a game using historical market scenarios for entertainment and trivia. It does not provide financial advice, investment recommendations, or real-money trading.
```

## Starting and Closing Current Work

Do not reuse a generic bootstrap prompt or preload all documentation. Start from
`AGENTS.md`, then follow its minimal startup order for the current roadmap phase.
The user approves one concise phase charter; one owner executes it through its full
acceptance suite without intermediate management gates.

When the charter is complete, update only the current state in `progress.md`, write
one concise phase closeout, and request the single phase-boundary review. The
charter's acceptance criteria—not this historical phase sketch—define done.
