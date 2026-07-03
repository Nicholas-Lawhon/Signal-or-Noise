# 09 Content and Round Creation — Signal or Noise?

## Content Goal

The MVP should include 100 curated scenario cards, 10 daily challenge pools, and 10 famous market eras.

The content should be generated with AI assistance, validated with a strict schema, reviewed by a human, and stored as seed data.

The app should not dynamically generate live gameplay content in production for MVP.

## Terminology

Use:

```text
Scenario card
```

Not:

```text
Company card
```

A scenario card is a company during a specific historical window.

Example:

```text
Apple from Jan 2012 to Jan 2013
```

This is different from:

```text
Apple from Jan 2007 to Jan 2012
```

Each historical window is a different scenario.

## MVP Content Requirements

The MVP content library should include:

```text
100 curated scenario cards
10 daily challenge pools
10 famous market eras
Easy / Medium / Hard variants for every scenario
3 clues per difficulty level
Pre-decision lookback chart data
Outcome chart data
Reveal text
Fun fact/trivia
Source URLs for review
```

## Asset Scope

MVP includes:

- Public companies only

Future expansion may include:

- ETFs
- Indexes
- Crypto
- Commodities
- Macro scenarios
- Sector baskets

Do not include those in MVP unless the core game is already stable.

## Scenario Card Requirements

Each scenario must include:

### Company Data

- Company name
- Ticker
- Exchange
- Sector
- Industry
- Country

### Scenario Data

- Scenario title
- Decision date
- End date
- Holding period label
- Era
- Content pack
- Difficulty support

### Market Data

- Starting price
- Ending price
- Price return percent
- Split-adjusted price flag
- Total return flag
- Pre-decision chart start date
- Pre-decision chart end date
- Outcome chart start date
- Outcome chart end date

### Difficulty Variants

Each of Easy, Medium, and Hard includes:

- Hidden company description
- Macro context
- 3 clues

### Reveal

- Short reveal text
- Fun fact
- Why it moved bullets

### Review Metadata

- generatedByAi
- humanReviewed
- source URLs
- review notes

## Difficulty Guidelines

### Easy

Easy should be approachable.

Easy can include:

- More recognizable business-model clues
- More specific industry language
- Clearer macro context
- More obvious clues
- Better contextual hints

Example style:

```text
A subscription entertainment company trying to move from physical media to streaming.
```

### Medium

Medium should be the default balanced experience.

Medium can include:

- Some identifying context
- Generalized industry language
- Balanced macro clues
- Moderate ambiguity

Example style:

```text
A U.S. entertainment company with a recurring-revenue model and a controversial strategic transition.
```

### Hard

Hard should be more abstract.

Hard can include:

- Broader sector terms
- Fewer identifying details
- More ambiguous clues
- Less specific macro context

Example style:

```text
A consumer-facing media business attempting a major distribution shift.
```

## AI Generation Workflow

Recommended workflow:

1. Choose scenario candidate.
2. Gather source URLs.
3. Confirm decision date and end date.
4. Confirm split-adjusted price return.
5. Generate schema-valid scenario JSON.
6. Validate JSON.
7. Review content quality.
8. Playtest difficulty.
9. Mark reviewed.
10. Import into database.

## AI Prompt Template

Use a prompt like this for scenario generation:

```text
You are helping create content for Signal or Noise?, a market-history guessing game.

Generate one schema-valid scenario card as JSON only.

The player must not see the company name or ticker before the reveal.

The scenario is a public company during a specific historical window. The player will see a pre-decision lookback chart, then choose Long, Short, or Pass for the future outcome period.

Requirements:
- Create Easy, Medium, and Hard hidden-card variants.
- Each difficulty variant must include:
  - companyDescription
  - macroContext
  - exactly 3 clues
- Do not mention the company name, ticker, exact product names that make the company too obvious, founder names, CEO names, or unique slogans in hidden-card content.
- Reveal content may mention the company name.
- Include short reveal text, a fun fact, and 3 whyItMoved bullets.
- Include source URLs for review.
- Use concise, game-like language.
- Do not write financial advice.
- The product is entertainment/trivia, not investing guidance.

Return JSON only using the approved schema.
```

