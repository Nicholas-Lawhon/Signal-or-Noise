# Signal or Noise? — Desktop Wireframes

Desktop should preserve the mobile-first game loop while using available width for context and stats.

## Desktop Gameplay Layout

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Signal or Noise?     Play     Daily     Leaderboards     Profile     │
├──────────────────────────────────────────────────────────────────────┤
│ Classic Run · Round 7 of 15                                           │
│ Bankroll $10,850 · Signal Score +4                                    │
├──────────────────────────────────────────────┬───────────────────────┤
│ Scenario Card                                │ Decision Panel        │
│                                              │                       │
│ Hidden Company                               │ Make the Call         │
│ Decision Date: Jan 2012                      │ [Long] [Short] [Pass] │
│ Holding Period: 5 years                      │                       │
│ Difficulty: Medium                           │ Confidence            │
│                                              │ [Low]    10% $1,085   │
│ Lookback Chart                               │ [Medium] 40% $4,340   │
│ ┌──────────────────────────────────────────┐ │ [High]   70% $7,595   │
│ │        ╱╲__╱╲____╱╲                     │ │ [All-In]100% $10,850  │
│ │ _____╱            ╲____                 │ │                       │
│ └──────────────────────────────────────────┘ │ [Lock In Call]        │
│                                              │                       │
│ Market Climate                              │ Run Snapshot          │
│ Low rates, digital adoption, recovering     │ Correct: 4            │
│ risk appetite.                              │ Wrong: 2              │
│                                              │ Passes: 0             │
│ Hidden Company                              │ Streak: 2             │
│ Consumer-facing media business attempting   │                       │
│ a major distribution shift.                 │                       │
│                                              │                       │
│ Clues                                        │                       │
│ 1. Legacy model still matters.              │                       │
│ 2. Digital shift is the real bet.           │                       │
│ 3. Market trust is damaged.                 │                       │
└──────────────────────────────────────────────┴───────────────────────┘
```

## Desktop Reveal Layout

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Reveal: Netflix                                                      │
├──────────────────────────────────────────────┬───────────────────────┤
│ Outcome Chart                                │ Result                │
│ ┌──────────────────────────────────────────┐ │ Your Call: Long       │
│ │                  ╱╱╱╱╱╱╱                │ │ Confidence: Medium    │
│ │ _____________╱╱╱                         │ │ Amount: $4,340        │
│ └──────────────────────────────────────────┘ │ Actual Return: +1,135%│
│ 2012                                  2017   │ Gain: +$49,259        │
│                                              │ New Bankroll: $60,109 │
│ That was Netflix. The market was skeptical, │ Signal Score: +2      │
│ but streaming adoption exploded.             │                       │
│                                              │ [Next Round]          │
└──────────────────────────────────────────────┴───────────────────────┘
```

## Desktop Leaderboards Layout

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Leaderboards                                                         │
│ [Daily Challenge] [Best Runs] [Signal Score] [All-Time Stats]        │
├──────────────────────────────────────────────────────────────────────┤
│ Rank │ Player       │ Bankroll │ Signal │ Accuracy │ Mode           │
│ 1    │ AlphaFox     │ $31,420  │ +9     │ 70%      │ Daily          │
│ 2    │ Nick         │ $27,880  │ +7     │ 60%      │ Daily          │
│ 3    │ ChartMage    │ $24,060  │ +4     │ 50%      │ Daily          │
└──────────────────────────────────────────────────────────────────────┘
```
