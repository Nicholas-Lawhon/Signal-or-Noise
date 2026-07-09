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
```

## Scripts

```bash
pnpm --filter @signal-or-noise/content test
pnpm --filter @signal-or-noise/content typecheck
pnpm --filter @signal-or-noise/content validate
```

`validate` checks every JSON file under `scenarios/{draft,reviewed,active}`,
prints pass/fail (and warnings), and exits non-zero on errors.

## Model (D026)

Each difficulty variant includes:

- `companyDescription`, `macroContext`
- `situation`, `longCase`, `shortCase` (balanced decision core)
- `setupHints` — Easy exactly 1, Medium 0–1, Hard exactly 0

Player-facing labels: **Signal or Noise?**, **Why it might work**, **What could break**.

## Notes

- Sample active scenarios are prototype-grade (`generatedByAi: true`,
  `humanReviewed: false`).
- The web app imports `ACTIVE_SCENARIOS` / `getActiveScenarios()` — no dynamic
  filesystem reads in the client bundle.
