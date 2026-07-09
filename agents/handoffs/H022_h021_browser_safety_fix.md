# H022 - H021 Browser Safety and Gate 2 Check Fix

**Role:** Implementor
**Phase:** 4 Part A - Content rules & validator hardening
**Status:** complete
**Model:** grok-4.5
**Risk:** high (production content-pipeline validation and web build safety)
**Audit:** orchestrator review + cheap verification before commit
**Depends on:** H021, R019, R020
**Estimated scope:** small-medium - narrow fix-up to hashing/import boundaries, CLI check behavior, and tests
**Context budget:** small - read only the rejected report, review note, and directly touched content files
**Output budget:** report <= 700 words

## Context

H021 implemented the offline Gate 2 harness but was rejected in R020 because the
web production build now pulls `node:crypto` through the package root:
`payload.ts -> evaluate.ts -> validation.ts -> index.ts -> apps/web`. H021 also
left a smaller issue where `gate2 check` validates while loading, so bad stored
Gate 2 results can stop the command before it reports structured findings.

This is a fix-up only. Preserve H021's public behavior and stored-result rules:
missing Gate 2 entries still do not fail validation, and no model/API integration
is added.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D024, D031, D032
- Docs: none
- Prior artifacts: `agents/reports/R019_H021.md`, `agents/reports/R020_R019_review.md`
- Source files:
  - `packages/content/src/gate2/payload.ts`
  - `packages/content/src/gate2/evaluate.ts`
  - `packages/content/src/gate2/run.ts`
  - `packages/content/src/validation.ts`
  - `packages/content/src/index.ts`
  - `packages/content/src/activeScenarios.ts`
  - `packages/content/tests/gate2-payload.test.ts`
  - `packages/content/tests/validation.test.ts`
  - `packages/content/package.json`
  - `apps/web/lib/sampleScenarios.ts`
- Commands for discovery:
  - `rg -n "node:crypto|node:fs|node:path|node:url|gate2|validateScenario|@signal-or-noise/content" packages/content/src apps/web`

If broader context seems necessary, stop and log the requested expansion under
Blocked/Questions instead of reading unrelated history.

## Objective

Fix the H021 implementation so Gate 2 hashing/evaluation can be used by
validation without breaking the web app build, and make `gate2 check` report
stored-result problems itself instead of failing during load. Keep the harness
offline, deterministic, and fully covered by the existing verification commands.

## Prescriptive Instructions

1. Remove `node:crypto` from browser-reachable code.
   - `packages/content/src/gate2/payload.ts` must not import `node:crypto`.
   - Keep `hashVariantPayload(payload)` synchronous and returning
     `sha256:<64 lowercase hex chars>`.
   - Use a small in-repo, browser-safe SHA-256 implementation or another
     browser-safe local approach. Do not add a package.
   - Add a known-vector unit test: hashing canonical JSON for `"abc"` or another
     simple value should match a known SHA-256 digest through the same helper
     path, or expose a tiny internal helper only if needed for the test.

2. Preserve H021 payload semantics.
   - Payload fields, canonical JSON behavior, hash stability, and hash change
     behavior must remain as H021 specified.
   - Re-run export after the hash implementation changes so
     `agents/gate2/H022_payloads.json` contains hashes from the final code.

3. Fix `gate2 check` loading.
   - `checkGate2StoredResultsCli` should be able to report stale hash, wrong
     model, wrong prompt, and threshold failures as structured `ERROR` lines.
   - It must not fail early solely because `validateScenario` reports Gate 2
     stored-result errors.
   - Keep non-Gate-2 structural/content validation failures blocking the command;
     do not silently accept malformed scenario JSON.
   - Add focused tests if practical. If filesystem CLI tests are too brittle,
     add a pure helper test or report a manual command that proves a bad stored
     Gate 2 fixture reports structured errors.

4. Keep package-root/browser safety explicit.
   - `pnpm build` must pass.
   - The required grep must show no `node:crypto`, model API key/client, or
     Node-only fs/path/url imports in package-root/browser paths. `node:fs`,
     `node:path`, and `node:url` are still allowed in Node-only CLI/load files.
   - Do not remove useful root exports unless necessary; prefer making the Gate
     2 hashing path browser-safe.

5. Update state.
   - Set this handoff status to `complete`.
   - Append a concise session entry to `progress.md`.
   - Write `agents/reports/R021_H022.md`.

## Do NOT

- Do not call xAI/OpenAI/Anthropic APIs, add SDKs, or require API keys.
- Do not populate real `review.gate2` model results in active scenarios.
- Do not make missing Gate 2 entries fail validation.
- Do not rewrite scenario content.
- Do not add database/auth/web/mobile work.
- Do not edit `soul.md`, `roadmap.md`, or `decisions.md`.
- Do not build anything on the MVP exclusion list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. `pnpm build` passes from repo root.
2. `pnpm --filter @signal-or-noise/content test` passes.
3. `pnpm test` passes from repo root.
4. `pnpm typecheck` passes from repo root.
5. `pnpm --filter @signal-or-noise/content validate` passes.
6. `pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H022_payloads.json` writes 18 active payloads from the final code.
7. `pnpm --filter @signal-or-noise/content gate2 -- check` exits 0 with current missing results reported as info.
8. A focused bad stored-result check proves `gate2 check` reports structured error lines instead of failing during scenario load.
9. `rg -n "XAI_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|gate2/client|node:crypto|node:fs|node:path|node:url" packages/content/src/index.ts packages/content/src/gate2 apps/web` shows no API key/client usage and no `node:crypto`; any fs/path/url hits are only in Node-only CLI helpers and are justified in the report.

## Verification Steps for the Executor

Run from repo root:

```powershell
pnpm build
pnpm --filter @signal-or-noise/content test
pnpm test
pnpm typecheck
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- export --out agents/gate2/H022_payloads.json
pnpm --filter @signal-or-noise/content gate2 -- check
rg -n "XAI_API_KEY|OPENAI_API_KEY|ANTHROPIC_API_KEY|gate2/client|node:crypto|node:fs|node:path|node:url" packages/content/src/index.ts packages/content/src/gate2 apps/web
git status --short
```

Also inspect `agents/gate2/H022_payloads.json` after export. It must still contain
only scenario id, difficulty, payload hash, and rendered pre-decision payload.

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write `agents/reports/R021_H022.md` per
`agents/reports/TEMPLATE.md`.

**Do NOT commit or push anything** - the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).

If blocked: set Status note, log the question in `progress.md` Blocked/Questions,
and stop.
