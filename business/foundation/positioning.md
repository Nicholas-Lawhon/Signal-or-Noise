# Growth Foundation: Positioning

**Status:** Internal working artifact; ready for user approval
**Research date:** 2026-07-10 (America/Chicago)
**Scope:** Gate A foundation only. This is not public copy, legal advice, or a
launch commitment.

## Product truth to preserve

Signal or Noise? is a mobile-first web game. A player reads a disguised
historical company scenario, chooses Long, Short, or Pass, selects Confidence,
and reaches a company reveal. Bankroll is fictional game scoring; Signal Score
is the secondary accuracy-and-boldness score. The product is entertainment and
trivia, not a brokerage, trading simulator, gambling product, or source of
financial advice.

The current product supports:

- A public landing page with the locked primary tagline and entertainment
  disclaimer ([landing page](../../apps/web/app/page.tsx)).
- Guest Classic Runs at Easy, Medium, and Hard lengths, with server-backed
  decisions and a reveal after each locked call ([Classic setup](../../apps/web/app/play/classic/page.tsx),
  [run client](../../apps/web/app/play/classic/run/page.tsx)).
- An authenticated Daily Challenge with ten mixed-difficulty rounds, one
  shared ordered challenge per UTC date, resume, and replay ([Daily entry](../../apps/web/app/play/daily/page.tsx),
  [Daily service](../../packages/database/src/dailyChallengeService.ts)).
- Official public leaderboards and saved account stats. A guest may explicitly
  save one completed Classic Run after signing in ([leaderboard service](../../packages/database/src/leaderboardService.ts),
  [run service](../../packages/database/src/runService.ts)).

There is no current Premium Unlock, paywall, mobile app release, share-card
flow, support contact, privacy page, terms page, or analytics instrumentation.
Those are downstream requirements, not present-tense claims.

## Single positioning statement

**Signal or Noise? is a fast, mobile-first daily market-history guessing game:
read a disguised historical company scenario, make the Long, Short, or Pass
call, and beat the reveal with fictional Bankroll and Signal Score.**

Recommended short descriptor: **A daily market-history guessing game.**

Locked brand lines remain:

- **Primary:** Can you find the signal through the noise?
- **Secondary:** Read the clues. Make the call. Beat the reveal.
- **Feature line:** Play daily, climb leaderboards, and challenge friends.

The feature line includes a future friend-challenge capability. Use it only as
roadmap language until that feature exists; current acquisition copy may use
“Play daily” and “climb leaderboards.”

## Message hierarchy

| Priority | Message | Proof or product expression | Copy guardrail |
|---|---|---|---|
| 1. Core promise | Find the signal through the noise. | The hidden-company scenario and reveal loop. | Keep it game-like; do not imply future prediction. |
| 2. Immediate loop | Read the clues. Make the call. Beat the reveal. | Pre-decision card, Long/Short/Pass, reveal screen. | Never reveal the answer before the call. |
| 3. Differentiation | Real historical market scenarios, hidden companies, and hindsight made playable. | Human-reviewed scenario catalog and server-calculated outcome. | Say “historical,” never “live signals” or “actionable picks.” |
| 4. Scoring | Build a fictional Bankroll and Signal Score with Confidence. | Confidence buttons show percentage and stake; run summary shows both scores. | “Score” and “game bankroll,” never money-making or investment language. |
| 5. Habit and competition | Play a ten-round Daily Challenge and compare official results. | Authenticated Daily Challenge and public leaderboards are live. | Do not promise streaks, friend challenges, or sharing unless shipped. |
| 6. Safety | Entertainment and trivia using historical scenarios. | Current landing-page disclaimer. | Repeat the disclaimer on acquisition surfaces that could be mistaken for finance content. |

## Audience and persona briefs

### P1 — Daily-puzzle player (primary acquisition wedge)

- **Pattern:** Enjoys Wordle-style daily rituals, trivia, quick mobile sessions,
  streaks, or light competition. Finance knowledge is optional.
- **Job to be done:** “Give me a short, satisfying challenge I can finish and
  compare without studying a market.”
- **Hook:** A hidden company, a balanced clue card, one decisive call, and a
  fast reveal.
- **Proof needed:** A short demo of the card-to-reveal loop; clear round count;
  no account requirement for Classic.
- **Likely friction:** “I do not know stocks.” Answer with “You do not need a
  finance background; read the scenario and make the call.” Do not promise
  that every scenario is easy.
- **Message to test:** “Could you spot the company before the reveal?”

### P2 — Finance-curious gamer (first reachable secondary wedge)

- **Pattern:** Likes company stories, market history, fantasy sports, prediction
  games, or friendly leaderboard competition, but does not want to risk money.
