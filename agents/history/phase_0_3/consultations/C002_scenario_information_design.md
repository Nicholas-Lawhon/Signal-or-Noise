# C002 — Scenario Information Design

**Date:** 2026-07-08
**Question:** What pre-decision information should Signal or Noise? show so scenario rounds are fair, engaging, resistant to directional sentiment leaks, and fun?
**Recommendation:** Adopt a **Balanced Tension Card**: always show matched Long case + Short case as first-class fields, keep difficulty as identity-specificity plus optional setup detail (Easy 1 extra / Medium 0–1 / Hard 0), demote the lookback chart to non-predictive atmosphere with hard authoring limits, and add directional-sentiment gates to Phase 3 validation and human review.

## Constraints That Matter Here

- Product is a **game** (trivia/decision fun), not a trading simulator or research terminal (`soul.md`).
- Actions stay **Long / Short / Pass**; confidence and scoring math stay locked (D017 and related).
- Difficulty is about **information given**, not swapping the company or return (D022).
- Hidden content must not leak company identity (D018, D019, D022 rulebook) and must not leak outcome.
- Call the Company stays optional and bankroll-neutral (D015).
- Classic Run pacing is Easy 10 / Medium 15 / Hard 20; Daily remains 10 (D025) — content model must work at all lengths.
- Doc 09 rulebook already requires a Decision-Informativeness Floor (Long driver + Short risk) and identity gates; playtests show **directional** leaks still dominate even when identity rules are roughly followed.
- Phase 3 will fossilize schema + validator; this memo should prevent freezing the wrong card structure.
- Mobile-first: the card must scan in ~30–60 seconds without terminal clutter (docs 02, 08).

## Diagnosis — Why Rounds Feel “Solved” Before Skill

### Current pre-decision model (as shipped)

Player sees, in order:

1. Era chip + decision date + holding period  
2. Title  
3. `companyDescription`  
4. `macroContext`  
5. Lookback sparkline  
6. 3 / 2 / 1 free-form `clues` (by difficulty)  
7. Optional Call the Company + Long/Short/Pass + confidence  

This is close to docs 02/08/09, but free-form prose + chart create two failure modes:

1. **Identity** already has a rulebook (C001/D022).  
2. **Directional sentiment** — the correct Long/Short is telegraphed without naming the company — is only lightly covered (informativeness floor says *include both sides*, not *balance them* or *strip loaded framing*).

### Four directional-sentiment leak patterns

#### 1. Asymmetric case strength (one side is concrete, the other is filler)

The card names both sides, but only one side has an anchored fact; the other is generic (“investors may rotate,” “margins may slip”). Players correctly treat the weak side as decorative and take the strong side.

| Bad wording | Rewrite pattern |
|-------------|-----------------|
| “Revenue is growing rapidly as more shoppers move online. The short case is that investors are uncertain.” | Pair **matched anchors**: “Online order volume is still compounding. Cash burn and a valuation that already prices perfect execution leave little room if funding sentiment flips.” |

#### 2. Loaded evaluative language (outcome adjective leakage)

Words that smuggle hindsight or moral judgment: *hurt*, *punished*, *doomed*, *exploded*, *unstoppable*, *self-inflicted disaster*, *clear winner*. Even with dual cases, tone tells the player which side “won historically.”

| Bad wording | Rewrite pattern |
|-------------|-----------------|
| “A recent pricing disaster destroyed trust, but streaming could explode.” | Neutral event + open resolution: “A pricing and packaging change triggered cancellations; management is betting a newer delivery model rebuilds the base before content costs outrun growth.” |

#### 3. Hindsight-thesis / famous-story framing (directional edition)

Same class as identity hindsight bans, but for **direction**: “the market’s now-famous story” of a winner or loser. Player doesn’t need company name if the narrative shape is “inevitable multi-year compounder” or “obvious value trap.”

| Bad wording | Rewrite pattern |
|-------------|-----------------|
| “Its chips for gaming are increasingly useful for heavier computing — the defining platform shift of the era.” | Present-tense unresolved demand: “A specialty hardware line is finding buyers outside its original niche; whether that becomes durable commercial demand or a cycle spike is unresolved.” |

#### 4. Chart-as-oracle (momentum / reversal heuristics)

Parabolic lookbacks invite “must short the top”; long muted climbs invite “ride the trend.” Combined with bullish or bearish prose, the chart closes the case. Famous rocket shapes also aid identity triangulation (already noted in placeholder comments).

