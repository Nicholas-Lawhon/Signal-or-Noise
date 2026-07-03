# agents/ — Role-Based Agentic Workflow

How work gets done in this repository. The **orchestrator** (a high-reasoning AI
session working with the user) makes decisions and writes prescriptive handoff
prompts; **role agents** (any coding assistant) execute them exactly.

## The Loop

```text
1. Orchestrator drafts a handoff prompt  →  agents/handoffs/H###_*.md
2. User approves the handoff (status: approved)
3. Implementor (or Curator/Growth) executes it exactly, updates progress.md
4. Auditor reviews the result against the handoff's acceptance criteria
   →  agents/audits/A###_H###.md  (PASS / PASS WITH FINDINGS / FAIL)
5. Orchestrator resolves findings (fix-up handoff if needed), updates
   roadmap.md + decisions.md, drafts the next handoff
```

Consultant is invoked *before* steps with real design ambiguity (currently gated:
Phase 4 database, Phase 5 auth) and produces a memo the orchestrator turns into
decisions.

## Roles

| Role | File | Does | Never does |
|------|------|------|-----------|
| Consultant | `roles/consultant.md` | Design memos, option analysis, architecture recommendations | Writes production code, makes final decisions |
| Implementor | `roles/implementor.md` | Executes handoff prompts: code, tests, commits | Expands scope, makes product/architecture decisions |
| Auditor | `roles/auditor.md` | Verifies work against acceptance criteria, files audit reports | Fixes code, softens findings to be agreeable |
| Content Curator | `roles/content-curator.md` | Researches and writes scenario-card JSON (Phase 3+) | Invents market data without sources, touches app code |
| Growth | `roles/growth.md` | Marketing, social, sales deliverables (milestone-gated) | Changes product copy in-app without a handoff, overpromises features |

## Directory Map

```text
agents/
  README.md            this file
  roles/               role definitions (read yours before working)
  handoffs/            numbered handoff prompts (H001, H002, ...) + TEMPLATE.md
  audits/              auditor reports (A001_H001.md, ...)
  consultations/       consultant memos (C001_database.md, ...)
```

## Handoff Rules

- One handoff = one coherent unit of work with binary-checkable acceptance criteria.
- Handoffs are numbered sequentially and never reused or rewritten after execution
  starts (fix-ups get a new number, e.g. `H002_h001_fixes.md`).
- Every handoff header carries a status: `draft → approved → in_progress → complete → audited`.
  The executing agent updates `in_progress`/`complete`; orchestrator sets the rest.
- Handoff prompts are written for a **lower-reasoning model**: exact file paths,
  exact function signatures, exact expected values in tests, explicit "do not build"
  lists. When in doubt, over-specify.

## Escalation

Any agent that hits ambiguity, a contradiction with `soul.md`/`decisions.md`, or a
scope question: **stop, log it under "Blocked/Questions" in `progress.md`, end the
session.** Never guess on decision-level questions. The orchestrator picks it up
from there.
