# C001 - Scenario Content Rulebook Review
**Recommendation:** Adopt with the numbered fixes below before H009 authors any replacement cards.
**Date:** 2026-07-07
**Question:** Is the D022 Scenario Content Rulebook sound enough to author cards under?

## Constraints That Matter Here

The rulebook must preserve the locked product shape: a game, not a finance tool; hidden company identity before reveal; Easy/Medium/Hard variants with 3/2/1 clues; and no changes to scoring, Call the Company, or the D013 return mix. Placeholder content is bound by the same leak rules as curated content under D018.

The current rulebook is directionally strong. Its weak point is enforceability: several rules operate at sentence level, while real leaks happen across title, era, dates, company description, macro context, chart shape, and one clue. The LLM guessability gate is meant to catch that, but it is too underspecified to be the only backstop.

## Options Considered

### Option A - Adopt as-is

Pros: H009 can start immediately; the rulebook already catches literal leaks, obvious famous-story phrasing, and fully vague Hard cards better than the old docs.

Cons: Authors can still create compliant-looking cards that collapse to one or two companies through cross-field triangulation. The guessability test is model-dependent and lacks numeric thresholds, so two reviewers can pass/fail the same card differently.

### Option B - Adopt with targeted fixes

Pros: Keeps D022 intact while closing the practical holes before card generation. The fixes are mostly wording and checklist/schema additions, not architecture.

Cons: Slightly more authoring overhead, especially around red-team alternatives and calibrated examples.

### Option C - Rework the rulebook

Pros: Could redesign difficulty from first principles.

Cons: Not warranted. The major structure is sound and aligns with `soul.md`, D018, D019, and D022.

## Recommendation & Rationale

Adopt with fixes. The rulebook is good enough as a base, but not good enough to author under unchanged because it lets "technically compliant" cards leak through triangulation and leaves Hard informativeness too subjective.

## Attack Findings

### 1. Compliant-but-leaky examples

These examples are attacks against the written static rules. A strong guessability test should catch many of them, but the current protocol is too loose to guarantee that.

**Example A - Interface-era triangulation leak**

```text
Title: Holding the Line
Era: Smartphone platform era
Decision date label: Jun 2008
companyDescription: A mobile communications company serving professional users.
macroContext: Touchscreens and app ecosystems are reshaping mobile computing.
Hard clue: An incumbent is defending a keyboard-centered workflow while rivals make cheaper, touch-first devices easier to adopt.
```

Why it leaks: each sentence can plausibly point to multiple companies, but the combination strongly identifies BlackBerry/RIM. The rulebook bans "company-unique events" and requires each sentence to describe three companies, yet it does not explicitly ban distinctive interface/form-factor hooks when paired with era/date.

Proposed rule: see Fix 1 and Fix 2.

**Example B - Duopoly collapse**

```text
Title: Tiny Toll
Era: Post-financial-crisis recovery
Decision date label: Jan 2011
companyDescription: A payments network earning small fees on large transaction volume.
macroContext: Cash is giving way to cards and digital payments around the world.
Medium clues:
- The company does not take credit risk, but benefits when more commerce moves electronically.
- Its scale makes each additional transaction highly profitable if consumer spending keeps recovering.
```

Why it leaks: this can satisfy L2/L3 wording and the sentence-level three-companies test if the reviewer accepts "payments network" broadly, but in public equities it collapses mainly to Visa or Mastercard. A two-answer card makes Call the Company feel like a coin flip rather than a knowledge test.

Proposed rule: see Fix 3.

**Example C - Category-origin plus date leak**

```text
Title: Growth at the Edge
Era: Dot-com bubble and aftermath
Decision date label: Dec 1999
companyDescription: An online retailer expanding from a narrow starting category into many consumer categories.
macroContext: Internet valuations are peaking as investors start demanding proof of durable profits.
Medium clues:
- Revenue is rising quickly, but losses are mounting as the company funds fulfillment and category expansion.
- The long case is that scale creates a durable commerce platform; the short case is that the bubble is ending before profits arrive.
```

