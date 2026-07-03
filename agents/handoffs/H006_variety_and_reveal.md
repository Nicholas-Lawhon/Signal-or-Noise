# H006 — Scenario Variety + Clearer Win/Loss Reveal

**Role:** Implementor
**Phase:** 1 (demo-quality enhancement)
**Status:** approved
**Depends on:** **H005 must be complete and committed first** (both touch
`sampleScenarios.ts` and the reveal view — do not run in parallel).
**Estimated scope:** small/medium — paste 6 provided card objects, one shuffle
helper rewrite, one reveal banner.

## Context

Playtest (D020): a 20-round run showed only ~4–5 distinct companies because the
pool has 6 cards and `buildRunScenarioList` cycles them with identical periods. And
the reveal doesn't make win/loss obvious enough. This handoff expands the
placeholder pool to 12, stops early repeats, and adds a prominent win/loss banner.
All still placeholder-grade (D006); Phase 3 replaces it. Do not commit (D012).

## Part A — Add 6 placeholder scenarios (total 12)

In `apps/web/lib/sampleScenarios.ts`, append these six objects to the scenarios
array. **Use this text verbatim** — the hidden-card fields were written to avoid
company name / ticker / founder / product-name leaks (D018); do not "improve" them.
Match the existing `PrototypeScenario` shape exactly (same field order/types).

