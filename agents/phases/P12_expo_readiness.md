# Phase 12 — Shared Package Cleanup for Expo Readiness

**Status:** accepted (2026-07-13; closeout in `agents/phase-closeouts/P12_expo_readiness.md`)
**Risk:** normal
**Owner:** Claude Fable (Orchestrator session, user-assigned 2026-07-13; may use bounded subagents)
**Branch/worktree:** `phase/12-expo-readiness` in the project checkout

## Outcome

The shared logic and type/contract surface a future Expo/React Native app needs
is platform-neutral, importable without pulling in Node-, Prisma-, or
Next.js-only code, and provably bundles under Metro — enforced by automated
checks so it stays that way. The web app's behavior is unchanged.

## Starting Context

- `roadmap.md` Phase 12; `docs/07_technical_architecture.md` "Future Mobile
  Architecture" and monorepo sections.
- `packages/game-engine`, `packages/content`, `packages/database`
  (`src/contracts.ts` is a suspected shared-contract surface living in a
  Prisma-coupled package), and `apps/web/lib/` (especially `api.ts`).
- Audit first; the audit's findings drive the exact extraction plan.

## Delegated Authority

- Create new workspace packages (e.g. `packages/shared-types` or an API-contract
  package) and move types/pure logic between packages, updating imports across
  the workspace.
- Adjust package.json exports, tsconfig, and build tooling of shared packages.
- Add lint/dependency-constraint tooling and a Metro/RN bundling smoke test with
  pnpm scripts and dev dependencies as needed.
- Repair adjacent issues surfaced by the refactor.

## Stop Conditions

- A required change would alter web runtime behavior, locked rules, schema, or
  the server-side trust/reveal boundary.
- Completion would require creating the actual Expo app, pushing, deploying,
  credentials, or spend.

## Exclusions

- No `apps/mobile` Expo app shell, native tooling config beyond the bundling
  smoke test, or mobile UI.
- No API route behavior changes, schema/migration changes, or content changes.
- No speculative `packages/ui` shared component work.

## Acceptance Criteria

1. A documented, platform-neutral shared surface exists (game-engine logic,
   shared types/API contracts) that mobile can import without Node builtins,
   Prisma, Next.js, `react-dom`, or DOM globals entering its module graph.
2. Automated constraint checks fail the build/test if web-, Node-, or
   Prisma-only imports enter that surface, runnable via a pnpm script.
3. A Metro/React Native bundling smoke test bundles the shared surface
   successfully and runs via a pnpm script.
4. The web app compiles against the relocated types with zero behavior change:
   full test suites, typecheck, lint, content gates, and web build/e2e pass.
5. `docs/07_technical_architecture.md` reflects the resulting package layout;
   `progress.md` is current and one concise closeout exists.

## Final Verification

```powershell
pnpm test
pnpm typecheck
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/database test
pnpm --filter web lint
pnpm --filter web build
pnpm --filter web test:e2e
# plus the new constraint-check and RN bundle smoke scripts
```

## Closeout

Update `progress.md` and write one concise closeout in
`agents/phase-closeouts/`. No internal handoffs or reports.
