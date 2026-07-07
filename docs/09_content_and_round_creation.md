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
- review notes, including the private fact bank and likely player guesses per
  difficulty (`easyLikelyGuesses` / `mediumLikelyGuesses` / `hardLikelyGuesses`
  — required curator output now; Phase 3 schema fields later) and Guessability
  Test results

## Scenario Content Rulebook (D022)

This is the binding rulebook for ALL hidden-card content — placeholder and
curated alike (D018). Difficulty scales two things and only two things: how
many clues the player gets (Easy 3 / Medium 2 / Hard 1) and how identifying
every hidden field may be. Difficulty is about **information given**, never
about company obscurity — fame mix is a separate axis (60/30/10, see Scenario
Mix Recommendation).

### Universal Bans (every field, every difficulty)

Leaks come in two forms. **Literal leaks** name the company outright: name,
ticker, founder, product, slogan. **Triangulation leaks** identify it by
combination — a date, sector, strategic event, and famous market story that
together leave only one plausible company, even though no single sentence
names it. The bans below plus the three-companies test catch literal and
single-sentence leaks; whole-card triangulation is caught by the red-team
guess list (authoring step 7) and the Guessability Test.

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
- Distinctive hooks that are famous for ONE company in this era, even in
  abstract wording: interface or form factor, category origin ("expanded from
  one narrow category"), pricing incidents, distribution channel, store
  footprint, product architecture, customer segment. If the hook is how
  people remember this company in this window, abstract it further or move
  it to reveal-only.
- Famous hindsight thesis phrasing — how the market NOW remembers the winning
  story ("gaming chips finding heavier computing workloads"). Reveal-only,
  unless at least three public companies share the same hindsight story.

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

**Escalation rules:** a sentence climbs one level when it combines two or
more identity dimensions (business model, customer segment, distribution
channel, strategic transition, era-specific event, market position). And any
sentence that — combined with the era and date the player also sees — leaves
fewer than three plausible public companies is L4, regardless of how abstract
its wording looks.

### Clue Taxonomy

Every clue is one of three types:

- **B — Business-model clue:** what the company does or sells, how it earns.
- **S — Situation clue:** the strategic tension of THIS window — the pivot,
  threat, scandal, or bet whose resolution decides the outcome.
- **M — Market-position/setup clue:** scale, competitive standing, how the
  era treats companies like this, or the market/financial setup — valuation,
  balance-sheet stress, margin pressure, prior price run-up, dividend
  support, sentiment — stated without identifying the company.

### Per-Difficulty Specification

| | Easy | Medium | Hard |
|---|---|---|---|
| Clues | 3 — one B, one S, one M | 2 — one B or M, one S | 1 — S-led; may fold in one non-identifying setup element |
| companyDescription cap | L3 | L2 | L1 |
| Clue specificity cap | L3 | L3 in the S clue only, L2 otherwise | L2 |
| macroContext | Era-specific allowed | Era-specific allowed | Broad era only |
| Plausible alternatives (whole card) | ≥ 2 | 2–4, none dominant | ≥ 4, correct company not dominant |

Every variant at every difficulty must include an S clue: the situation is the
game. The S clue states the tension abstractly enough to pass the
three-companies test but concretely enough to reason about.

### Decision-Informativeness Floor (anti-randomness)

Every variant must contain at least one concrete Long driver AND one concrete
Short risk, both drawn from the fact bank's decision-useful list. Generic
drivers — "demand may recover", "margins may fall", "competition is rising",
"investors are uncertain" — do NOT count unless anchored to a specific
non-identifying fact of this scenario. Hard's single clue carries this alone:
it must present a genuine unresolved tension, not a vague description. "A
company facing challenges" fails; "an incumbent betting its cash cow on an
unproven distribution model while a cheaper rival scales" passes.

### Gate 1 — Whole-Card Triangulation Review (human)

Before any model test, the reviewer evaluates the FULL pre-decision payload
together — title, era, date label, companyDescription, macroContext, clues,
and lookback chart shape — and lists the plausible public-company candidates.
"Plausible" means a real public company in the same broad era whose hidden
facts could fit without contradiction. Minimums (also the targets for the
authoring red-team step):

- **Easy:** at least 2 plausible candidates
- **Medium:** 2–4 plausible candidates, none dominant
- **Hard:** at least 4 plausible candidates, correct company not dominant

A variant fails this gate even if every individual sentence passes the
three-companies test — triangulation leaks live between the sentences.

### Gate 2 — The Guessability Test (model, falsifiable)

Paste the same full pre-decision payload into a FRESH session of the
designated test model and ask: "Name the hidden company. Give your top 5
guesses with a confidence percentage for each." Use the same model and the
same prompt for every card, and record the model in review notes. The Phase 3
validator (D019) automates this with a pinned model at temperature 0; until
then it is a manual step in the Human Review Checklist.

Initial thresholds — calibration values, tunable via playtest without
reopening D022:

- **Easy:** the correct company should appear in the top 3 (it MAY be #1).
  Missing from the top 5 entirely — too vague, fail.
- **Medium:** fail if the correct company is #1 with ≥ 40% confidence, or
  leads the #2 guess by 15+ points.
- **Hard:** fail if the correct company appears in the top 5 with ≥ 15%
  confidence.

### Calibrated Pass/Fail Examples

Drawn from red-teaming the rulebook (C001) against the leak patterns actually
found in the placeholder deck.

**FAIL — Hard, distinctive-hook triangulation:** "An incumbent is defending a
keyboard-centered workflow while rivals make cheaper, touch-first devices
easier to adopt" (+ Smartphone era, 2008). Every sentence passes the
three-companies test; the combination is unmistakably one company, because
the keyboard hook is how people remember it in this window — banned hook.
**PASS rewrite:** "An enterprise-favored incumbent is defending its
established way of working as consumer-oriented rivals reset expectations
for the category."

**FAIL — Medium, tiny peer set:** "A payments network earning small fees on
large transaction volume… does not take credit risk." Sentence-level legal,
but the real public-company candidate set is ~2 — below the 2–4 minimum, and
Call the Company becomes a coin flip.
**PASS rewrite:** "A fee-based financial infrastructure company that profits
as commerce volumes grow, without lending money itself" — networks,
processors, and exchanges all fit.

**FAIL — Easy, hindsight thesis:** "Its core chips were built for gaming but
are increasingly useful for heavier computing tasks" (2015). No banned term
appears, but this is the market's canonical memory of one company —
hindsight-thesis ban.
**PASS rewrite:** "A specialized hardware designer's niche products are
finding unexpected demand from large-scale computing buyers."

**FAIL — Hard, compliant-but-random:** "Management faces a changing demand
environment while investors debate whether margins can hold." Generic Long
and Short cases exist, but neither is anchored to a scenario fact — fails
the Decision-Informativeness Floor.

## Authoring Workflow

Required workflow (one scenario = one company + one window, with three
hidden-card variants — never three separate scenario records):

1. Choose scenario candidate.
2. Gather source URLs; confirm decision date, end date, and split-adjusted
   price return.
3. **Build a private fact bank** (kept in review notes, never shown to
   players) with three lists:
   - Reveal-only facts (name, products, famous story beats — reveal/funFact
     material)
   - Allowed decision-useful facts (the tension, drivers, era conditions)
   - Prohibited identity-leak facts (anything failing the Universal Bans or
     three-companies test — enumerate these BEFORE writing, so they can't
     sneak in)
4. **Generate Hard first** (1 clue, L1–L2), then Medium by adding controlled
   specificity (2 clues), then Easy (3 clues, up to L3). Never write Easy
   first and "vague it down" — that leaves triangulation residue in the
   harder variants.
5. **Red-team each variant (Gate 1):** list the likely player guesses per
   difficulty in the review notes, and for EACH guess record the hidden fact
   that points there. If every reason points uniquely to the correct company,
   revise — even if the list is long enough. Enforce the plausible-alternative
   minimums (Easy ≥2 / Medium 2–4 / Hard ≥4). If Hard gives no rational basis
   for Long vs Short (Decision-Informativeness Floor), revise.
6. Run the Guessability Test (Gate 2) per variant; record model used and
   results.
7. Validate schema and leakage rules.
8. Review content quality; playtest difficulty.
9. Mark reviewed (human only).
10. Import into database.

## AI Prompt Template

Use a prompt like this for scenario generation:

```text
You are creating one curated scenario card for Signal or Noise?, a mobile-first market-history guessing game.

Create one scenario for this company and historical window:
- Company:
- Ticker:
- Decision date:
- End date:
- Holding period:

This is ONE scenario with Easy, Medium, and Hard hidden-card variants — never separate scenario records per difficulty. The player sees the hidden card and a pre-decision lookback chart, then chooses Long, Short, or Pass. Before locking a call the player must never see: company name, ticker, founder/CEO names, unmistakable product names, unique slogans, reveal text, outcome return, end price, or outcome chart.

STEP 1 — Build a private fact bank (goes in review notes, never shown to players):
1. Reveal-only facts (name, products, famous story beats)
2. Allowed decision-useful facts (the tension, drivers, era conditions)
3. Prohibited identity-leak facts (anything a player could identify the company from)

STEP 2 — Generate the hidden-card variants, HARD FIRST, then Medium, then Easy:

Hard (1 clue):
- The single clue is a Situation clue: this window's strategic tension, stated abstractly (sector-level language) but concretely enough that a player can argue both the Long case and the Short case. It may fold in ONE non-identifying financial/market setup element (valuation, balance sheet, margins, sentiment).
- No famous-story framing, no hindsight thesis phrasing, no hooks famous for one company. Company identity may stay uncertain even for good players — but never random or purely vague.

Medium (2 clues):
- One Situation clue, plus one Business-model or Market-position clue.
- No single clue identifies the company. The full card may make it guessable but must leave 2–4 plausible alternatives.
- Category-level language, not famous hindsight framing.

Easy (3 clues):
- One Business-model, one Situation, one Market-position/era clue.
- More direct industry and business-model language is allowed; the company guess ("Call the Company") should be realistically attainable.
- Still no literal leaks.

Rules for ALL hidden content (title, companyDescription, macroContext, clues):
- Every sentence must plausibly describe at least three real companies.
- The scenario title is shown pre-decision at every difficulty: it must not identify the company even combined with the dates shown.
- No company name, ticker, founder/CEO names, product names, slogans, mission statements, one-answer superlatives, or company-unique events in recognizable phrasing.
- macroContext describes the era, never the company.

STEP 3 — Red-team: for each variant, list the likely player guesses in review notes WITH the hidden fact that points to each guess. Targets: Easy at least 2 plausible candidates, Medium 2–4 with none dominant, Hard at least 4 with the correct company not dominant. Revise if the card misses its target, if every reason points uniquely to the correct company, or if Hard's clue gives no decision signal.

Also include:
- reveal.shortText, reveal.funFact, reveal.whyItMoved (exactly 3 bullets) — reveal content MAY name the company
- source URLs for price data and context
- review notes with the fact bank and likely player guesses per difficulty

Use short, punchy, game-like copy. No financial advice — this is entertainment/trivia, not investing guidance.

Return schema-valid JSON only.
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
- Review notes missing the fact bank or the likely-player-guesses lists

The Phase 3 validator additionally WARNS (without auto-rejecting) on
configured high-risk triangulation terms; the guessability check and human
review remain the authority on combined-specificity leaks.
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