```ts
{
  id: 'proto_cocacola_2010_2013',
  companyName: 'Coca-Cola',
  ticker: 'KO',
  acceptedNames: ['coca-cola', 'coca cola', 'coke', 'ko'],
  title: 'Steady Pour',
  era: 'Post-financial-crisis recovery',
  decisionDateLabel: 'Jan 2010',
  outcomeLabel: 'Jan 2010 → Jan 2013',
  holdingPeriodLabel: '3 years',
  actualReturnPercent: 0.28,
  companyDescription:
    'A global beverage giant with one of the most recognized product portfolios in the world, known for defensive, steady growth.',
  macroContext:
    'Markets are recovering from the financial crisis. Investors favor stable, dividend-paying consumer names over riskier bets.',
  clues: [
    'The company sells everyday consumer products with strong pricing power and enormous global distribution.',
    'Its appeal is stability and dividends, not explosive growth.',
    'Emerging-market demand is a key part of the long-term story.',
  ],
  revealShortText:
    'That was Coca-Cola. Steady demand and reliable dividends delivered a solid, low-drama gain.',
  funFact:
    'It has raised its dividend every year for over half a century, a favorite of income investors.',
  lookbackPrices: [20, 22, 25, 29, 21, 24, 26, 28],
  outcomePrices: [28, 29, 31, 30, 33, 34, 35, 36],
},
{
  id: 'proto_starbucks_2012_2014',
  companyName: 'Starbucks',
  ticker: 'SBUX',
  acceptedNames: ['starbucks', 'sbux'],
  title: 'Global Caffeine',
  era: 'Post-financial-crisis recovery',
  decisionDateLabel: 'Jan 2012',
  outcomeLabel: 'Jan 2012 → Jan 2014',
  holdingPeriodLabel: '2 years',
  actualReturnPercent: 0.52,
  companyDescription:
    'A premium coffee-and-cafe chain expanding aggressively worldwide with a loyal customer base.',
  macroContext:
    'Consumer spending is rebounding. Premium everyday-luxury brands are gaining traction, especially among younger urban customers.',
  clues: [
    'The company turns an everyday habit into a premium experience.',
    'Store count is growing fast, with big ambitions in Asia.',
    'A mobile app and loyalty program are becoming central to its strategy.',
  ],
  revealShortText:
    'That was Starbucks. Rapid store growth and a booming loyalty program powered a strong two-year run.',
  funFact:
    'Its loyalty program holds billions in prepaid customer balances — more than some banks.',
  lookbackPrices: [14, 16, 12, 18, 20, 22, 23, 24],
  outcomePrices: [24, 27, 29, 31, 33, 34, 36, 36.5],
},
{
  id: 'proto_nvidia_2015_2017',
  companyName: 'Nvidia',
  ticker: 'NVDA',
  acceptedNames: ['nvidia', 'nvda'],
  title: 'The Graphics Gamble',
  era: 'Cloud and AI acceleration',
  decisionDateLabel: 'Jan 2015',
  outcomeLabel: 'Jan 2015 → Jan 2017',
  holdingPeriodLabel: '2 years',
  actualReturnPercent: 2.30,
  companyDescription:
    'A chip designer known for high-performance processors used in gaming, now eyeing new computing markets.',
  macroContext:
    'Demand for parallel-processing hardware is rising as data centers, gaming, and early machine-learning workloads grow.',
  clues: [
    'Its core chips were built for gaming but turn out to be ideal for other heavy workloads.',
    'A new wave of computing demand could expand its market well beyond its origins.',
    'The stock has been volatile as investors debate whether the growth is real.',
  ],
  revealShortText:
    'That was Nvidia. Its gaming chips became the engine of the AI boom, and the stock more than tripled.',
  funFact:
    'Its graphics chips, once aimed at gamers, became the default hardware for training modern AI models.',
  lookbackPrices: [3, 3.5, 4, 4.2, 4, 4.5, 4.8, 5],
  outcomePrices: [5, 6, 7.5, 9, 11, 13, 15, 16.5],
},
{
  id: 'proto_ge_2016_2018',
  companyName: 'General Electric',
  ticker: 'GE',
  acceptedNames: ['general electric', 'ge'],
  title: 'The Conglomerate Cracks',
  era: 'Late-cycle industrial reckoning',
  decisionDateLabel: 'Jan 2016',
  outcomeLabel: 'Jan 2016 → Jan 2018',
  holdingPeriodLabel: '2 years',
  actualReturnPercent: -0.56,
  companyDescription:
    'A sprawling industrial conglomerate spanning power, aviation, and finance, long seen as a blue-chip staple.',
  macroContext:
    'Investors are questioning complex conglomerates. Hidden liabilities and weak cash flow are under new scrutiny.',
  clues: [
    'It is a decades-old blue chip spanning many unrelated businesses.',
    'Its dividend looks generous, but cash flow may not support it.',
    'New leadership is under pressure to simplify and cut.',
  ],
  revealShortText:
    'That was General Electric. Trouble in power and finance forced a historic dividend cut and a painful decline.',
  funFact:
    'It was removed from the Dow Jones Industrial Average in 2018 after more than a century in the index.',
  lookbackPrices: [22, 25, 27, 24, 28, 30, 31, 30],
  outcomePrices: [30, 29, 27, 24, 20, 17, 15, 13],
},
{
  id: 'proto_boeing_2013_2015',
  companyName: 'Boeing',
  ticker: 'BA',
  acceptedNames: ['boeing', 'ba'],
  title: 'Clear Skies, For Now',
  era: 'Post-financial-crisis recovery',
  decisionDateLabel: 'Jan 2013',
  outcomeLabel: 'Jan 2013 → Jan 2015',
  holdingPeriodLabel: '2 years',
  actualReturnPercent: 0.42,
  companyDescription:
    'One of two dominant makers of large commercial aircraft, with a massive multi-year order backlog.',
  macroContext:
    'Global air travel is expanding and airlines are ordering fuel-efficient jets, though supply chains are strained.',
  clues: [
    'It operates in a near-duopoly for large commercial jets.',
    'A record order backlog promises years of revenue if it can deliver.',
    'Early production hiccups on a new model rattled investors but were resolved.',
  ],
  revealShortText:
    'That was Boeing. A record jet backlog and smooth deliveries lifted the stock over 40% in two years.',
  funFact:
    'Its order backlog has at times exceeded 5,000 aircraft — many years of production.',
  lookbackPrices: [60, 62, 58, 65, 68, 70, 72, 75],
  outcomePrices: [75, 80, 88, 95, 100, 98, 104, 106],
},
{
  id: 'proto_visa_2011_2013',
  companyName: 'Visa',
  ticker: 'V',
  acceptedNames: ['visa', 'v'],
  title: 'Swipe Right',
  era: 'Post-financial-crisis recovery',
  decisionDateLabel: 'Jan 2011',
  outcomeLabel: 'Jan 2011 → Jan 2013',
  holdingPeriodLabel: '2 years',
  actualReturnPercent: 0.58,
  companyDescription:
    'A payments network that earns a small fee on a huge and growing volume of electronic transactions.',
  macroContext:
    'Cash is giving way to cards and digital payments worldwide, a durable multi-year shift.',
  clues: [
    "It doesn't lend money; it takes a tiny cut of a massive flow of transactions.",
    'The long-term tailwind is the global shift from cash to digital payments.',
    'Its network scale makes it very hard for newcomers to displace.',
  ],
  revealShortText:
    'That was Visa. The steady shift from cash to cards drove reliable, compounding growth.',
  funFact:
    'Its network can process tens of thousands of transactions per second — without ever touching the money itself.',
  lookbackPrices: [16, 17, 15, 18, 19, 20, 21, 22],
  outcomePrices: [22, 24, 26, 28, 30, 32, 34, 35],
},
```

