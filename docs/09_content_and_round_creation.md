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
Balanced Tension variants with setup hints: Easy 1 / Medium 0–1 / Hard 0 (D026)
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
- Situation
- Long case
- Short case
- Setup hints, count scaled by difficulty (D026): **Easy 1, Medium 0–1, Hard 0**

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

## Scenario Content Rulebook (D022, D026)

This is the binding rulebook for ALL hidden-card content — placeholder and
curated alike (D018). Difficulty scales two things and only two things: how
much setup context the player gets (Easy 1 setup hint / Medium 0–1 / Hard 0)
and how identifying every hidden field may be. Every variant still contains the
balanced decision core: `situation`, `longCase`, and `shortCase` (D026).
Difficulty is about **information given**, never about company obscurity — fame
mix is a separate axis (60/30/10, see Scenario Mix Recommendation).

### Universal Bans (every field, every difficulty)

Leaks come in two forms. **Literal leaks** name the company outright: name,
ticker, founder, product, slogan. **Triangulation leaks** identify it by
combination — a date, sector, strategic event, and famous market story that
together leave only one plausible company, even though no single sentence
names it. The bans below plus the three-companies test catch literal and
single-sentence leaks; whole-card triangulation is caught by the red-team
guess list (authoring step 7) and the Guessability Test.

Extends the soul.md content-integrity list. Hidden-card content (title,
companyDescription, macroContext, situation, longCase, shortCase, setupHints)
must never contain:

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
- **situation** — the unresolved debate of this window, stated neutrally.
- **longCase** — one concrete reason the stock could go up during the outcome
  period. Player-facing UI labels this "Why it might work".
- **shortCase** — one concrete reason the stock could go down during the outcome
  period. Player-facing UI labels this "What could break".
- **setupHints** — optional Business-model or Market-position/setup hints that
  add context by difficulty. These are not allowed to replace the balanced core.

The player-facing section frame is **"Signal or Noise?"**. Do not label the two
sides "Signal" and "Noise"; that biases the player toward treating one side as
truth and the other as disposable.

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

### Hint Taxonomy

Every setup hint is one of two types:

- **B — Business-model clue:** what the company does or sells, how it earns.
- **M — Market-position/setup clue:** scale, competitive standing, how the
  era treats companies like this, or the market/financial setup — valuation,
  balance-sheet stress, margin pressure, prior price run-up, dividend
  support, sentiment — stated without identifying the company.

The former S clue now lives in the required `situation` field.

### Per-Difficulty Specification

| | Easy | Medium | Hard |
|---|---|---|---|
| Setup hints | 1 — B or M | 0–1 — B or M, use 0 when identity risk is high | 0 |
| Balanced core | situation + longCase + shortCase | situation + longCase + shortCase | situation + longCase + shortCase |
| companyDescription cap | L3 | L2 | L1 |
| Core/setup specificity cap | L3 | L3 in the situation only, L2 otherwise | L2 |
| macroContext | Era-specific allowed | Era-specific allowed | Broad era only |
| Plausible alternatives (whole card) | ≥ 2 | 2–4, none dominant | ≥ 4, correct company not dominant |

Every variant at every difficulty must include `situation`, `longCase`, and
`shortCase`: the unresolved debate is the game. These fields must state the
tension abstractly enough to pass the three-companies test but concretely enough
to reason about.

### Decision-Informativeness Floor (anti-randomness)

Every variant must contain one concrete Long driver (`longCase`) AND one
concrete Short risk (`shortCase`), both drawn from the fact bank's
decision-useful list and given equal visual/content weight. Generic drivers —
"demand may recover", "margins may fall", "competition is rising", "investors
are uncertain" — do NOT count unless anchored to a specific non-identifying fact
of this scenario. Hard has no setup hints, so the balanced core must carry the
round by itself: it must present a genuine unresolved tension, not a vague
description. "A company facing challenges" fails; "an incumbent betting its cash
cow on an unproven distribution model while a cheaper rival scales" passes.

### Directional Sentiment Rules (anti-answer leakage)

Hidden content must not make the correct Long/Short action obvious through tone,
even if company identity remains hidden. Common failure modes:

- **Asymmetric case strength:** one side has concrete facts while the other is
  generic filler.
- **Loaded evaluative language:** words like "doomed", "unstoppable",
  "disaster", "exploded", "obvious", or "no-brainer" smuggle hindsight.
- **Hindsight thesis framing:** the now-famous winner/loser story is presented
  as if it were already settled at the decision date.
- **Chart-as-oracle:** lookback shape plus prose points strongly to momentum or
  reversal as the answer.
- **Title bias:** titles such as "Defensive Compounder" or "Peak Expectations"
  pre-answer the call.
- **Macro cheerleading:** macro context only describes the winning backdrop.

Review test: cover `longCase`; `shortCase` must still be concrete. Cover
`shortCase`; `longCase` must still be concrete. If title, macro, chart, and both
cases all lean the same direction, revise.

### Gate 1 — Whole-Card Triangulation Review (human)

