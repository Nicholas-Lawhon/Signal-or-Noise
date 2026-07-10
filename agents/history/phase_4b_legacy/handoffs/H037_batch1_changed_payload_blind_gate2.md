# H037 - Batch 1 Changed-Payload Blind Gate 2 Rejudge

**Role:** Content Curator
**Phase:** 4 Part B - Content generation at scale
**Status:** approved
**Model:** claude-fable-override
**Risk:** high (production content-pipeline validation)
**Audit:** orchestrator review + user playtest before batches 3-4
**Depends on:** H036, R058, D031, D032, D036, D037
**Estimated scope:** medium - 19 blind Medium/Hard judgments and constrained JSON write-back
**Context budget:** medium - exact payload scope and Gate 2 schema plus careful independent identity reasoning; answer-bearing material is deferred until judgments are final
**Output budget:** report <= 400 words plus acceptance table; detailed 19-row evidence in `agents/gate2/H037_results.json`

## Context

H036 changed exactly 19 draft Medium/Hard payloads to repair identity leaks found by H035. Its stored results are intentionally stale. This handoff replaces only those entries with independent, payload-only Claude Fable judgments; drafts remain draft-only regardless of outcome.

**High-reasoning rationale:** These variants have already undergone one blind judge round and a targeted prose-decoupling repair. Assessing residual chart-plus-prose identity cues needs careful, independent whole-payload reasoning. Claude Fable is user-approved for this exceptional rejudge under D031; routine Gate 2 work still defaults to Grok 4.5.

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: D031, D032, D036, D037
- Docs: none required for judging
- Prior artifacts: `agents/reports/R058_H036.md` — Summary and Known Issues / Follow-ups only, and only after all blind judgments are final if mapping help is needed
- Source files (judging phase): `agents/gate2/H036_changed_scope.json`, `agents/gate2/H036_payloads.json`, `packages/content/src/gate2/config.ts` (model/prompt pins only), and `packages/content/src/schema.ts` (`review.gate2` shape only)
- Source files (write-back phase only after all judgments are final): the 10 draft scenario files identified by `H036_changed_scope.json`
- Commands: `rg -n "GATE2_(DEFAULT_MODEL|APPROVED_MODELS|PROMPT_VERSION)" packages/content/src/gate2`

**Blind boundary:** Before recording all 19 judgments, do not read scenario JSON, company answers/reveals, titles, sources, fact banks, likely-guess lists, review notes, H035 results, or H036 self-check outcomes. Use only each entry's `payload`, `difficulty`, and `payloadHash`.

## Task Framing

You are the Gate 2 judge and constrained metadata writer. Judge every payload first, then determine outcomes and write metadata. Honest identity failures are findings, not reasons to alter confidence or prose.

## Objective

Store current, schema-valid Gate 2 results for exactly the 19 rows in `H036_changed_scope.json`, matching their canonical H036 export payloads. Make no player-facing content edits and record detailed evidence so the orchestrator can approve the required Batch 1 playtest or escalate residual identity leaks under D037.

## Prescriptive Instructions

1. Prove `H036_changed_scope.json` has exactly 19 unique `(scenarioId, difficulty, payloadHash)` rows. Find exactly one matching triplet in `H036_payloads.json` for each row. Stop and report a blocker for any missing, duplicate, or mismatched row. Judge nothing else: no Easy, Fastly Medium, Netflix, or unchanged Medium/Hard variant.
2. For every scoped payload, using only its rendered payload, difficulty, and hash, record exactly five company guesses (company name, integer confidence 0–100, payload-based `pointingFact`) and one direction assessment (`long` | `short` | `toss_up`, integer confidence 0–100, payload-based cue). Use `model: "claude-fable"`, the config's current prompt version, the exact export hash, and one consistent ISO `testedAt` timestamp. Do not use web/search or tune confidences to manufacture a pass.
3. Only after every blind judgment is recorded, replace only the scoped `review.gate2.medium` or `review.gate2.hard` blocks in matching draft files. Preserve every non-Gate-2 field and every out-of-scope result byte-identically.
4. Write `agents/gate2/H037_results.json`, exactly one row per scoped payload: `scenarioId`, `difficulty`, `payloadHash`, top guess, correct rank (computed only after write-back), outcome, and evaluated findings.
5. Run the required checks. If identity errors remain, store and report them; do not rewrite prose. Recommend D037 escalation for re-failures after H036's prose decoupling. Report WARNs but do not repair them.

## Do NOT

- Do not break the blind boundary.
- Do not edit hidden-card prose, titles, dates, charts, market data, sources, reveal fields, fact banks, review notes, schemas, prompts, thresholds, or app code.
- Do not write/delete Gate 2 results outside the exact 19-row scope, activate a draft, mark it human-reviewed, call external APIs, add SDKs/API keys, or build anything on the MVP exclusion list in `soul.md`.
- Do not commit or push.

## Acceptance Criteria

1. Scope proof shows 19 unique rows and exactly one matching export payload each; no out-of-scope row is judged.
2. Every scoped row has a current, schema-valid Gate 2 result with matching hash, an approved model, current prompt pin, five guesses, direction assessment, and consistent tested-at value.
3. Only the 19 scoped Gate 2 blocks change; player-facing and out-of-scope data are unchanged.
4. `H037_results.json` has exactly 19 evidence rows; the report aggregates pass/error/WARN counts and lists only identity-error rows.
5. Content validation, draft-inclusive Gate 2 check, and focused content tests run and are precisely reported. Re-failures recommend D037 escalation without a prose repair.

## Verification Steps for the Executor

```powershell
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check --include-draft
pnpm --filter @signal-or-noise/content test
git diff --stat -- packages/content/scenarios agents/gate2/H037_results.json
git status --short
```

## Reporting

Set Status to `complete`, append a concise `progress.md` entry, and write `agents/reports/R###_H037.md` per the report template. Include the scope proof, aggregate pass/error/WARN counts, evidence path, exact remaining identity-error rows, and recommended next step; do not duplicate evidence rows.

**Do NOT commit or push anything.** If blocked, log the question in `progress.md` Blocked/Questions and stop.
