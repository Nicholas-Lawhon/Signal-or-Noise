# @signal-or-noise/content

Scenario schema, Zod validation, seed JSON, and the validation CLI for
**Signal or Noise?**

## Layout

```text
src/                 types, schema, validation API, CLI
tests/               validator unit tests
scenarios/draft/     work-in-progress cards
scenarios/reviewed/  human-reviewed cards awaiting activation
scenarios/active/    playable sample / production seeds
data/                 daily pools, market eras, and production inventory
```

## Scripts

```bash
pnpm --filter @signal-or-noise/content test
pnpm --filter @signal-or-noise/content typecheck
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2:judge -- --input <opaque.json> --output <judge-results.json>
pnpm --filter @signal-or-noise/content gate2:apply -- --results <judge.json> --mapping <private.json>
```

`validate` checks every JSON file under `scenarios/{draft,reviewed,active}` plus
the content catalog, prints pass/fail (and warnings), and exits non-zero on
errors. Pool validation checks scenario references, company/sector variety,
mixed difficulties, and positive/negative outcome variety. The required
`data/production-scenario-inventory.json` contains exactly 40 unique scenario
references and records the D034 recognition mix: 24 famous, 12 moderate, and
4 obscure.

Gate 2 exports use opaque judge IDs and a separately written private mapping.
Judge Easy, Medium, and Hard in separate clean sessions with
`GATE2_JUDGE_PROMPT.md`; never expose the mapping to the judge. After judging,
`gate2:apply` validates full opaque-ID coverage and current payload hashes before
writing only the mapped `review.gate2.<difficulty>` blocks.

Gate 2 exports use opaque judge IDs and a separately written private mapping.
Judge Easy, Medium, and Hard in separate clean sessions with
`GATE2_JUDGE_PROMPT.md`; never expose the mapping to the judge.

## Model (D026)

Each difficulty variant includes:

- `companyDescription`, `macroContext`
- `situation`, `longCase`, `shortCase` (balanced decision core)
- `setupHints` — Easy exactly 1, Medium 0–1, Hard exactly 0

Player-facing labels: **Signal or Noise?**, **Why it might work**, **What could break**.

## Notes

- All 40 active scenarios are Phase 4B production content accepted under D038.
- The web app imports `ACTIVE_SCENARIOS` / `getActiveScenarios()` — no dynamic
  filesystem reads in the client bundle.