| Bad pattern | Rewrite / design pattern |
|-------------|----------------------------|
| 8 points: 2 → 4 → 7 → 15 → 28 → 45 → 62 → 76 under short-leaning “valuation already ran” copy | Prefer **non-meme path shapes**; label as “path into decision, not a prediction”; never let chart + copy both scream the same side; if price ran hard, the Long case must still be concrete (why it could keep working), not only “momentum.” |

#### Bonus leak types (also common in the placeholder deck)

5. **Title bias** — “Defensive Compounder,” “Peak Expectations” pre-answer the call. Titles must stay Hard-bar *and* direction-neutral.  
6. **Macro as cheerleader** — macro that only describes the winning backdrop (“adoption is exploding”) without the counter-risk of that same era.

## Options Considered

### Option A — Balanced Tension Card (recommended)

**Structure (player-visible):**

```text
Always shown (all difficulties):
  era · decision date · holding period
  title
  companyDescription
  macroContext
  lookback chart (demoted presentation; see chart rules)
  longCase          // 1 short paragraph / sentence, concrete
  shortCase         // 1 short paragraph / sentence, concrete, matched strength
  situation         // 1 line: unresolved question (optional label "The debate")

Difficulty extras (setup detail only):
  Easy:   +1 setup clue (B or M taxonomy)
  Medium: +0 or +1 setup clue (prefer 0 when identity risk is high)
  Hard:   +0 setup clues
```

**Pros**

- Makes dual-case the *UI contract*, not an authoring hope buried in free-form bullets.
- Fairness: every difficulty has a real Long vs Short argument; Hard is harder on **identity and setup detail**, not on “guess which side the adjectives favor.”
- Mobile-readable: two labeled cases scan faster than 3 prose bullets that bury the tension.
- Call the Company still works: identity still lives in description + setup specificity ladder (D022).
- Validator can check structure (presence, length, banned sentiment lexemes, matched-strength heuristics).
- Authoring for 100 cards: slightly more structure, less rewrite thrash from “balanced but free-form” ambiguity.

**Cons**

- Soft-amends D022’s “clues are a free-form array of count 3/2/1.” Counts become **setup extras** 1 / 0–1 / 0 while tension is always dual. Orchestrator/user must approve as D022 clarification, not silent drift.
- Schema + UI change for Phase 3 (and later placeholder refresh).
- Risk of formulaic “on the one hand / on the other hand” tone if copy isn’t punchy — mitigated by style rules (short, concrete, game-like).

**Schema burden:** moderate (structured fields + validation).  
**Fun:** high if copy stays sharp.  
**Identity leak risk:** unchanged if specificity ladder kept.  
**Directional leak risk:** lowest of the three options.

### Option B — Market Setup Model

**Structure:** emphasize prior path, sentiment, valuation/setup, unresolved catalyst; de-emphasize explicit Long/Short labels.

```text
companyDescription
macroContext
setup: { priceContext, valuationOrBalanceSheet, sentiment, unresolvedCatalyst }
lookback chart (more central)
optional clues by difficulty
```

**Pros**

- Feels “analyst briefing light” without telling players Long or Short.  
- Chart has a natural home as price context.

**Cons**

- Higher risk of **finance-product feel** vs game (soul.md / doc 08).  
- Without labeled dual cases, authors still smuggle direction via setup wording (“overextended,” “underappreciated”).  
- Mobile density: four setup facets crowd the card.  
- Hard mode becomes either random or still direction-leaky.  
- Call the Company competes with denser setup language for attention.  
- Higher authoring skill bar for 100 cards.

**Verdict:** useful vocabulary *inside* Balanced Tension (setup clues), not as the whole card model.

### Option C — Chart-Light / Chart-Reworked Model

**Variants:**

- **C1 Remove chart** from main decision card; outcome chart only on reveal.  
- **C2 Collapsed chart** (“Show price path”) default hidden on mobile.  
- **C3 Atmosphere chart** always visible but small, unlabeled axes, no “signal” framing, strict shape rules.

**Pros of rework (C3):** keeps visual rhythm and reveal contrast (lookback → outcome); satisfies “chart as clue, not terminal” (doc 08).  
**Cons of full remove (C1):** loses a distinctive game surface and some era texture; reveal is less “satisfying before/after.”  
**Cons of central chart:** momentum heuristics and identity triangulation.

**Verdict:** do **not** center the model on the chart; do **not** fully remove it. Pair Option A with **C3 atmosphere rules**.

## Recommendation & Rationale

**Recommend Option A + Option C3: Balanced Tension Card with demoted lookback chart.**