Note: the `V` ticker (Visa) is a single letter — because `normalizeGuess` and the
accepted-names match is exact-equality after normalization, `v` only matches a lone
"v" guess, which is fine. Do not add fuzzy/substring matching.

## Part B — `buildRunScenarioList`: exhaust pool before repeating

Rewrite `buildRunScenarioList(totalRounds)` so it never repeats a scenario until
every scenario has appeared, and never plays the same scenario back-to-back across
lap boundaries:

1. Shuffle the full pool (Fisher-Yates) into a lap.
2. Emit scenarios from the lap in order.
3. When the lap is exhausted and more rounds are needed, shuffle a new lap; if the
   new lap's first entry equals the last emitted scenario, swap it with another
   entry in that lap so there's no adjacent duplicate.
4. Continue until `totalRounds` entries are produced.

With 12 scenarios and a 20-round run: rounds 1–12 are all distinct; rounds 13–20
come from a fresh shuffle with no boundary repeat.

## Part C — Clearer win/loss banner (reveal view)

In `apps/web/app/play/classic/run/page.tsx`, at the **top of the reveal card**
(above the `That was {company}.` headline), render a full-width result banner from
`lastRound`:

| Condition | Banner text | Style |
|-----------|-------------|-------|
| `action === 'pass'` | `You passed` | neutral: `bg-son-surface text-son-textSecondary` |
| `pnlAmount > 0` | `You won  {formatSignedMoney(pnlAmount)}` | `bg-son-green/15 text-son-green` |
| `pnlAmount < 0` | `You lost  {formatSignedMoney(pnlAmount)}` | `bg-son-red/15 text-son-red` |
| `pnlAmount === 0` (not pass) | `Break-even` | neutral as above |

Style the banner: `rounded-lg px-4 py-3 mb-4 text-center text-lg font-bold`. Keep the
existing Gain/Loss detail line below — the banner is a summary headline, not a
replacement. (Sound/animation is a separate Phase 9 TODO — do NOT add audio or
motion here.)

## Do NOT

- Change any of the original 6 scenarios' data, or the new 6 objects' text.
- Add fuzzy/substring/autocomplete guess matching.
- Add audio, animation, or motion (Phase 9).
- Touch `packages/game-engine` or tests.
- Commit or push (D012). Nothing on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `pnpm test` 24/24, `pnpm typecheck` + `pnpm lint` clean. — *run them*
2. Pool has 12 scenarios; a 20-round run shows **12 distinct companies** before any
   repeat, and never the same company twice in a row. — *play a full run, note order*
3. Each new card's reveal shows the correct company, window, and return
   (e.g. Nvidia +230.0%, GE −56.0%, Visa +58.0%). — *observe*
4. Hidden-card fields of all 12 cards contain no company name, ticker, founder, or
   product-name/slogan leak. — *read source + spot-check in app*
5. Reveal banner: a winning round shows green `You won +$…`, a loss shows red
   `You lost −$…`, a pass shows neutral `You passed`. — *play all three*
6. 375px: banner and cards have no horizontal overflow. — *devtools*

## Reporting

Set Status `complete`, update `progress.md`, write `agents/reports/R006_H006.md`.
Do NOT commit — orchestrator reviews and commits (D012).
