# Signal or Noise? — Scenario Card Visual Schema

This document describes how scenario-card content should map into the UI.

## Scenario card concept

A scenario card is not just a company profile. It is a specific company during a specific historical decision window.

The player sees hidden, difficulty-adjusted information before making the call.

The player sees the company, ticker, outcome, and reveal text only after locking a call.

## Required scenario data areas

### Hidden pre-decision content

Visible before call:

- Scenario title or codename.
- Decision date.
- Holding period.
- Sector/industry clue.
- Macro context.
- Hidden company description.
- Three clues.
- Pre-decision lookback chart.

Not visible before call:

- Company name.
- Ticker.
- Future return.
- Outcome chart.
- Reveal text.

### Reveal content

Visible after call:

- Company name.
- Ticker.
- Date range.
- Actual return.
- Player result.
- Bankroll change.
- Signal Score change.
- Outcome chart.
- Short reveal explanation.
- Fun fact/trivia line.

## Difficulty variants

Each scenario should include Easy, Medium, and Hard hidden-card variants.

### Easy variant

Use when the player wants a more accessible game.

Content style:

- More direct industry clue.
- More recognizable business model clue.
- More helpful macro context.
- Clues can be more specific, but still avoid name/ticker/product giveaways.

### Medium variant

Default game experience.

Content style:

- Balanced specificity.
- Clear but not obvious industry and business hints.
- Three useful clues.

### Hard variant

Use for advanced players.

Content style:

- Less identifying company detail.
- Broader sector language.
- More ambiguous clues.
- Still fair, not random.

## Suggested UI mapping

```text
Scenario Header
- Scenario codename
- Decision date
- Holding period
- Difficulty

Chart Section
- Pre-decision lookback chart
- Date labels only

Market Climate Section
- Macro context

Hidden Company Section
- Company description
- Sector/industry clue

Clues Section
- Clue 1
- Clue 2
- Clue 3

Decision Section
- Long / Short / Pass
- Confidence buttons
```

## Example hidden card copy

```text
Scenario Codename:
The Streaming Pivot

Decision Date:
January 2012

Holding Period:
5 years

Market Climate:
Consumers are adopting broadband internet and connected devices while investors are still cautious after the financial crisis.

Hidden Company:
A U.S. consumer-facing media business attempting a major distribution shift.

Clues:
1. The old model still matters, but the new model is the real bet.
2. Recent management decisions damaged investor trust.
3. The upside case depends on recurring customer growth.
```

## Example reveal copy

```text
That was Netflix. The market was skeptical, but streaming adoption exploded. A bold long call would have crushed this round.
```

## Source/citation handling

Scenario cards should include source URLs and notes for review, but citations should not be shown to the player in normal gameplay.

Possible internal fields:

- priceDataSource.
- companyProfileSource.
- macroContextSource.
- reviewNotes.
- reviewerStatus.

