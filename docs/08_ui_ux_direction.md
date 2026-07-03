# 08 UI/UX Direction — Signal or Noise?

## Design Goal

Signal or Noise? should feel like a polished mobile-first game, not a fintech dashboard.

The app should be:

- Fast
- Responsive
- Interactive
- Modern
- Game-like
- Clear
- Confident
- Not generic
- Not AI-generated slop
- Not Robinhood-like
- Not a stock terminal

## Brand Feel

Signal or Noise? should feel like:

```text
Market mystery
Daily challenge
Smart trivia
Competitive reveal game
```

It should not feel like:

```text
Brokerage app
Trading platform
Finance dashboard
Spreadsheet
Generic SaaS template
```

## Design Principles

### 1. Cards Drive the Game

The scenario card is the core UI object. It should feel like the “question” in a trivia game.

### 2. Reveal Is the Reward

The reveal screen should be satisfying. It should create the “oh wow” moment.

### 3. Bankroll Is Always Visible

The player should always know:

- Current bankroll
- Current round
- Current Signal Score
- Current decision state

### 4. Confidence Must Be Obvious

Confidence buttons must show:

- Label
- Percentage
- Dollar stake
- Risk intensity

Example:

```text
Low
10%
$1,000
```

### 5. Mobile First

Every screen should be designed for phone width first.

Desktop can enhance the layout, but mobile is the primary experience.

### 6. No Dense Finance UI

Avoid:

- Watchlists
- Ticker rows
- Order-book styling
- Brokerage dashboards
- Too many financial metrics
- Complex chart toolbars

Charts should support gameplay, not dominate the UI.

## Core Screens

### 1. Landing Page

Purpose:

- Explain concept quickly.
- Get user into game.

Content:

- Logo/name
- Primary tagline
- Short product explanation
- Play button
- Daily challenge button
- Login/account button
- Simple preview of scenario card

Example copy:

```text
Signal or Noise?

Can you find the signal through the noise?

Read a disguised market scenario, make the call, and see if you could have spotted the winner before the reveal.
```

### 2. Mode Select

Modes:

- Classic Run
- Daily Challenge
- Portfolio Draft, disabled/coming soon

Classic Run card:

```text
20 rounds
Choose difficulty
Build your bankroll
```

Daily Challenge card:

```text
10 rounds
Same challenge for everyone
Climb today’s leaderboard
```

### 3. Classic Run Setup

Player chooses:

- Difficulty: Easy / Medium / Hard
- Era/pack, if available
- Start button

Show configured starting bankroll.

Example:

```text
Medium Run
20 rounds
Starting bankroll: $10,000
```

### 4. Scenario Card Screen

This is the most important screen.

Mobile layout:

```text
Top Bar:
Signal or Noise?
Round 4/20
Bankroll: $10,850
Signal Score: +3

Scenario Card:
Era
Decision date
Holding period
Sector/industry clue
Company description
Macro context
Lookback chart
Three clues

Decision:
Long / Short / Pass

Confidence:
Low / Medium / High / All-In

Submit
```

Important:

- Company name and ticker must be hidden.
- The chart must be a lookback chart only.
- The outcome period must not be revealed through the chart.

### 5. Decision Controls

Decision buttons:

```text
Long
Short
Pass
```

Confidence buttons:

```text
Low
10%
$1,085

Medium
40%
$4,340

High
70%
$7,595

All-In
100%
$10,850
```

Color coding:

- Use color as reinforcement, not the only indicator.
- Low should feel safe.
- Medium should feel balanced.
- High should feel risky.
- All-In should feel dramatic.

Do not overuse red/green in ways that imply brokerage trading. The visual language should feel game-like.

### 6. Reveal Screen

Reveal should be energetic and clear.

Content:

```text
That was Netflix.

Ticker: NFLX
Period: Jan 2012 to Jan 2017
Actual return: +1,135.6%

Your call: Long
Confidence: Medium
Stake: $4,000
Gain: +$45,422
New bankroll: $55,422
Signal Score: +2

The market was skeptical, but streaming adoption exploded.
```

Show the outcome chart here.

Possible reveal components:

- Big company reveal
- Outcome chart
- Gain/loss animation
- Bankroll update animation
- Signal Score update
- Fun fact
- Next round button

### 7. End-of-Run Summary

Content:

