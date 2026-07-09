# OpenDesign Generation Prompt

Use this prompt inside OpenDesign after uploading the design pack.

```text
You are designing a polished mobile-first product prototype for Signal or Noise?. Read DESIGN.md first and treat it as the design contract. Then use the project brief, screen flow spec, component inventory, wireframes, interaction spec, content-card visual schema, and design tokens to create a premium interactive prototype.

Product:
Signal or Noise? is a mobile-first market-history guessing game. Players see disguised historical stock-market scenarios, inspect a pre-decision lookback chart, choose Long, Short, or Pass, choose a confidence level tied to their bankroll, lock in the call, and then see the company and outcome revealed.

Core taglines:
Can you find the signal through the noise?
Read the clues. Make the call. Beat the reveal.
Play daily, climb leaderboards, and challenge friends.

Design direction:
Game-first, not finance-product-first. Do not make this look like Robinhood, a brokerage app, a stock terminal, or a generic fintech dashboard. Make it feel like a sharp, modern, replayable mobile game for Wordle, trivia, fantasy sports, and casual competitive players.

Required prototype screens:
1. Landing page.
2. Home / mode select.
3. Classic run setup.
4. Daily challenge setup.
5. Gameplay round card.
6. Decision locked state.
7. Reveal screen.
8. Run summary.
9. Daily challenge summary.
10. Leaderboards.
11. Profile / stats.
12. Login prompt.
13. Settings.

Required gameplay details:
- Classic Run = Easy 10 / Medium 15 / Hard 20 rounds.
- Daily Challenge = 10 rounds.
- Primary score = Bankroll.
- Secondary score = Signal Score.
- Confidence levels:
  - Low = 10% bankroll, Signal Score +/-1.
  - Medium = 40% bankroll, Signal Score +/-2.
  - High = 70% bankroll, Signal Score +/-3.
  - All-In = 100% bankroll, Signal Score +/-5.
- Pass causes no bankroll change but slightly lowers Signal Score.
- Bankrupt at $0 ends the run.
- Pre-decision chart must show only lookback data, not outcome data.
- Outcome chart appears only after reveal.
- Difficulty: Easy, Medium, Hard.

Design requirements:
- Mobile-first, desktop-responsive.
- Dark premium game UI.
- Card-based gameplay.
- Strong visual distinction between hidden scenario and reveal state.
- Confidence buttons must show label, percentage, calculated dollar amount, and Signal Score impact.
- Long, Short, and Pass must feel equally deliberate.
- Leaderboards should support Daily Challenge, Best Classic Runs, All-Time Signal Score, and All-Time Stats.
- Use clean charts, not dense trading terminals.
- Include polished empty/loading/error states where appropriate.

Output:
Create a high-fidelity interactive web prototype with reusable components and design tokens. Include both mobile and desktop responsive states. Prioritize the gameplay round, reveal screen, and leaderboards.
```
