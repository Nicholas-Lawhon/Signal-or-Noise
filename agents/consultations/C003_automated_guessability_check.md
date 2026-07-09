# C003 — Automated Gate 2 Guessability Check

**Date:** 2026-07-09
**Question:** How should the automated Gate 2 guessability check (D019/D022) be designed — protocol, thresholds, model, pipeline placement, storage, and cost — so that a card passing the automated gates is trustworthy enough to activate?
**Recommendation:** Add a Node-only `gate2` CLI to `packages/content` that renders each variant's exact pre-decision payload, makes **one deterministic forced-tool-call per variant** to a pinned **`claude-sonnet-4-6`** (temperature 0, thinking off, no web access) asking for top-5 company guesses with confidence + pointing facts, plus a second direction-leakage call; store the **raw guess distribution** in the scenario JSON under `review.gate2` keyed by a content hash of the payload; and have the existing **offline** `validate` command fail any `reviewed`/`active` card whose stored Gate 2 result is missing, stale, or below the doc 09 thresholds — so validation stays network-free while an unreachable model can never count as a pass.

## Scope note: no conflict with the soul.md AI-content ban

`soul.md` bans **dynamic AI-generated content in production gameplay**. This design is a **validation-time tool**: the model is called only inside the content pipeline (author's machine / CI), only to *judge* human-reviewed cards, and its output never reaches a player or the game runtime. Nothing here generates gameplay content. Future readers: the ban and this gate are complementary — the gate exists precisely so that the human-curated cards the game *does* serve are safe.

## Constraints That Matter Here

- **D022 (2nd amendment)** commits to automating Gate 2 with "a pinned model at temperature 0" and defines the thresholds as tunable calibration values. Doc 09 specifies the protocol: full pre-decision payload, fresh session, top-5 guesses with confidence, per-difficulty thresholds, plausible-alternative minimums (Easy ≥2 / Medium 2–4 / Hard ≥4).
- **API reality (July 2026):** Anthropic's newest models (Claude Sonnet 5, Opus 4.7/4.8, Fable 5) **reject the `temperature` parameter entirely** (HTTP 400). Temperature 0 is only available on Sonnet 4.6 and older generations. Even where supported, temperature 0 never guaranteed bit-identical outputs. D022's determinism intent therefore needs a slightly broader reading — see Decision Point 1.
- **D024:** `pnpm validate` is part of the routine dev loop and CI verification. It must stay fast, offline, and deterministic. A network call inside default validation would break every executor's verification step and make CI secret-dependent.
- **D027:** Part B will generate ~100 cards; the gate must be cheap per card, cacheable, and runnable in bulk. Fail-closed matters more than convenience — the user's stated goal is guards trustworthy enough to add cards "without fear."
- **JSON-file pipeline until Phase 5** — results must live in files, not a database. **Windows** is the dev machine — Node/tsx only, no bash.
- **H018 precedent:** business rules that block by status block `reviewed`/`active` and exempt `draft`/`inactive`/`archived`.
- **C002:** directional-sentiment leakage is a parallel failure mode; C002 sketched an LLM toss-up gate (fail if the model calls Long/Short with ≥ 0.65 confidence) and warned it needs calibration.
- Gate 1 (human whole-card triangulation review) is **not** replaced by this automation; Gate 2 automation is the falsifiable backstop, per doc 09.

---

## The Nine Questions

### Q1 — Test protocol

**Payload.** Per difficulty variant, render exactly what the player sees before deciding — no more, no less:

| Payload field | Source |
|---|---|
| Title | `scenario.title` |
| Era / decision date / holding period | `scenario.era`, `decisionDateLabel`, `holdingPeriodLabel` |
| Company description, macro context | variant fields |
| The debate / Why it might work / What could break | variant `situation`, `longCase`, `shortCase` (rendered under the player-facing labels) |
| Setup hints | variant `setupHints` |
| Lookback chart | `marketData.lookbackPrices` **normalized** (indexed to first value = 100, 1 decimal) |

Include the lookback series: doc 09's Gate 2 says "the same full pre-decision payload," and C001 showed chart shape participates in triangulation. Normalize it because the player sees an unlabeled sparkline (shape, not price levels) — feeding raw split-adjusted prices (e.g. Netflix's $10.32) would give the model *more* identity information than a player has. Exclude everything reveal-side: company block, outcome data, `outcomeLabel`, reveal, sources, review metadata.