```text
Final Bankroll: $18,450
Signal Score: +9
Correct Calls: 13
Wrong Calls: 5
Passes: 2
Best Trade: +$4,200
Worst Trade: -$2,800
```

Actions:

- Play again
- Try Daily Challenge
- View leaderboard
- Login/save score, if guest

### 8. Daily Challenge Leaderboard

Primary ranking:

- Final bankroll

Secondary display:

- Signal Score
- Correct calls
- Passes
- Completion time, if needed

Mobile layout should be compact:

```text
#1  PlayerName    $18,450   +9
#2  PlayerName    $16,220   +8
#3  PlayerName    $14,900   +11
```

### 9. Profile

Show:

- Display name
- Best run bankroll
- Total Signal Score
- Runs completed
- Correct calls
- Wrong calls
- Passes
- Best streak
- Daily Challenge stats

Keep profile visually simple but satisfying.

## Navigation

Initial navigation:

- Play
- Daily
- Leaderboards
- Profile
- Rules

On mobile, use either:

- Bottom tab navigation
- Simple header + mode cards

Bottom nav is likely better once the product has more screens.

## Visual Direction

Potential aesthetic:

- Dark, high-contrast game surface
- Clean card panels
- Subtle glow or signal/noise motif
- Chart lines as clues, not finance dashboard elements
- Bold typography for bankroll/reveal
- Minimal iconography
- Smooth card transitions

Avoid:

- Generic purple/blue gradients everywhere
- Overly corporate fintech colors
- Excessive glassmorphism
- Bland AI-app look
- Meme-stock chaos
- Fake trading terminal styling

## Motion and Interaction

Useful animations:

- Card slide to next round
- Decision button lock-in
- Reveal flip or reveal wipe
- Bankroll count-up/count-down
- Signal Score pulse
- Leaderboard rank movement
- End-of-run summary reveal

Keep animations short and responsive.

Reduced motion setting should be respected if implemented.

## Round Flow Wireframe

```text
------------------------------------------------
| Signal or Noise?       Round 3/20    $10,850 |
| Signal Score: +3                              |
------------------------------------------------

[Era]
Post-financial-crisis tech expansion

[Hidden Company]
A U.S. entertainment company with a recurring
revenue model and a controversial strategic shift.

[Macro Context]
Broadband adoption is rising while consumer tech
platforms are becoming more important.

[Lookback Chart]
       /\      /\
  ____/  \____/  \___

[Clues]
1. The company is moving from a legacy model.
2. Recent decisions damaged investor trust.
3. Upside depends on recurring customer growth.

[Make the Call]
[ Long ] [ Short ] [ Pass ]

[Confidence]
[Low 10% $1,085]
[Medium 40% $4,340]
[High 70% $7,595]
[All-In 100% $10,850]

[ Lock In ]
------------------------------------------------
```

## Reveal Wireframe

```text
------------------------------------------------
| Reveal                                       |
------------------------------------------------

That was Netflix.

NFLX
Jan 2012 → Jan 2017
Actual return: +1,135.6%

[Outcome Chart]
    / 
   /
  /
_/

Your call: Long
Confidence: Medium
Stake: $4,000
Gain: +$45,422
New bankroll: $55,422

Signal Score: +2

The market was skeptical, but streaming adoption
exploded.

[Next Round]
------------------------------------------------
```

## Copy Guidelines

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

- “Place bet” in primary UI
- “Trade recommendation”
- “Investment advice”
- “Buy this”
- “Sell this”
- “Guaranteed”
- “Profit strategy”
- “Real trading”

## Accessibility Guidelines

- Buttons must have visible labels.
- Do not rely on color alone.
- Use accessible contrast.
- Make touch targets large.
- Avoid tiny chart-only information.
- Provide text summaries for important results.
- Allow gameplay without drag/swipe gestures.
- Keep animations short.

## MVP UI Priorities

Highest priority:

1. Scenario card clarity.
2. Confidence selector clarity.
3. Reveal satisfaction.
4. Mobile usability.
5. Bankroll math visibility.
6. Leaderboard readability.

Lower priority for MVP:

- Full design system
- Cosmetics
- Complex profile pages
- Advanced chart interactions
- Multi-theme support
- Multi-tone reveal settings

## Design Quality Bar

The UI should be considered good enough when a tester can say:

- “I understand what to do.”
- “This feels like a real game.”
- “The reveal is satisfying.”
- “I can play this on my phone.”
- “I want to try another round.”