### Why this over pure Market Setup or chart-first

Playtests fail on *predictable direction*, not missing valuation jargon. The fix is **force matched opposing cases in the UI**, then scale **how much identity/setup** you get — which is already the spirit of D022’s informativeness floor and clue taxonomy, made enforceable.

Keeping a free-form 3/2/1 list without labeled dual cases will keep regenerating the same leak class even after identity cleanup.

### Answers to the six design questions

#### 1. What fields should a pre-decision scenario card have in Phase 3?

**Shared scenario shell (not difficulty-specific):**

| Field | Role |
|-------|------|
| `title` | Flavor only; Hard identity bar **and** direction-neutral |
| `era` / era label | Context |
| `decisionDate` + display label | Context |
| `holdingPeriodLabel` | Context |
| `lookbackSeries` (or market points) | Atmosphere price path into decision |
| Reveal-only: name, ticker, outcome series, return, reveal text, fun fact | Never pre-decision |

**Per difficulty variant:**

| Field | Role |
|-------|------|
| `companyDescription` | Identity axis; L3/L2/L1 caps (unchanged ladder) |
| `macroContext` | Era weather; must not cheerlead one side |
| `situation` | One-line unresolved debate (neutral) |
| `longCase` | One concrete Long driver (anchored fact) |
| `shortCase` | One concrete Short risk (anchored fact, matched strength) |
| `setupClues` | `string[]` length Easy 1 / Medium 0–1 / Hard 0; B or M taxonomy only |
| (optional internal) `clueTaxonomy` tags for review | Not required player-visible |

Player UI order (mobile):

```text
Era · Date · Holding period
Title
companyDescription
macroContext
Lookback (small, labeled “Price path into this decision”)
The debate: situation
Long case | Short case   (two stacked blocks, equal visual weight)
[Easy/Medium] Setup: setupClues
Call the Company
Long / Short / Pass · Confidence
```

#### 2. Which fields are shown at all difficulties, and which vary?

| Always | Varies by difficulty |
|--------|----------------------|
| title, era, dates, holding period, lookback | specificity of `companyDescription` / `macroContext` |
| `situation`, `longCase`, `shortCase` | wording specificity of those three (same caps as today’s clues) |
| | `setupClues` count: 1 / 0–1 / 0 |
| Call the Company (optional interaction) | how guessable identity is (unchanged gates) |

#### 3. How should each difficulty differ beyond clue count?

Beyond setup count, keep D022’s dual axis:

- **Specificity ladder** on description, macro, situation, and both cases (Easy may use L3; Hard L1–L2).  
- **Plausible company sets** for Gate 1 / Guessability Gate 2 (unchanged thresholds).  
- **Hard** must still satisfy Decision-Informativeness Floor *inside* `longCase`+`shortCase`+`situation` — never vague “challenges ahead.”  
- **Easy** may make Call the Company realistically attainable; **Hard** should not.  
- Do **not** change bankroll, return, or company by difficulty.

**Proposed D022 clarification (needs user approval):** “Clue count Easy 3 / Medium 2 / Hard 1” becomes “**decision payload weight**”: always dual cases + situation, plus **setup clue count** 1 / 0–1 / 0. Net player-facing decision sentences ≈ Easy 4 / Medium 3–4 / Hard 3 — Hard remains hard because language is abstract and identity is murky, not because one side is deleted.

If the orchestrator refuses any D022 reopen: implement Balanced Tension as **authoring/validation rules only** (still free-form `clues[]` with counts 3/2/1) where Easy must be [setup, long, short], Medium [long, short] or [situation, dual], Hard [single dual-tension clue], and UI may still *render* long/short labels by parsing or by adding non-breaking structured fields mirrored into clues. Prefer explicit schema fields (cleaner).

#### 4. Lookback chart: stay, change, optional, or remove?

**Stay, demoted (atmosphere), not optional for MVP v1.**

Rules:

- Label: **“Price path into this decision”** — never “signal,” “trend to follow,” or analysis chrome.  
- Visual: smaller height than today if needed; no volume, no indicators, no axis money labels that invite terminal feel.  
- **Authoring:** lookback must end on/before decision date (existing). Avoid meme parabolic silhouettes when era+sector already narrow identity. Prefer muted or mixed shapes unless the real path is essential and text cases are balanced.  
- **Gate:** whole-card review includes chart shape; if chart alone makes Long or Short >~70% obvious in red-team, reshape series presentation or rewrite cases so the other side is equally concrete.  
- **Do not** put the chart above the dual cases as the primary “answer.” Order: text context → small chart → dual cases.  
- Outcome chart remains reveal-only and is the payoff visual.

