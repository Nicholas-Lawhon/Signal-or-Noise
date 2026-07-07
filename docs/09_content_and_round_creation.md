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
Difficulty-scaled clues: Easy 3 / Medium 2 / Hard 1 (D022)
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
- Clues, count scaled by difficulty (D022): **Easy 3, Medium 2, Hard 1**

### Reveal

- Short reveal text
- Fun fact
- Why it moved bullets

### Review Metadata

- generatedByAi
- humanReviewed
- source URLs
- review notes

## Scenario Content Rulebook (D022)

This is the binding rulebook for ALL hidden-card content — placeholder and
curated alike (D018). Difficulty scales two things and only two things: how
many clues the player gets (Easy 3 / Medium 2 / Hard 1) and how identifying
every hidden field may be. Difficulty is about **information given**, never
about company obscurity — fame mix is a separate axis (60/30/10, see Scenario
Mix Recommendation).

### Universal Bans (every field, every difficulty)

Extends the soul.md content-integrity list. Hidden-card content (title,
companyDescription, macroContext, clues) must never contain:

- Company name, ticker, or brand names (soul.md)
- Founder, CEO, or other executive references (soul.md)
- Unmistakable product names or slogans (soul.md)
- Mission statements or widely quoted company phrases, even paraphrased
- Company-unique events in recognizable phrasing ("split its service in two
  after a price hike" = one company; "damaged customer trust with a pricing
  decision" = many companies)
- Superlatives with one answer ("the largest online retailer", "the first
  trillion-dollar company")
- Widely memed numbers or facts ("$99 price point", "founded in a garage")
- Headquarters city or region combined with industry ("a Seattle software
  giant")

The test for all of these: **could the sentence describe at least three real
companies?** If not, rewrite it.

### Field Roles

- **Title** — flavor and framing only. Titles are shown pre-decision at every
  difficulty, so every title must meet the HARD identifiability bar (soul.md).
  "The Streaming Pivot" fails (one company, given the date); "Against the
  Current" passes.
- **companyDescription** — what kind of business this is. This is the identity
  axis: its specificity cap (below) is what makes a variant Easy or Hard.
- **macroContext** — the world around the company: rates, adoption curves,
  crises, sentiment. Must be true of the whole era, never identity-bearing —
  a macroContext that only fits one company is a leaked clue.
- **clues** — decision-relevant information (see Clue Taxonomy).

### Specificity Ladder

Every hidden sentence sits on this ladder. Per-difficulty caps below.

```text
L1  Sector-level      "A consumer-facing technology company."
L2  Industry-level    "A home-entertainment company."
L3  Model-level       "A subscription service moving from physical media
                       to digital delivery."
L4  Situation-unique  "A DVD-by-mail service whose price-change announcement
                       triggered mass cancellations."  ← identifying; BANNED
                       everywhere (fails the three-companies test)
```

### Clue Taxonomy

Every clue is one of three types:

- **B — Business-model clue:** what the company does or sells, how it earns.
- **S — Situation clue:** the strategic tension of THIS window — the pivot,
  threat, scandal, or bet whose resolution decides the outcome.
- **M — Market-position/era clue:** scale, competitive standing, or how the
  era treats companies like this.

### Per-Difficulty Specification

| | Easy | Medium | Hard |
|---|---|---|---|
| Clues | 3 — one B, one S, one M | 2 — one B or M, one S | 1 — S only |
| companyDescription cap | L3 | L2 | L1 |
| Clue specificity cap | L3 | L3 in the S clue only, L2 otherwise | L2 |
| macroContext | Era-specific allowed | Era-specific allowed | Broad era only |

Every variant at every difficulty must include an S clue: the situation is the
game. The S clue states the tension abstractly enough to pass the
three-companies test but concretely enough to reason about.

### Decision-Informativeness Floor (anti-randomness)

A variant fails — regardless of difficulty — if a thoughtful player could not
articulate, after reading it, why Long might be right AND why Short might be
right. Hard's single clue carries this alone: it must present a genuine
unresolved tension, not a vague description. "A company facing challenges"
fails; "an incumbent betting its cash cow on an unproven distribution model
while a cheaper rival scales" passes.

### The Guessability Test (falsifiable gate)

For each variant, paste the full pre-decision content (title, era, dates label,
companyDescription, macroContext, clues) into a fresh LLM session and ask:
"Name the most likely company. Give your top 3 guesses with confidence."

- **Easy:** the correct company should appear in the top 3 (it MAY be #1).
  If the model can't place it top-3, the variant is too vague — fail.
- **Medium:** the correct company may appear in the top 3, but must not be a
  single confident #1. If the model names it first with high confidence — fail.
- **Hard:** the correct company must NOT appear in the top 3 — fail if it does.

Use a mid-tier model consistently (a stronger guesser = a stricter test; note
which model was used in the card's review notes). The Phase 3 validator (D019)
automates this with one model call per variant; until then it is a manual step
in the Human Review Checklist.

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
  - clues: exactly 3 for Easy, 2 for Medium, 1 for Hard
- Follow the Scenario Content Rulebook: every variant needs a Situation clue
  stating this window's strategic tension; respect each difficulty's
  specificity caps; every hidden sentence must plausibly describe at least
  three real companies.
- The scenario title is shown pre-decision at every difficulty: it must not
  identify the company even combined with the dates shown.
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
- Wrong clue count for the difficulty (Easy 3 / Medium 2 / Hard 1, D022)
- Hidden card mentions company name
- Hidden card mentions ticker
- Title fails the Hard identifiability bar
- Guessability test fails for any variant (automated in the Phase 3
  validator, D019)
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
- Is the company hidden enough? (Run the Guessability Test per variant and
  record the results — manual until the Phase 3 validator automates it.)
- Does the title pass the Hard bar?
- Is Easy too obvious?
- Is Hard too vague, or its single clue uninformative? (Decision-Informativeness
  Floor)
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