Why it leaks: no literal banned term appears, and every sentence can be argued to fit several dot-com retailers. In practice, "online retailer + narrow starting category + Dec 1999 + fulfillment + durable commerce platform" points straight at Amazon, even without "books" or "customer obsession."

Proposed rule: see Fix 1 and Fix 4.

**Example D - Famous hindsight tailwind**

```text
Title: Parallel Paths
Era: Cloud and AI acceleration
Decision date label: Jan 2015
companyDescription: A chip designer with a strong gaming business.
macroContext: Data centers are experimenting with new hardware for parallel workloads.
Easy clues:
- Its core chips were built for gaming but are increasingly useful for heavier computing tasks.
- Investors are debating whether the new demand pool is real or just another cycle.
- A successful expansion would make the company much larger than a niche hardware supplier.
```

Why it leaks: Easy is allowed to be more guessable, but this is effectively Nvidia because the famous hindsight tailwind is now the company's public identity. The current bans cover products, slogans, and one-answer superlatives, but not "future-famous thesis phrasing."

Proposed rule: see Fix 4.

### 2. Compliant-but-random Hard example

```text
Title: Against the Current
Era: Post-financial-crisis recovery
Decision date label: Jan 2010
companyDescription: A public company in a cyclical sector.
macroContext: Markets are recovering while investors debate whether demand has normalized.
Hard clue: Management faces a changing demand environment while investors debate whether margins can hold.
```

Verdict: the current Decision-Informativeness Floor probably catches this in spirit, but not reliably as written. A reviewer can articulate generic Long and Short cases: Long if demand recovers, Short if margins fall. That satisfies the literal "why Long might be right AND why Short might be right" language while giving no scenario-specific information.

Needed change: see Fix 5.

### 3. Guessability-test calibration

Verdict: "top 3" is too blunt by itself.

Easy: correct in top 3 is necessary but not sufficient. Easy can be #1, but should not become a literal one-answer card caused by banned identity details.

Medium: "single confident #1" is subjective. One model may output confidence percentages, another may not. "2-4 plausible alternatives" is better than the top-3 wording, but the pass/fail rule needs to define plausible.

Hard: "correct company must not appear in top 3" can pass a card where the correct company is #4 with meaningful confidence, or fail a fair card because one model over-associates the era. Hard should be judged by rank and confidence margin, not rank alone.

Needed change: see Fix 6.

### 4. Taxonomy completeness

Verdict: B/S/M are close, but not quite complete. Many fair stock-history decisions need a market setup or financial-condition clue: valuation, balance-sheet stress, margin pressure, dividend support, backlog conversion, sentiment, or prior price run. Some can be forced into S or M, but that ambiguity will make authoring inconsistent.

Hard S-only is directionally right because the situation is the game. But it over-constrains macro-driven or balance-sheet-driven windows, where the fair decision signal is "strategic situation plus market/financial setup." A 2008-style window often needs liquidity, leverage, demand shock, or valuation context to avoid randomness without naming the company.

Needed change: see Fix 7.

### 5. Ladder ambiguity

Verdict: L2 vs L3 is under-specified. Two reasonable authors can classify the same sentence differently:

- "A cloud software company" could be L2 industry or L3 model.
- "A subscription service moving from physical delivery to digital delivery" is listed as L3, but a reviewer may see the transition as L4 in the streaming era.
- "A payments network that does not lend money" reads like a business-model detail, but in practice narrows to a tiny peer set.
- "A legacy software giant" may look like L2/L3, but "giant" plus era can become identifying.

Needed change: see Fix 8.

### 6. Consistency check

`soul.md`: no contradiction. The rulebook reinforces hidden identity, title-hardness, no outcome leakage, and the entertainment/trivia posture.

D013: no contradiction. Return mix is a deck-composition rule; the content rulebook does not change payouts or return distribution.