#### 5. Validator / human-review checks for directional sentiment

Add to Phase 3 pipeline (alongside D019 identity leakage):

**Automated (WARN or FAIL as noted):**

1. **Structural FAIL:** missing `situation`, `longCase`, or `shortCase`; wrong `setupClues` length for difficulty.  
2. **Length / emptiness FAIL:** either case below minimum substance (e.g. &lt; 12 non-space chars) or pure generics list (“uncertainty,” “volatility,” “competition”) with no scenario anchor.  
3. **Lexicon WARN→FAIL:** configurable loaded terms in hidden fields (`destroyed`, `exploded`, `doomed`, `unstoppable`, `no-brainer`, `obviously`, etc.) — human can override with note.  
4. **Title direction WARN:** titles matching compounder/collapse/peak/crash tropes.  
5. **Asymmetry heuristic WARN:** one case &gt; ~2× length of the other, or one case matches only generic patterns.  
6. **Optional LLM gate (FAIL):** same pinned model as guessability, prompt: “From this card only, is Long or Short more justified? Answer Long, Short, or Toss-up with confidence.” **Fail if confidence ≥ 0.65 for Long or Short** (calibrate in playtest; start strict). Complements company-guess Gate 2.  
7. Identity checks unchanged (literal + triangulation + guessability).

**Human review checklist additions:**

- Cover the Long case with your hand: is Short still concrete? Reverse.  
- Would a player who ignores the chart still face a real debate?  
- Title + macro + chart: do all three lean the same way? If yes, rewrite one.  
- No financial advice; no “you should have…” in pre-decision copy.

#### 6. Doc changes before Phase 3 implementation

**`docs/09_content_and_round_creation.md`**

- Extend Scenario Content Rulebook with **Directional Sentiment Rulebook** (the four leak patterns + rewrite patterns).  
- Redefine variant fields: `situation`, `longCase`, `shortCase`, `setupClues` (+ map from old `clues`).  
- Update AI prompt template and authoring workflow step 4 (Hard first still: write dual cases abstractly first).  
- Update validation + human checklists with sentiment gates.  
- Chart section: atmosphere role + shape rules.  
- Record D022 clarification once approved.

**`docs/06_data_model.md`**

- Update JSON seed example and `ScenarioVariant` fields accordingly.  
- Prisma sketch: replace single `clues Json` with structured strings + `setupClues Json`, or keep `clues` deprecated during migration.  
- Document lookback as required pre-decision series with presentation metadata if any.

**Do not change** scoring docs, bankroll math, or Call the Company rules.

### What Would Change This Recommendation

- Playtests show labeled Long/Short cases make players feel coached (finance-product feel) → drop labels, keep dual paragraphs under neutral headers (“Case A / Case B”) or “Support / Risk.”  
- Directional LLM gate is too noisy/expensive → rely on structure + lexicon + human dual-cover test only for MVP.  
- User insists D022 clue array is frozen literally → keep `clues: string[]` with fixed 3/2/1 but mandate ordered roles (Easy: setup, long, short; etc.) and teach UI to style indices  as cases.  
- Strong evidence lookback still wrecks fairness after demotion → collapse default (C2) or remove from main card (C1) in a later decision.

## Before / After Mini-Cards (placeholder-based)

Illustrative only — not production copy. Source placeholders: `apps/web/lib/sampleScenarios.ts`.

### 1. Amazon 1999–2001 (`proto_amazon_1999_2001`) — Easy

**Before (directional: short + chart rocket)**

```text
Title: Peak Expectations
companyDescription: An internet retailer expanding quickly across consumer categories.
macroContext: Internet valuations are peaking as investors start demanding proof of durable profits.
clues:
- Revenue is growing rapidly as more shoppers move online.
- The company is spending heavily on fulfillment, marketing, and expansion while losses mount.
- The stock has already run far ahead of current earnings, making a sentiment reversal dangerous.
lookback: steep multi-year melt-up silhouette
```

**After (Balanced Tension)**

```text
Title: Scale Receipts   // direction-neutral; still Hard-bar for identity
companyDescription: An internet retailer expanding quickly across consumer categories.
macroContext: Public markets are rewarding growth stories while starting to ask which models can fund themselves.
situation: Can scale spending become a durable advantage before capital gets less patient?
longCase: Category expansion and rising online order flow could lock in a fulfillment edge competitors cannot match quickly.
shortCase: Losses are still growing with the expansion plan, so any pullback in risk appetite hits a story that needs ongoing funding.
setupClues:
- Repeat purchases and a broadening catalog support the growth case if customers keep shifting online.
lookback: mixed/choppy advance into decision (not a pure rocket poster)
```

