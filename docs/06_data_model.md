# 06 Data Model — Signal or Noise?

## Data Model Goals

The data model should support:

- Mobile-first web MVP
- Future Expo mobile app
- Shared game logic
- Scenario cards with difficulty variants
- Guest and logged-in users
- Runs
- Daily Challenges
- Round decisions
- Bankroll scoring
- Signal Score
- Leaderboards
- Player profiles
- Content packs and eras
- Future modes like Portfolio Draft

## Core Entities

Recommended core entities:

- User
- GuestSession
- Scenario
- ScenarioVariant
- ScenarioSource
- MarketDataPoint
- GameModeConfig
- Run
- RoundDecision
- DailyChallenge
- LeaderboardEntry
- PlayerStats
- Era
- ContentPack

## Scenario vs Company

Use “Scenario” as the core content unit.

A scenario is a company during a specific historical decision window.

Example:

```text
Netflix, Jan 2012 to Jan 2017
```

This is not the same as a generic Netflix company card.

## Scenario JSON Seed Format

Scenario cards should first be generated as JSON seed files, validated, reviewed, and then imported into the database.

Example structure:

```json
{
  "id": "scenario_netflix_2012_2017",
  "status": "draft",
  "company": {
    "name": "Netflix",
    "ticker": "NFLX",
    "exchange": "NASDAQ",
    "sector": "Communication Services",
    "industry": "Entertainment",
    "country": "United States"
  },
  "scenario": {
    "title": "The Streaming Pivot",
    "decisionDate": "2012-01-03",
    "endDate": "2017-01-03",
    "holdingPeriodLabel": "5 years",
    "eraId": "post_financial_crisis_tech_expansion",
    "contentPackIds": ["mvp_core", "streaming_and_media"],
    "difficultySupported": ["easy", "medium", "hard"]
  },
  "marketData": {
    "startingPrice": 10.32,
    "endingPrice": 127.49,
    "actualReturnPercent": 11.3556,
    "usesSplitAdjustedPrices": true,
    "usesTotalReturn": false,
    "preDecisionChartStartDate": "2009-01-03",
    "preDecisionChartEndDate": "2012-01-03",
    "outcomeChartStartDate": "2012-01-03",
    "outcomeChartEndDate": "2017-01-03"
  },
  "hiddenCard": {
    "easy": {
      "companyDescription": "A subscription entertainment company trying to move from physical media to streaming.",
      "macroContext": "Consumers are increasingly adopting broadband internet and connected devices.",
      "situation": "Can a newer delivery model rebuild trust quickly enough to justify rising content and product spending?",
      "longCase": "If customers accept the newer model, recurring revenue can scale with broadband and connected-device adoption.",
      "shortCase": "A recent trust shock can keep churn elevated while content commitments rise faster than the subscriber base.",
      "setupHints": [
        "The old delivery model still contributes cash, but the newer model is where the growth case lives."
      ]
    },
    "medium": {
      "companyDescription": "A U.S. entertainment company with a recurring-revenue model and a controversial strategic transition.",
      "macroContext": "Broadband adoption is rising while consumer tech platforms are becoming more important.",
      "situation": "Will a strategic transition rebuild the customer base before higher spending pressures the model?",
      "longCase": "A recurring-revenue base could scale if the new delivery model becomes a habit for households.",
      "shortCase": "Customer trust and spending discipline are both under pressure during the transition.",
      "setupHints": []
    },
    "hard": {
      "companyDescription": "A consumer-facing media business attempting a major distribution shift.",
      "macroContext": "Digital consumption habits are changing, but investors are unsure which models will win.",
      "situation": "Will a new distribution model scale fast enough to offset trust and spending pressure?",
      "longCase": "If the model becomes habitual, recurring demand can compound from a much larger household base.",
      "shortCase": "If churn stays elevated, fixed commitments can outrun the customer base before the transition pays off.",
      "setupHints": []
    }
  },
  "reveal": {
    "shortText": "That was Netflix. The market was skeptical, but streaming adoption exploded.",
    "funFact": "The company’s transition looked risky at the time, but it became one of the defining consumer-tech winners of the decade.",
    "whyItMoved": [
      "Streaming adoption accelerated.",
      "Subscriber growth improved.",
      "The company became a stronger platform business over time."
    ]
  },
  "sources": [
    {
      "label": "Historical price source",
      "url": "https://example.com/source",
      "notes": "Used for split-adjusted price validation."
    }
  ],
  "review": {
    "generatedByAi": true,
    "humanReviewed": false,
    "reviewNotes": ""
  }
}
```

## Prisma Model Sketch

This is a conceptual starting point. The coding agent should refine it during implementation.