**Prompt shape.** A fixed, versioned instruction block (stored in code as `GUESS_PROMPT_V1`) + the rendered payload as the user message. Instruction essence: *"You are a knowledgeable market-history player of a guessing game. From this card alone, name the hidden public company. Return your top 5 guesses with a confidence percentage for each (summing to ≤ 100) and, for each guess, the single card fact that points there."* The response is forced through a tool call (`tool_choice: {type: "tool", name: "record_guesses"}`) with a JSON schema — the model cannot reply free-form — and validated with Zod client-side.

**Attempts.** Exactly **one scored attempt per variant per test**. No best-of-N — repeated sampling reintroduces the nondeterminism D022 is trying to remove. Retries happen only for transport errors (backoff, max 3) and for schema-invalid output (1 re-ask); an attempt that never yields valid output produces **no stored result**, which downstream counts as fail for `reviewed`/`active` (see Q5).

**Determinism vs. distribution — reconciled.** D022 wants determinism; doc 09 wants a guess distribution. These are compatible: one deterministic call returns a *ranked distribution* (top-5 + confidence) as its single output. Determinism is achieved by pinning: model ID, prompt version, temperature 0, thinking omitted (runs without thinking on Sonnet 4.6), no web/search tools (the API model has no web access unless granted). Residual nondeterminism (temperature 0 is near- not bit-deterministic) is neutralized by **caching**: a card's raw result is computed once, stored, and reused until the payload changes — so a card's verdict cannot flip-flop between runs (Q6).

### Q2 — Pass/fail semantics