Before any model test, the reviewer evaluates the FULL pre-decision payload
together — title, era, date label, companyDescription, macroContext, situation,
longCase, shortCase, setupHints, and lookback chart shape — and lists the
plausible public-company candidates.
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
4. **Generate Hard first**: write the neutral `situation`, matched `longCase`
   and `shortCase`, and no setup hints at L1–L2 specificity. Then create Medium
   by adding controlled specificity and 0–1 setup hints. Then create Easy by
   adding one setup hint and allowing up to L3 specificity. Never write Easy
   first and "vague it down" — that leaves triangulation and sentiment residue
   in the harder variants.
5. **Red-team each variant (Gate 1):** list the likely player guesses per
   difficulty in the review notes, and for EACH guess record the hidden fact
   that points there. If every reason points uniquely to the correct company,
   revise — even if the list is long enough. Enforce the plausible-alternative
   minimums (Easy ≥2 / Medium 2–4 / Hard ≥4). If Hard gives no rational basis
   for Long vs Short, or if one side is obviously stronger from tone alone,
   revise.
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

Hard:
- Include companyDescription, macroContext, situation, longCase, shortCase, and setupHints: [].
- The situation is this window's strategic tension, stated abstractly (sector-level language) but concretely enough that a player can argue both the Long case and the Short case.
- longCase and shortCase must be concrete, matched in strength, and equally plausible from the information shown.
- No famous-story framing, no hindsight thesis phrasing, no hooks famous for one company. Company identity may stay uncertain even for good players — but never random or purely vague.

Medium:
- Include companyDescription, macroContext, situation, longCase, shortCase, and setupHints with 0 or 1 Business-model or Market-position/setup hint. Use 0 when identity risk is high.
- No single field identifies the company. The full card may make it guessable but must leave 2–4 plausible alternatives.
- Category-level language, not famous hindsight framing.

Easy:
- Include companyDescription, macroContext, situation, longCase, shortCase, and exactly 1 Business-model or Market-position/setup hint.
- More direct industry and business-model language is allowed; the company guess ("Call the Company") should be realistically attainable.
- Still no literal leaks.

Rules for ALL hidden content (title, companyDescription, macroContext, situation, longCase, shortCase, setupHints):
- Every sentence must plausibly describe at least three real companies.
- The scenario title is shown pre-decision at every difficulty: it must not identify the company even combined with the dates shown.
- No company name, ticker, founder/CEO names, product names, slogans, mission statements, one-answer superlatives, or company-unique events in recognizable phrasing.
- macroContext describes the era, never the company.
- The player-facing section frame is "Signal or Noise?"; the UI labels longCase as "Why it might work" and shortCase as "What could break". Do not label either side "Signal" or "Noise".
- Avoid directional sentiment leaks: loaded adjectives, one-sided concrete detail, title bias, and chart/prose combinations that make Long or Short obvious.

STEP 3 — Red-team: for each variant, list the likely player guesses in review notes WITH the hidden fact that points to each guess. Targets: Easy at least 2 plausible candidates, Medium 2–4 with none dominant, Hard at least 4 with the correct company not dominant. Revise if the card misses its target, if every reason points uniquely to the correct company, or if Hard's balanced core gives no decision signal.

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
- Wrong setup hint count for the difficulty (Easy 1 / Medium 0–1 / Hard 0, D026)
- Missing `situation`, `longCase`, or `shortCase`
- `longCase` or `shortCase` is generic filler rather than an anchored fact
- Hidden card mentions company name
- Hidden card mentions ticker
- Title fails the Hard identifiability bar
- Guessability test fails for any variant (automated in the Phase 3
  validator, D019)
- Review notes missing the fact bank or the likely-player-guesses lists

The Phase 3 validator additionally WARNS (without auto-rejecting) on
configured high-risk triangulation terms; the guessability check and human
review remain the authority on combined-specificity leaks.
- The Phase 3 validator additionally WARNS on configured directional-sentiment
  terms and case asymmetry: loaded adjectives, obvious winner/loser phrasing,
  titles that imply a call, and one case being much shorter or more generic than
  the other. Human review is the authority on whether the tension is balanced.
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
- Is Hard too vague, or is its balanced core uninformative?
- Are `longCase` and `shortCase` both concrete and matched in strength?
- Does the "Signal or Noise?" frame feel like a balanced debate, not advice?
- Is the macro context useful?
- Does title + macro + chart + prose accidentally point to Long or Short as the
  obvious action?
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

Shown before decision as atmosphere/context, not as a prediction surface.

Must end on or before the decision date.

The chart should be small and labeled as the price path into the decision. It
must not use trading-dashboard affordances, indicators, volume, or copy that
implies it is the signal. Whole-card review must consider chart shape; a meme
silhouette or a chart/prose combination that makes Long or Short obvious fails
the directional-sentiment review.

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

For the first 40 scenarios (D034; ratio unchanged from the original 100-card
plan):

```text
24 famous or highly recognizable companies
12 moderately known companies
4 obscure/hard-mode companies
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
- Include misleading hints.
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