- **Job to be done:** “Let me test my read on famous business moments without
  opening a brokerage account.”
- **Hook:** Historical truth plus confidence-based game scoring and a satisfying
  reveal.
- **Proof needed:** The scenario is historical, the call is fictional, the
  reveal explains what happened, and the product does not provide advice.
- **Likely friction:** “Is this trading, betting, or a stock recommendation?”
  Answer plainly: it is a game using historical scenarios for entertainment and
  trivia; it has no real-money trading.
- **Message to test:** “Your market instinct is on trial. The outcome is already
  history.” Keep “instinct” in research copy only if the disclaimer remains
  adjacent; do not use “beat the market.”

### P3 — Trivia and business-history player (adjacent expansion)

- **Pattern:** Enjoys famous companies, business stories, quizzes, and facts.
- **Job to be done:** “Turn a business-history story into a quick game I can
  replay.”
- **Hook:** Hidden identity, recognizable eras, fun facts, and reveal-driven
  learning without a finance lecture.
- **Proof needed:** Scenario quality and short reveal copy. Validate in private
  testing before making learning claims.
- **Likely friction:** Concern that a wrong call means the game is random. Show
  the balanced Long/Short case and consistent scoring rules.

### Control segment for research

The less-finance-oriented control is defined in
[tester-recruitment.md](tester-recruitment.md), not as a public persona. It
tests whether the game works as a puzzle when market familiarity is low.

## Claims guardrails

Use now when the surrounding page is accurate:

- “A daily market-history guessing game.”
- “Read a disguised historical scenario and make the Long, Short, or Pass call.”
- “Build a fictional Bankroll and Signal Score.”
- “Classic Run is open to guests.”
- “Daily Challenge uses the same ten-round challenge for everyone that day;
  sign-in is required for official play.”
- “Climb public leaderboards.”
- “Entertainment and trivia; not financial advice, investment recommendations,
  or real-money trading.”

Do not use:

- “Predict the market,” “beat the market,” “find winning stocks,” “buy/sell
  recommendation,” “investment strategy,” or any promise of returns.
- “Live,” “real-time,” or “actionable” signals. The scenarios are historical.
- “Trade,” “bet,” or “place a bet” in primary UI or acquisition copy when
  “make the call” or “play” is accurate.
- “Risk-free investing,” “practice trading,” “portfolio,” or “paper trading.”
- Claims about Premium, iOS, Android, friend challenges, share cards, paid
  packs, release dates, prices, tester counts, or legal clearance.

Open approval items are collected once in the decision table in
[legal-support-readiness.md](legal-support-readiness.md); this document does
not duplicate that table.

## Ranked channel hypotheses

These are learning hypotheses, not permission to publish, contact, recruit, or
spend.

| Rank | Channel hypothesis | Daily-puzzle angle | Finance-curious angle | First signal | Main constraint |
|---|---|---|---|---|---|
| 1 | Short-form video: YouTube Shorts and TikTok | A 15–30 second “hidden company → call → reveal” loop can earn qualified play intent. | A surprising historical outcome can attract viewers who like business stories without presenting a live pick. | Tagged landing visits, mode views, Classic starts, and first reveal rate by creative. | Avoid price/return language, ticker visuals, and public claims until the brand and copy are approved. |
| 2 | Search and evergreen web pages | Queries such as “daily puzzle” and “company history quiz” can bring high-intent visitors to the playable web product. | Queries about famous market moments can bring history-curious visitors who want a game, not advice. | Organic landing visits and play-start rate by page/query theme. | The current landing page is minimal; SEO pages require a separate website charter. |
| 3 | Reddit and other community spaces | Puzzle, trivia, and gaming communities may respond to a challenge prompt or playable example. | Business-history and finance-curious communities may value a reveal explanation. | Qualified screener starts or play starts after a community-compliant link. | No unsolicited outreach or promotion; each community’s rules and moderator norms govern. |
| 4 | Creator/community partnerships | Puzzle and trivia creators can demonstrate the loop in a trusted voice. | Business-history or fantasy-sports creators can frame it as a competitive game. | Tagged referred sessions, first reveal, and tester-quality rate. | Requires approved outreach, claims, terms, and contact workflow; do not contact anyone in Gate A. |
| 5 | Waitlist/email | A low-pressure “get the next challenge” prompt can test return intent. | A short history teaser can test whether people want more scenarios. | Consent-based signups and follow-up completion. | No support email, privacy notice, or email workflow exists yet; defer until decisions [D-04] and [D-05]. |

### Hypothesis decision rule

Prefer a channel only when it produces qualified first reveals and repeat intent,
not raw clicks. A channel is not ready for launch approval if its creative makes
the game look like investing, gambling, or a live recommendation product.