## Scenario Validation Checklist

A scenario card should fail validation if:

- Missing required fields
- Missing any difficulty variant
- Any difficulty has fewer or more than 3 clues
- Hidden card mentions company name
- Hidden card mentions ticker
- Hidden card reveals the outcome
- Pre-decision chart overlaps outcome period incorrectly
- Decision date is after end date
- Price return percent is missing
- Source URLs are missing
- Reveal text is missing
- Difficulty labels are invalid

## Human Review Checklist

A human reviewer should check:

- Is the scenario fun?
- Is the company hidden enough?
- Is Easy too obvious?
- Is Hard too vague?
- Are the clues fair?
- Is the macro context useful?
- Does the lookback period make sense?
- Is the outcome period interesting?
- Is the return correct?
- Are sources credible enough?
- Does the reveal feel satisfying?
- Does the text avoid financial advice?
- Does the card avoid misleading claims?

## Source Requirements

Each scenario should include source URLs for review.

Sources may include:

- Historical price source
- Company filings
- Earnings summaries
- Reputable business articles
- Company history pages
- Market context sources

Source URLs are stored for review and not shown to players in MVP.

## Historical Return Handling

For MVP:

```text
Use split-adjusted price return first.
Document total return/dividends as future improvement.
```

Do not attempt perfect total-return modeling in the first prototype.

## Chart Requirements

Each scenario needs:

### Pre-Decision Lookback Chart

Shown before decision.

Must end on or before the decision date.

### Outcome Chart

Shown after reveal.

Shows what happened during the betting period.

Important:

The player should never see the future outcome chart before locking in a decision.

## Daily Challenge Pools

MVP requires 10 daily challenge pools.

Each pool should include:

- 10 scenario IDs
- Mixed difficulty
- Mixed sectors if possible
- No repeated company in the same pool unless intentionally designed
- Reasonable variety of long/short outcomes
- A configured starting bankroll

Example:

```json
{
  "id": "daily_pool_001",
  "name": "MVP Daily Pool 001",
  "startingBankroll": 10000,
  "scenarios": [
    {
      "scenarioId": "scenario_netflix_2012_2017",
      "difficulty": "medium"
    }
  ]
}
```

## Famous Market Eras

MVP should include 10 famous market eras.

Possible eras:

1. Dot-com bubble and aftermath
2. Pre-financial-crisis expansion
3. Global financial crisis
4. Post-financial-crisis recovery
5. Smartphone/platform era
6. Streaming wars
7. Cloud software expansion
8. Pandemic crash and recovery
9. Pandemic winners and losers
10. Rate-hike/inflation era

These names can be refined later.

## Scenario Mix Recommendation

For the first 100 scenarios:

```text
60 famous or highly recognizable companies
30 moderately known companies
10 obscure/hard-mode companies
```

This keeps the MVP accessible while still giving harder content.

## Content Quality Principles

Good scenario cards:

- Create a fair guessing challenge.
- Avoid making the company obvious too early.
- Include enough context to make a decision.
- Have an interesting outcome.
- Support a satisfying reveal.
- Feel like trivia/game content, not a research report.

Bad scenario cards:

- Are too vague.
- Are too obvious.
- Depend on obscure accounting details.
- Feel random.
- Include misleading clues.
- Use overly educational lecture copy.
- Accidentally reveal the company name.
- Accidentally reveal the outcome.

## Future Content Features

Post-MVP content improvements:

- Smart pass scoring metadata
- Optional clue reveals
- User-created challenge packs
- Paid era packs
- Premium scenario archives
- Portfolio Draft scenario sets
- Friend challenge packs
- AI-assisted admin generation UI
- Tone variants
- Difficulty calibration analytics