```prisma
model User {
  id              String   @id @default(cuid())
  authProviderId  String?  @unique
  displayName     String?
  email           String?  @unique
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  runs            Run[]
  roundDecisions  RoundDecision[]
  stats           PlayerStats?
}

model Scenario {
  id                         String   @id
  status                     String   @default("draft")
  title                      String
  companyName                String
  ticker                     String
  exchange                   String?
  sector                     String?
  industry                   String?
  country                    String?
  decisionDate               DateTime
  endDate                    DateTime
  holdingPeriodLabel          String?
  startingPrice              Decimal?
  endingPrice                Decimal?
  actualReturnPercent         Decimal
  usesSplitAdjustedPrices     Boolean  @default(true)
  usesTotalReturn             Boolean  @default(false)
  preDecisionChartStartDate   DateTime
  preDecisionChartEndDate     DateTime
  outcomeChartStartDate       DateTime
  outcomeChartEndDate         DateTime
  eraId                      String?
  createdAt                  DateTime @default(now())
  updatedAt                  DateTime @updatedAt

  variants                   ScenarioVariant[]
  sources                    ScenarioSource[]
  marketDataPoints            MarketDataPoint[]
  roundDecisions              RoundDecision[]
  era                         Era? @relation(fields: [eraId], references: [id])
}

model ScenarioVariant {
  id                 String   @id @default(cuid())
  scenarioId          String
  difficulty          String
  companyDescription  String
  macroContext        String
  situation           String
  longCase            String
  shortCase           String
  setupHints          Json
  revealShortText     String
  funFact             String?
  whyItMoved          Json?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  scenario            Scenario @relation(fields: [scenarioId], references: [id])

  @@unique([scenarioId, difficulty])
}

model ScenarioSource {
  id          String   @id @default(cuid())
  scenarioId  String
  label       String
  url         String
  notes       String?
  createdAt   DateTime @default(now())

  scenario    Scenario @relation(fields: [scenarioId], references: [id])
}

model MarketDataPoint {
  id          String   @id @default(cuid())
  scenarioId  String
  date        DateTime
  price       Decimal
  phase       String

  scenario    Scenario @relation(fields: [scenarioId], references: [id])

  @@index([scenarioId, phase, date])
}

model Run {
  id                String   @id @default(cuid())
  userId             String?
  guestSessionId      String?
  mode               String
  difficulty          String?
  status             String
  startingBankroll    Decimal
  finalBankroll       Decimal?
  currentBankroll     Decimal
  signalScore         Decimal @default(0)
  totalRounds         Int
  completedRounds     Int @default(0)
  startedAt           DateTime @default(now())
  completedAt         DateTime?

  user               User? @relation(fields: [userId], references: [id])
  roundDecisions      RoundDecision[]
}

model RoundDecision {
  id                   String   @id @default(cuid())
  runId                 String
  userId                String?
  scenarioId            String
  roundIndex            Int
  action                String
  confidence            String?
  confidencePercent     Decimal?
  stakeAmount           Decimal?
  bankrollBefore        Decimal
  bankrollAfter         Decimal
  actualReturnPercent   Decimal
  pnlAmount             Decimal
  signalScoreDelta      Decimal
  wasCorrect            Boolean?
  createdAt             DateTime @default(now())

  run                  Run @relation(fields: [runId], references: [id])
  user                 User? @relation(fields: [userId], references: [id])
  scenario             Scenario @relation(fields: [scenarioId], references: [id])
}

model DailyChallenge {
  id              String   @id @default(cuid())
  challengeDate   DateTime @unique
  scenarioIds      Json
  startingBankroll Decimal
  difficultyMix    Json
  createdAt        DateTime @default(now())
}

model LeaderboardEntry {
  id             String   @id @default(cuid())
  userId          String
  runId           String?
  leaderboardType String
  periodKey       String?
  scoreBankroll   Decimal?
  scoreSignal     Decimal?
  metadata        Json?
  createdAt       DateTime @default(now())

  @@index([leaderboardType, periodKey])
}

model PlayerStats {
  id                   String   @id @default(cuid())
  userId                String   @unique
  totalRuns             Int      @default(0)
  completedRuns         Int      @default(0)
  totalRounds           Int      @default(0)
  correctCalls          Int      @default(0)
  wrongCalls            Int      @default(0)
  passes                Int      @default(0)
  totalSignalScore      Decimal  @default(0)
  bestRunBankroll       Decimal?
  averageFinalBankroll  Decimal?
  bestStreak            Int      @default(0)
  currentStreak         Int      @default(0)
  updatedAt             DateTime @updatedAt

  user                  User @relation(fields: [userId], references: [id])
}

model Era {
  id          String   @id
  name        String
  description String?
  scenarios   Scenario[]
}

model ContentPack {
  id          String   @id
  name        String
  description String?
  status      String @default("draft")
  isPaid      Boolean @default(false)
}
```

