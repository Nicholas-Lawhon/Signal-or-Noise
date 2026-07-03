# H### — <Short Task Title>

**Role:** Implementor | Auditor | Consultant | Content Curator | Growth
**Phase:** <roadmap phase>
**Status:** draft | approved | in_progress | complete | audited
**Depends on:** <handoff IDs or "none">
**Estimated scope:** <one line: small / medium / large + what "large" means here>

## Context

<2–5 sentences: where the project stands, why this task exists now, what the agent
can assume already works. Link the docs sections that matter.>

## Objective

<One paragraph. The single outcome this handoff produces.>

## Prescriptive Instructions

<Numbered steps in execution order. Written for a lower-reasoning model:
- exact file paths and names
- exact function signatures, types, and expected values
- exact commands to run and their expected output
- code blocks for anything where wording could drift
When in doubt, over-specify.>

## Do NOT

<Explicit list of things adjacent to this task that must not be built or touched.
Always include: "Anything on the MVP exclusion list in soul.md.">

## Acceptance Criteria

<Numbered, binary-checkable list. Each criterion states HOW to verify it
(command to run, screen to open, value to observe). The Auditor executes these
literally.>

## Verification Steps for the Implementor

<The self-check sequence to run before marking complete: install, test, typecheck,
manual flow walkthrough.>

## Reporting

On completion: set Status to `complete`, append a session entry to `progress.md`
(template at top of that file), and write a completion report to
`agents/reports/R###_H###.md` per `agents/reports/TEMPLATE.md`.
**Do NOT commit or push anything** — the orchestrator reviews your report and
uncommitted diff, then commits on approval (decision D012).
If blocked: set Status note, log the question in `progress.md` Blocked/Questions,
stop.
