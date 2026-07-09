# H### - <Short Task Title>

**Role:** Implementor | Auditor | Consultant | Content Curator | Growth
**Phase:** <roadmap phase>
**Status:** draft | approved | in_progress | complete | audited
**Model:** deepseek-v4-pro | grok-4.5 | gpt-5.5 | claude-fable-override
**Risk:** low | medium | high (per `agents/routing.md`)
**Audit:** none | optional | required
**Depends on:** <handoff IDs or "none">
**Estimated scope:** <small / medium / large + why>
**Context budget:** small | medium | large - <why this amount is needed>
**Output budget:** <expected artifact length, e.g. "report <= 800 words" or "memo 1,200-2,000 words">

## Context

<2-5 sentences: where the project stands, why this task exists now, and what the
agent can assume already works. Link to source-of-truth docs instead of restating
large rules.>

## Context Manifest

Read only these items beyond the root Required Reading Order in `AGENTS.md`:

- Decisions: <D### only, or "none">
- Docs: <exact doc paths and section headings, or "none">
- Prior artifacts: <specific reports/audits/consultations and sections, or "none">
- Source files: <exact paths, or "none">
- Commands for discovery: <specific `rg`/test commands, or "none">

If broader context seems necessary, stop and log the requested expansion under
Blocked/Questions instead of reading unrelated history.

## Task Framing (micro-role) - optional

<Only when the task needs a specialist hat on top of the base role. Delete if the
base role framing is sufficient.>

## Objective

<One paragraph. The single outcome this handoff produces.>

## Prescriptive Instructions

<Numbered steps in execution order. Calibrate to the executor:
- DeepSeek: exact file paths, signatures, expected values, code blocks.
- Grok: exact outcomes and constraints with bounded local judgment.
- GPT 5.5: goal, constraints, and delegated decision bounds.
Do not pad this with general project background already covered by the Context
Manifest.>

## Do NOT

<Explicit adjacent scope to avoid. Always include: "Anything on the MVP exclusion
list in `soul.md`.">

## Acceptance Criteria

<Numbered, binary-checkable list. Each criterion states HOW to verify it.>

## Verification Steps for the Executor

<Cheapest sufficient checks: usually test + typecheck, plus focused manual/browser
checks only when runtime UI behavior changed.>

## Reporting

On completion: set Status to `complete`, append a concise session entry to
`progress.md`, and write a completion report to `agents/reports/R###_H###.md` per
`agents/reports/TEMPLATE.md`.

**Do NOT commit or push anything** - the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).

If blocked: set Status note, log the question in `progress.md` Blocked/Questions,
and stop.