## Enums

Use TypeScript enums or string unions for game logic.

```ts
export type GameMode = 'classic_run' | 'daily_challenge' | 'portfolio_draft';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type RoundAction = 'long' | 'short' | 'pass';

export type Confidence = 'low' | 'medium' | 'high' | 'all_in';

export type RunStatus = 'in_progress' | 'completed' | 'bankrupt' | 'abandoned';

export type ScenarioStatus = 'draft' | 'reviewed' | 'active' | 'inactive' | 'archived';
```

## Confidence Config

This should live in shared game logic.

```ts
export const CONFIDENCE_CONFIG = {
  low: {
    label: 'Low',
    bankrollPercent: 0.10,
    signalScoreValue: 1,
  },
  medium: {
    label: 'Medium',
    bankrollPercent: 0.40,
    signalScoreValue: 2,
  },
  high: {
    label: 'High',
    bankrollPercent: 0.70,
    signalScoreValue: 3,
  },
  all_in: {
    label: 'All-In',
    bankrollPercent: 1.00,
    signalScoreValue: 5,
  },
} as const;
```

## Scoring Function Sketch

```ts
type ScoreRoundInput = {
  action: 'long' | 'short' | 'pass';
  confidence?: 'low' | 'medium' | 'high' | 'all_in';
  currentBankroll: number;
  actualReturnPercent: number;
};

type ScoreRoundOutput = {
  stakeAmount: number;
  pnlAmount: number;
  newBankroll: number;
  signalScoreDelta: number;
  wasCorrect: boolean | null;
};

export function scoreRound(input: ScoreRoundInput): ScoreRoundOutput {
  if (input.action === 'pass') {
    return {
      stakeAmount: 0,
      pnlAmount: 0,
      newBankroll: input.currentBankroll,
      signalScoreDelta: -0.25,
      wasCorrect: null,
    };
  }

  if (!input.confidence) {
    throw new Error('Confidence is required for long/short actions.');
  }

  const config = CONFIDENCE_CONFIG[input.confidence];
  const stakeAmount = input.currentBankroll * config.bankrollPercent;

  const rawReturn =
    input.action === 'long'
      ? input.actualReturnPercent
      : input.actualReturnPercent * -1;

  const rawPnl = stakeAmount * rawReturn;

  const cappedPnl = Math.max(rawPnl, stakeAmount * -1);
  const newBankroll = Math.max(0, input.currentBankroll + cappedPnl);

  const wasCorrect = rawReturn > 0;
  const signalScoreDelta = wasCorrect
    ? config.signalScoreValue
    : config.signalScoreValue * -1;

  return {
    stakeAmount,
    pnlAmount: cappedPnl,
    newBankroll,
    signalScoreDelta,
    wasCorrect,
  };
}
```

Important note:

`actualReturnPercent` should be a decimal, not a whole percentage.

Example:

```text
+35% = 0.35
-20% = -0.20
```

## Chart Data Requirements

Each scenario should support:

### Pre-Decision Lookback Chart

Visible before the decision.

Fields:

- scenarioId
- date
- price
- phase = `pre_decision`

### Outcome Chart

Visible after reveal.

Fields:

- scenarioId
- date
- price
- phase = `outcome`

The pre-decision chart must end on or before the decision date. It must not show the outcome period.

## Leaderboard Query Strategy

Leaderboards can be materialized through a table or queried from runs. For MVP, a `LeaderboardEntry` table may make implementation simpler.

Leaderboard types:

```text
daily_challenge_bankroll
best_classic_run_bankroll
all_time_signal_score
weekly_bankroll
monthly_bankroll
```

Daily challenge ranking:

1. Final bankroll
2. Signal Score
3. Correct calls
4. Fewer passes
5. Earlier completion time

## Guest Strategy

Guests should be able to play without account creation.

Options:

- Client-side guest ID stored in localStorage
- Server-issued guest session ID
- Hybrid approach

Recommended MVP:

```text
Use a guest session ID stored client-side.
Persist guest run locally first.
Only authenticated users submit official leaderboard scores.
```

If guest converts to account, later migration can attach recent guest run data to the user.

## Content Review Fields

Scenario cards should store:

- generatedByAi
- humanReviewed
- reviewedBy
- reviewedAt
- reviewNotes
- source URLs
- validation status

These are not shown to players.

## Future Data Model Considerations

Later features may need:

- Friend relationships
- Private leagues
- League memberships
- Portfolio Draft selections
- Purchases
- Entitlements
- Cosmetics
- Achievements
- Notifications
- Mobile push tokens
- Classroom/group accounts
- Smart pass scoring metadata
- Paid content pack ownership