D015: no formal contradiction. Fewer Hard clues make Call the Company harder, but blank guesses are allowed and the +2/-1 scoring can stand. The tension is calibration: if Hard explicitly requires the correct company not to appear in top 3, the bonus becomes rare by design. Track this in review notes/playtests rather than changing scoring here.

D018: aligned. The rulebook correctly applies content-integrity rules to placeholders and curated cards.

## Numbered Fixes

1. **Add a whole-card triangulation gate before the LLM test.** Require the reviewer to evaluate the full pre-decision payload together: title, era, date label, companyDescription, macroContext, clues, and lookback chart shape. A variant fails if the combined payload leaves fewer than the required plausible alternatives, even when every sentence passes the three-companies test.

2. **Add a distinctive-hook ban.** Treat interface/form factor, distribution channel, category origin, regulatory event, pricing incident, store footprint, product architecture, and customer segment as identity-bearing when paired with era/date. If a hook is famous for this company in that window, downgrade, abstract, or move it to reveal-only.

3. **Define minimum plausible alternatives per difficulty using public-company peers.** Easy should have at least 2 plausible guesses, Medium 2-4 plausible guesses with no dominant answer, and Hard at least 4 plausible guesses with the correct company not dominant. "Plausible" means a real public company in the same broad era whose hidden facts could fit without contradiction.

4. **Ban famous hindsight thesis phrasing in hidden content.** If a phrase is how the market now remembers the company, sector, or winning thesis, it belongs in reveal text unless at least three public companies share that same hindsight story.

5. **Sharpen the Decision-Informativeness Floor.** Require each variant to contain at least one concrete Long driver and one concrete Short risk, both tied to the scenario's real fact bank. Generic drivers such as "demand may recover," "margins may fall," "competition is rising," or "investors are uncertain" do not count unless anchored to a specific non-identifying fact.

6. **Make the Guessability Test deterministic and thresholded.** Use the same pinned model, temperature 0, no web access, and the same prompt for every card. Require top 5 guesses with confidence. Suggested thresholds: Medium fails if the correct company is #1 with at least 40% confidence or a 15-point lead over #2; Hard fails if the correct company appears in top 5 with at least 15% confidence, or if any single guess exceeds 50% confidence.

7. **Expand taxonomy or explicitly broaden M.** Either add `F - Financial/market setup clue` for valuation, balance sheet, margins, backlog, prior run-up, dividend support, or sentiment; or rename M to "Market-position/setup clue" and list these examples. For Hard, require the one clue to be S-led, but allow it to include one non-identifying setup element.

8. **Add ladder escalation rules and calibrated examples.** A sentence escalates one level when it combines two or more of: business model, customer segment, distribution channel, strategic transition, era-specific event, or market position. Any sentence plus date/era that leaves fewer than three plausible public companies becomes L4 even if the sentence alone looks L2/L3.

9. **Require likely-guesses lists to include reasons.** For each likely guess, reviewers should record the hidden fact that points there. If every reason points uniquely to the correct company, revise even if the list has enough names.

10. **Add sample pass/fail cards to the rulebook before H009.** Include at least one pass/fail example each for Easy, Medium, and Hard, using the current placeholder leak patterns: streaming pivot, smartphone keyboard incumbent, dot-com retailer, cloud software incumbent, and payments network.

## What Would Change This Recommendation

If H009 is limited to a temporary playtest deck and the orchestrator accepts likely follow-up churn, the team could author under the current rulebook and let playtest expose calibration problems. For durable Phase 3 content, these fixes should land first.

If the future composite Information Tier design changes how difficulty affects scoring, the Call the Company calibration should be revisited. That is not a blocker for this memo because D015 remains settled.

## Implementation Notes for the Handoff

For the next doc-revision handoff, bake the fixes into `docs/09_content_and_round_creation.md`, then ask the H009 card author to produce per-variant likely-guesses lists with reasons. H009 should not regenerate all 12 cards until the revised rulebook has at least calibrated pass/fail examples for the specific leak classes already present in `apps/web/lib/sampleScenarios.ts`.
