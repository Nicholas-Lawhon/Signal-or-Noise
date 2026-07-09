# R020 - Orchestrator Review of R019/H021

**Role:** Orchestrator
**Reviewed work:** R019 / H021
**Date:** 2026-07-09
**Status:** rejected

## Summary

R019/H021 is not approved for commit. The offline Gate 2 harness mostly matches
the handoff, and the reported unit/typecheck/validate commands pass, but review
found a blocking browser-safety regression: `pnpm build` fails because the web app
imports `@signal-or-noise/content`, which imports `validation.ts`, which imports
Gate 2 hashing through `node:crypto`.

I also found a smaller CLI design issue: `gate2 check` loads scenarios through
full validation, so once active scenarios contain bad stored Gate 2 results, the
command can throw before producing its own structured stale/wrong-pin/failing
report.

## Verification

Passed:
- `pnpm --filter @signal-or-noise/content gate2 -- check` - 0 errors, 18 missing info.
- `pnpm --filter @signal-or-noise/content validate` - 6/6 pass, 0 warnings.
- `pnpm --filter @signal-or-noise/content test` - 46 passed.
- `pnpm test` - 83 passed.
- `pnpm typecheck` - pass.

Failed:
- `pnpm build` - Next build fails on `node:crypto`.

Relevant build trace:

```text
node:crypto
../../packages/content/src/gate2/payload.ts
../../packages/content/src/gate2/evaluate.ts
../../packages/content/src/validation.ts
../../packages/content/src/index.ts
./lib/sampleScenarios.ts
./app/play/classic/run/page.tsx
```

## Finding

**Blocker - browser-facing package root now pulls in `node:crypto`.**

H021 explicitly required Node-only imports to stay out of package-root/browser
paths. The current implementation imports `node:crypto` in
`packages/content/src/gate2/payload.ts`; `validation.ts` imports Gate 2
evaluation; `index.ts` exports validation; and the web app imports the content
package root. This breaks production web builds.

## Decision

Reject R019/H021 pending a narrow fix-up handoff. Do not commit the current diff.

## Recommended Next Step

Dispatch H022 as a fix-up before the blind Gate 2 judge handoff. The blind judge
handoff should move to H023 after H022 is accepted.