### 2. Coca-Cola 2010–2013 (`proto_cocacola_2010_2013`) — Medium

**Before (directional: long; weak short)**

```text
Title: Defensive Compounder
clues:
- The long case is durable demand, pricing power, and international volume growth.
- The short case is limited excitement if the recovery rewards more cyclical companies.
```

**After**

```text
Title: Steady Pour
companyDescription: A global consumer staples company built around repeat purchases.
macroContext: After the crisis, investors are balancing safety and renewed appetite for risk.
situation: Does reliable cash generation win the next few years, or does the recovery leave defensive names behind?
longCase: Global brands with pricing power and emerging-market volume can compound while still funding shareholder returns.
shortCase: A rich relative valuation and slower top-line growth can lag if capital rotates hard into cyclicals and higher-beta recovery trades.
setupClues: []   // medium with no extra setup; dual cases carry the round
```

### 3. Netflix 2012–2017 (`proto_netflix_2012_2017`) — Hard

**Before (better dual-case than most, still loaded + identity-adjacent)**

```text
companyDescription: A consumer-facing media company.
clues:
- Management is pushing into a newer distribution model after a self-inflicted trust hit,
  creating a scale upside case but a real retention and spending risk.
```

**After (structure explicit; language cooler)**

```text
companyDescription: A consumer-facing media company.
macroContext: Household internet habits are still shifting after the financial crisis.
situation: Will a newer delivery model rebuild the base fast enough to justify higher content and product spend?
longCase: If customers accept the new model, recurring revenue can scale with broadband and device adoption.
shortCase: A fresh trust shock can keep churn elevated while fixed content costs rise faster than the subscriber base.
setupClues: []
```

## Implementation Notes for the Handoff

Concrete steps for the orchestrator’s Phase 3 (and any interim doc) handoffs:

1. **Decision record:** draft D0xx “Balanced Tension Card + chart atmosphere + D022 clarification” for user approval before coding schema.  
2. **Docs first:** patch `docs/09_…` and `docs/06_…` per section 6 above; leave historical handoffs alone.  
3. **Schema (`packages/content`):**  
   - Variant Zod object:  
     `companyDescription`, `macroContext`, `situation`, `longCase`, `shortCase`,  
     `setupClues: z.array(z.string()).length` by difficulty (easy 1, medium 0–1, hard 0).  
   - Shared: title, dates, era, lookback series, outcome series, reveal, sources, review notes (fact bank, likely guesses, **directional red-team notes**).  
4. **Validator:** identity rules (D019) + new directional structural/lexicon/optional LLM toss-up gate.  
5. **UI (`apps/web`):** render labeled dual cases with equal visual weight; shrink/relabel lookback; stop assuming `clues: string[]` only.  
6. **Content:** do not mass-edit placeholder deck in the schema handoff unless scoped; Phase 3 samples (5–10 JSON) should demonstrate Balanced Tension. Full 100-card library follows Content Curator under new rulebook.  
7. **Do not touch:** game-engine scoring, confidence, bankruptcy, Call the Company scoring, D025 round counts.  
8. **Playtest metrics to watch:** % of rounds where players report “obvious Long/Short before thinking”; Pass rate; Easy vs Hard accuracy gap; Call the Company hit rate by difficulty.  
9. **Migration note:** if old `clues[]` remains temporarily, provide a one-way map:  
   - Hard: `clues[0]` ← compose situation+cases for legacy UI only; prefer dual fields as source of truth.

## Acceptance Self-Check (H013)

| # | Criterion | Met |
|---|-----------|-----|
| 1 | Memo exists in consultant format; one-sentence recommendation in first three lines | Yes |
| 2 | ≥4 directional leak patterns with bad wording + rewrite | Yes (4 + 2 bonuses) |
| 3 | 2–3 models evaluated on instruction-6 criteria | Yes (A/B/C) |
| 4 | One recommendation answers all six instruction-7 questions | Yes |
| 5 | ≥3 before/after mini-cards from placeholders | Yes (Amazon, Coca-Cola, Netflix) |
| 6 | Implementation notes with schema + validator/review checks | Yes |
| 7 | No code/schema/scenario/non-memo doc edits in this session | Yes (memo + progress only) |