**Correct-guess judging.** Normalize each returned guess the same way D015 normalizes Call-the-Company input (lowercase, alphanumerics only) and match against `company.name`, `company.ticker`, and `company.acceptedNames`. This reuses existing data; no new authoring burden. From the distribution derive: `correctRank` (1–5 or absent), `correctConfidence`, `leadOverSecond` (confidence gap between #1 and #2 when correct is #1).

**Thresholds (doc 09 mapped to machine checks; all values live in one config object, tunable without reopening D022):**

| Difficulty | FAIL when | WARN when | PASS otherwise |
|---|---|---|---|
| Easy | correct absent from top 5 (too vague) | correct at rank 4–5 (doc 09 says "should appear in top 3") | correct in top 3 (MAY be #1) |
| Medium | correct is #1 with ≥ 40% confidence, **or** correct leads #2 by ≥ 15 points | — | |
| Hard | correct appears in top 5 with ≥ 15% confidence | — | |

The Easy rank-4–5 → WARN mapping is my proposed reading of doc 09's "should appear in top 3 / missing from top 5 = fail" (it leaves ranks 4–5 undefined) — Decision Point 3.

**Plausible alternatives, machine-checked.** Approximate Gate 1's candidate counts from the same distribution: a guess is *plausible* if its confidence ≥ a floor (default **10%**, config) and it carries a pointing fact. Checks: Easy ≥ 2 plausible guesses; Medium 2–4 plausible with no guess ≥ 40% (dominance); Hard ≥ 4 plausible with the correct company not among the dominant ones. These run at **WARN** tier initially — they are a proxy for a human judgment ("real public company whose facts fit without contradiction"), and a model can pad a list with implausible names. Gate 1's human count remains the authority; the automated count is a red flag generator.

**Cross-check against red-team lists (feeds A005 MINOR-4).** WARN when the model's top-5 shares zero names with `review.{difficulty}LikelyGuesses` — either the curator's red-team list is placeholder junk (the MINOR-4 disease: `["semiconductor peers"]`) or the card behaves differently than the author expected. Both deserve human eyes. H020's likely-guess quality floor (named companies, minimum counts) should land alongside so this cross-check has real lists to compare against.

### Q3 — Direction leakage: include it now

**Recommendation: yes — same harness, separate check, WARN-first.** A second call per variant, same payload, prompt (`DIRECTION_PROMPT_V1`): *"From this card only, is Long or Short the more justified call over the stated holding period? Answer `long`, `short`, or `toss_up` with a confidence percentage and the single strongest cue."* Flag when the answer is not `toss_up` and confidence ≥ **65%** (C002's threshold), or when the flagged direction matches the card's actual winning direction (the damning case — record both).

Why now, not deferred: the harness cost is already paid (payload rendering, caching, storage, CLI are identical), the marginal API cost is ~$0.005/variant, and D027's rationale — retire content risk before Part B — applies to direction leaks exactly as much as identity leaks; playtests showed direction was the *dominant* leak (C002). Why WARN-first: C002's 0.65 threshold is unvalidated; a blocking gate with a noisy threshold would stall the Part A re-review on false positives. Run it as WARN over the 6 active seeds and the first Part B batch, calibrate, then promote to FAIL — Decision Point 2. The raw direction result is stored either way, so promotion is a config change with no re-testing.

### Q4 — Model choice & drift

**Pin `claude-sonnet-4-6`** (that alias is the complete, stable model ID — current-generation Sonnet models have no separate dated snapshot).

- **Strong-player fidelity:** Sonnet-tier world knowledge comfortably covers famous public-company history — the scenario windows are all years in the past, so knowledge cutoff is irrelevant. It is the strongest current Anthropic model that still accepts `temperature: 0` and runs with thinking off, i.e. the strongest model on which D022's determinism clause is literally implementable.
- **Cost:** $3 / $15 per MTok ⇒ ~$0.01 per call (Q8). Cost is a non-issue at this scale; the choice is driven by guesser quality, exactly as the handoff directs.

**Alternative A — `claude-haiku-4-5-20251001`** (dated snapshot, $1/$5). Rejected as the primary: a weaker guesser produces exactly the failure the handoff warns about — false confidence. A card that Haiku can't crack but a strong player (or Sonnet/Opus) can would pass the gate and leak in production. Viable later as a cheap pre-screen in front of the real gate if volume ever makes cost matter.

**Alternative B — `claude-sonnet-5`** (current-gen, stronger, $3/$15). The better *guesser*, and the more durable pin (Sonnet 4.6 is previous-generation and will deprecate sooner). But it rejects `temperature` outright, so pinning it requires amending D022's temperature-0 wording first (Decision Point 1). If the orchestrator adopts that amendment now, B becomes my recommendation over 4.6; without it, 4.6 honors the decision as written. Opus 4.8/Fable 5 are stronger still but share the no-temperature constraint at 1.7–3.3× the cost — overkill for "strong knowledgeable player."

**Drift / re-baseline protocol.** Every stored result records `model` and `promptVersion`; the pinned values live in one config file. Re-baseline when (a) Anthropic deprecates the pinned model (they announce retirement dates well ahead), (b) thresholds appear miscalibrated in playtest, or (c) the prompt changes:

1. Maintain a small **golden fixture set** in the repo: doc 09's calibrated FAIL examples authored as fixture cards (keyboard-incumbent Hard, payments-duopoly Medium, Nvidia-hindsight Easy, compliant-but-random Hard) plus 2–3 known-PASS cards.
2. Run old and candidate model over the fixtures + all active cards; compare verdicts.
3. Adjust thresholds until fixtures classify correctly (known-FAILs fail, known-PASSes pass) on the new model.
4. Orchestrator records a decision bumping `model`/`promptVersion` in config; that automatically invalidates every stored result (validator compares stored vs. pinned), forcing a full re-run — ~$6 per 100 cards, minutes of wall time.

### Q5 — Pipeline placement: separate command + offline enforcement (fail-closed)

**Recommendation: hybrid.** Two pieces:

1. **`pnpm --filter @signal-or-noise/content gate2`** — a new opt-in, network-dependent command that runs the model calls and writes results into the scenario files. Needs `ANTHROPIC_API_KEY`; refuses to start without it.
2. **`pnpm --filter @signal-or-noise/content validate` stays 100% offline** but gains a new business rule: a `reviewed` or `active` scenario **fails validation** unless it carries a stored Gate 2 result that is (a) present for all three variants, (b) content-hash-current, (c) produced by the pinned model + prompt version, and (d) passing the thresholds (evaluated offline from the stored raw distribution).

This makes the promotion flow: author/edit card → run `gate2` (network) → results written → `validate`/tests/CI stay green offline. Failure semantics fall out by construction: **an unreachable model can never count as a pass**, because network failure means no result gets written, and a missing/stale result *is* a validation failure for reviewed/active. There is no code path where an API error produces a pass.

**Rejected placements:** inside default `validate` (makes every dev-loop/CI verification network- and secret-dependent, violates D024 speed, and invites "skip validation, the network is down" habits); CI-only (solo dev on Windows runs promotion locally; CI can't hold the human-in-the-loop review that accompanies promotion). CI runs plain `validate` and therefore still *enforces* gate currency without secrets; an optional manually-triggered CI job that runs `gate2` can be added later if wanted.

### Q6 — Result storage & caching

**Store results in-file, under `review.gate2`** in the scenario JSON.

- **Pro in-file:** one source of truth; the result travels with the card through `draft → reviewed → active` folder moves; Zod-validatable in the existing schema; matches doc 09, which already places "Guessability Test results" in review metadata. **Con:** the CLI writes into hand-authored files (mitigate with stable 2-space-indent stringify to minimize diff churn).
- **Rejected — sidecar files** (`scenario_x.gate2.json`): keeps generated data out of authored files, but splits the card across two files that must move together through status folders, doubles the orphan/stale-pairing failure modes, and needs new loader plumbing. Not worth it pre-database.

**Shape (per variant):**

```jsonc
"review": {
  // ...existing fields...
  "gate2": {
    "easy": {
      "payloadHash": "sha256:…",          // hash of the exact rendered payload (Q1 fields, normalized lookback)
      "model": "claude-sonnet-4-6",
      "promptVersion": "guess.v1+direction.v1",
      "testedAt": "2026-07-10T…Z",
      "guesses": [ { "company": "…", "confidence": 35, "pointingFact": "…" } /* ×5 */ ],
      "direction": { "call": "toss_up", "confidence": 40, "cue": "…" }
    },
    "medium": { /* same */ },
    "hard": { /* same */ }
  }
}
```

**Store raw results, evaluate thresholds offline.** The stored object deliberately contains no pass/fail verdict. The offline validator recomputes the verdict from the raw distribution against the *current* threshold config — so tuning thresholds (D022 says they're calibration values) is a code change with **zero re-testing cost**, and a stored "pass" can never contradict current rules.

**Caching & invalidation.** The cache key is `payloadHash` = SHA-256 over a canonical serialization of exactly the Q1 payload fields for that variant. The `gate2` CLI skips any variant whose stored hash matches (unchanged card ⇒ no API call); `--force` overrides. Invalidated by: any pre-decision content edit (title, metadata labels, variant fields, hints, lookback prices) — hash changes; or a pinned `model`/`promptVersion` bump — validator compares stored vs. pinned values directly. **Not** invalidated by reveal-side edits (reveal text, fun fact, sources, review notes, accepted names): those aren't in the payload, so a copy-edit to the reveal doesn't cost a re-test. Edge case handled: `acceptedNames` edits don't invalidate the *call* but do change *judging* — safe, because judging happens offline at validate time from the stored raw guesses.

### Q7 — Tiering by status

Consistent with the H018 banned-terms precedent:

| Status | Gate 2 rule |
|---|---|
| `reviewed`, `active` | **Blocks:** missing / stale / wrong-pin / threshold-failing result ⇒ validation error |
| `draft` | Never blocks. If a result exists, threshold failures surface as warnings (authors can test early); if absent, silent |
| `inactive`, `archived` | Exempt entirely |

Direction check: WARN at all tiers initially; promoted to the blocking set for `reviewed`/`active` after calibration (Decision Point 2).

### Q8 — Cost estimate (approximate; verify pricing at implementation)

Per call on `claude-sonnet-4-6` ($3 in / $15 out per MTok): payload + instructions + tool schema ≈ 1.2–1.5K input tokens (~$0.004), guesses output ≈ 300–400 tokens (~$0.005) ⇒ **≈ $0.01 per call**.

| Unit | Calls | Cost |
|---|---|---|
| One variant (guess + direction) | 2 | ≈ $0.02 |
| One card (3 variants) | 6 | **≈ $0.06** |
| 6 active seeds re-review | 36 | ≈ $0.35 |
| 100-card full sweep (Part B) | 600 | **≈ $6** |
| Full re-baseline after a model bump | 600 + fixtures | ≈ $7 |

Haiku would be ~$2/100 cards, Opus 4.8 ~$18 — the spread is small enough that guesser quality should dominate the choice. **Not recommended:** the Batches API (50% discount, async ≤1h turnaround) — real savings of ~$3 per full sweep don't justify async plumbing for a solo pipeline; noted as a lever if volume ever reaches thousands. Prompt caching similarly skipped: the shared prefix is below Sonnet 4.6's 2048-token cacheable minimum and calls are spread across a 5-minute TTL.

### Q9 — Spec for implementation

See "Spec for the Implementation Handoff" below.

---

## Recommendation & Rationale (summary)

Adopt the design above: **deterministic single-call top-5 protocol on pinned `claude-sonnet-4-6` + direction toss-up check (WARN-first), results stored raw and in-file, cached by payload hash, enforced offline by `validate` for reviewed/active, produced by an opt-in `gate2` command.** It automates the last D019 layer with the same fail-closed posture as the rest of the validator, keeps the dev loop offline per D024, makes threshold tuning free, costs ~$6 per hundred cards, and reduces to a config-bump + cheap re-run when the pinned model eventually retires.

## Decision Points for the Orchestrator

1. **D022 temperature wording.** Newest Anthropic models reject `temperature`; the pin should read "the most deterministic configuration the pinned model supports (temperature 0 where available), with results cached by content hash." Recommend recording this as a D022 clarification / doc 09 amendment now — it is required the moment the pin moves off Sonnet 4.6, and choosing Alternative B requires it immediately.
2. **Direction gate severity.** WARN for the first calibration pass (my recommendation), or blocking from day one per C002's "start strict"? Either is a one-line config choice; raw results are stored regardless.
3. **Easy rank 4–5.** Confirm the WARN mapping for a correct guess at rank 4–5 on Easy (doc 09 leaves this band undefined).
4. **Model: Sonnet 4.6 (honors D022 as written) vs. Sonnet 5 (stronger, more durable pin; requires Decision Point 1 first).**

## What Would Change This Recommendation

- If the orchestrator amends the temperature clause immediately (DP1), switch the pin to `claude-sonnet-5` — a strictly stronger guesser at the same price, with a longer deprecation runway.
- If calibration over the 6 seeds + fixtures shows Sonnet-tier failing to crack cards a human playtester cracks easily, escalate the pin to Opus 4.8 (~$18/100 cards — still cheap) rather than tuning thresholds looser.
- If Part B generation moves to bulk runs of many hundreds of cards at once, revisit the Batches API for the 50% discount.
- If the direction check proves noisy even after calibration, demote it permanently to WARN + human dual-cover review (C002's fallback) rather than deleting it — the stored signal still has red-team value.

---

## Spec for the Implementation Handoff

All new code in `packages/content`. No game-engine, no web-app, no database changes. Windows-safe (Node/tsx only).

### Module boundaries

| File | Contents | Constraints |
|---|---|---|
| `src/gate2/config.ts` | `GATE2_MODEL = 'claude-sonnet-4-6'`, `PROMPT_VERSION`, threshold config object (Easy/Medium/Hard rules from Q2, plausibility floor 10%, dominance 40%, direction threshold 65%, direction severity `'warn'`) | Changing pin/thresholds = reviewed code change |
| `src/gate2/payload.ts` | `renderVariantPayload(scenario, difficulty)` → ordered struct of Q1 fields with normalized lookback; `hashVariantPayload(payload)` → `sha256:…` over canonical JSON | Pure; unit-testable; the ONLY definition of "what the guesser sees" |
| `src/gate2/prompts.ts` | `GUESS_PROMPT_V1`, `DIRECTION_PROMPT_V1` string constants + the two tool JSON schemas (record_guesses: exactly 5 `{company, confidence 0–100, pointingFact}`; record_direction: `{call: long\|short\|toss_up, confidence, cue}`) | Bump `PROMPT_VERSION` on any edit |
| `src/gate2/client.ts` | Anthropic API call via `@anthropic-ai/sdk`: pinned model, `temperature: 0`, no `thinking` field, forced `tool_choice`, `max_tokens` ~1024; transport retry ×3 with backoff; 1 re-ask on Zod-invalid tool input; throws on final failure (never returns a default) | **Node-only. Do NOT re-export from `src/index.ts`** (same browser-safety rule as `loadScenarios.ts` — H016 precedent) |
| `src/gate2/evaluate.ts` | `evaluateGate2(storedResult, thresholds)` → `{verdict: pass\|warn\|fail, reasons[]}` per variant: correct-guess matching (reuse/extract the D015 normalize logic: lowercase + alphanumerics, matched against name/ticker/acceptedNames), Q2 threshold checks, plausible-count WARNs, likely-guess-overlap WARN, direction check | Pure, offline; imported by `validation.ts` |
| `src/gate2/run.ts` + `src/runGate2.ts` (CLI entry) | Load scenarios via `loadScenarios.ts`; select targets; skip hash-current variants; call client; write `review.gate2` back with stable 2-space JSON stringify; print per-variant verdicts; **exit 1** if any tested variant fails thresholds or any needed call errored | CLI mirrors `validate.ts` structure |
| `src/schema.ts` | Add optional `gate2` object to `review` (Zod: per-difficulty optional entries with the Q6 shape) | Optional in schema — requirement is a business rule, not shape |
| `src/validation.ts` | New `checkGate2Currency(scenario, errors, warnings)`: for `reviewed`/`active` — error if any variant's `gate2` entry is missing, `payloadHash` ≠ recomputed hash, `model`/`promptVersion` ≠ pinned config, or `evaluateGate2` verdict is `fail`; WARN-tier findings attach as warnings; `draft` gets warnings only | Stays fully offline — imports `payload.ts` + `evaluate.ts`, never `client.ts` |

### CLI surface

```text
pnpm --filter @signal-or-noise/content gate2              # test reviewed/active with missing/stale results
pnpm --filter @signal-or-noise/content gate2 -- --all     # include hash-current (re-test everything)
pnpm --filter @signal-or-noise/content gate2 -- --id scenario_netflix_2012_2017
pnpm --filter @signal-or-noise/content gate2 -- --include-draft
pnpm --filter @signal-or-noise/content gate2 -- --force   # ignore cache
```

`package.json`: add `"gate2": "tsx src/runGate2.ts"`; add `@anthropic-ai/sdk` and `dotenv` (or a minimal `.env` reader) as devDependencies.

### Env / secrets

`ANTHROPIC_API_KEY` read from environment / repo-root `.env` (already listed in `.env.example` under "Content generation (never used in production gameplay)"; `.env` is gitignored — verify before landing). CLI exits non-zero with a clear message when the key is absent or the API is unreachable. **No key is ever needed for `validate`, `test`, `typecheck`, `build`, or CI.**

### Tests (Vitest, offline — mock the client)

1. `payload.ts`: field inclusion/exclusion (reveal fields absent), lookback normalization, hash stability, hash changes on title/hint/label edit, hash unchanged on reveal edit.
2. `evaluate.ts` fixture distributions: Easy pass (#1 correct), Easy warn (rank 4), Easy fail (absent); Medium fail on 45%-#1 and on 15-point lead; Hard fail on rank-5 @ 15%, Hard pass on absent; plausibility WARNs; likely-guess-overlap WARN; direction warn at 70% long.
3. `validation.ts`: active card without `gate2` fails; stale hash fails; wrong model pin fails; draft without `gate2` passes silently; draft with failing result warns.
4. `client.ts`: mocked — retry path, Zod re-ask path, throw-on-failure (no default result).

### Doc amendments (recommendations only — orchestrator lands them)

- **doc 09, Gate 2 section:** replace the manual-protocol paragraph's automation note with the implemented protocol (single deterministic call, forced tool output, normalized lookback included, one attempt); reword "pinned model at temperature 0" per Decision Point 1; state that thresholds live in `packages/content` config as D022 calibration values; add the direction-check subsection (C002 threshold, WARN-first status).
- **doc 09, Scenario Validation Checklist:** change "Guessability test fails for any variant (automated in the Phase 3 validator, D019)" to "Reviewed/active card lacks a current, passing Gate 2 result for any variant (automated; produced by the `gate2` command, enforced offline by `validate`)".
- **doc 09, Review Metadata:** note `review.gate2` as the stored-results location (replacing free-text "Guessability Test results").
- **Human Review Checklist:** "Run the Guessability Test" becomes "run `gate2` and review its verdicts + warnings before marking reviewed".

### Suggested sequencing

One implementation handoff (Grok-tier; medium-high risk → production content pipeline per D024, so plan cross-model review) for modules + schema + validation rule + tests, with the 6 active seeds *temporarily* exempted via a dated grace list **or** — cleaner — run the first `gate2` pass over the 6 seeds as part of the same handoff so `validate` stays green at completion. The Part A active-card re-review then consumes the real verdicts. H020 (MINOR-4 likely-guess floor) should land before or with the re-review so the overlap WARN has real lists to check.

---

## Acceptance Self-Check (H019)

| # | Criterion | Met |
|---|---|---|
| 1 | Memo exists and answers all nine questions | Yes (Q1–Q9) |
| 2 | Recommended design clearly marked; alternatives + trade-offs | Yes (Haiku, Sonnet 5, Opus; in-validate vs opt-in; in-file vs sidecar; batch vs sync) |
| 3 | Spec implementable without further design work beyond listed decision points | Yes (4 explicit decision points) |
| 4 | progress.md one-line Consultant entry | Yes (this session) |
