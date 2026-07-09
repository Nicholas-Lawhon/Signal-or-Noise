# agents/ — Role-Based Agentic Workflow

How work gets done in this repository. The **orchestrator** (a high-reasoning AI
session working with the user) makes decisions and writes prescriptive handoff
prompts; **role agents** (any coding assistant) execute them exactly.

## The Loop

```text
1. Orchestrator routes the task (type, risk, model per routing.md's
   characteristics table) and drafts a handoff prompt → agents/handoffs/H###_*.md
2. Approval gate follows D024 during development: low- and routine medium-risk
   handoffs dispatch as soon as the user agrees to the task; high-risk work,
   major features, phase gates, irreversible/outward-facing actions, and product
   rule changes need explicit user approval (status: approved) first.
3. Orchestrator DISPATCHES the executor itself via its headless CLI
   (grok -p / codex exec / opencode run — commands in routing.md).
   Manual paste by the user is the fallback if a CLI is down.
4. Executing agent (Implementor/Curator/Growth) does the work, updates
   progress.md, and writes a completion report → agents/reports/R###_H###.md
   ── WITHOUT committing anything to git
5. Orchestrator reviews the report + uncommitted diff, reruns cheap verification,
   and approves or rejects. Per D024, formal Auditor passes are reserved during
   active development for phase gates, major feature additions, high-risk domains,
   or explicit user/orchestrator request.
6. On approval, the ORCHESTRATOR commits the work, updates roadmap.md +
   decisions.md, and drafts the next handoff.
   On rejection, a fix-up handoff goes back to step 2.
```

**Nothing reaches git history without an orchestrator-approved report (decision
D012).** Role agents never run `git commit` or `git push`; the uncommitted
working tree IS the review artifact. During development, the orchestrator may
approve prototype-grade work with documented known issues when D024 says speed is
more valuable than another audit loop. Consultant memos and Auditor audit files
serve as those roles' reports — they don't write a separate R### file.

Consultant is invoked *before* steps with real design ambiguity (currently gated:
Phase 4 database, Phase 5 auth) and produces a memo the orchestrator turns into
decisions. Auditor is invoked selectively: phase completion, durable feature
addition, high-risk work, production-readiness checks, or explicit request.

## Roles

Roles are hats, not models: `routing.md` decides which model wears each hat per
task. Typical mapping (D023): Implementor = DeepSeek v4 Pro (boilerplate) or
Grok 4.5 (medium work) or GPT 5.5 (hard work); Consultant and Content Curator =
GPT 5.5; Auditor = whichever capable model did NOT implement the work under
audit. Claude subagents assist the orchestrator in-session but do not execute
handoffs.

| Role | File | Does | Never does |
|------|------|------|-----------|
| Orchestrator | `roles/orchestrator.md` | Takes tasks from the user, makes decisions (with user approval), authors handoffs, reviews reports, commits | Implements handoffs itself |
| Consultant | `roles/consultant.md` | Design memos, option analysis, architecture recommendations | Writes production code, makes final decisions |
| Implementor | `roles/implementor.md` | Executes handoff prompts: code, tests, reports | Commits to git, expands scope, makes product/architecture decisions |
| Auditor | `roles/auditor.md` | Verifies selected high-risk/milestone work against acceptance criteria, files audit reports | Fixes code, audits routine dev changes by default, softens findings to be agreeable |
| Content Curator | `roles/content-curator.md` | Researches and writes scenario-card JSON (Phase 3+) | Invents market data without sources, touches app code |
| Growth | `roles/growth.md` | Marketing, social, sales deliverables (milestone-gated) | Changes product copy in-app without a handoff, overpromises features |

## Directory Map

```text
agents/
  README.md            this file
  routing.md           model routing & risk policy (D021, D023) — orchestrator consults per task
  roles/               role definitions (read yours before working)
  handoffs/            numbered handoff prompts (H001, H002, ...) + TEMPLATE.md
  reports/             completion reports (R001_H001.md, ...) + TEMPLATE.md
  audits/              auditor reports (A001_H001.md, ...)
  consultations/       consultant memos (C001_database.md, ...)
```

## Handoff Rules

- One handoff = one coherent unit of work with binary-checkable acceptance criteria.
- Handoffs are numbered sequentially and never reused or rewritten after execution
  starts (fix-ups get a new number, e.g. `H002_h001_fixes.md`).
- Every handoff header carries a status: `draft → approved → in_progress → complete → audited`.
  The executing agent updates `in_progress`/`complete`; orchestrator sets the rest.
- Handoff prescriptiveness is **calibrated to the executor** (routing.md):
  DeepSeek gets fully prescriptive steps (exact paths, signatures, precomputed
  values); Grok gets exact outcomes/constraints with bounded local judgment;
  GPT 5.5 gets goal-oriented handoffs with explicitly delegated design bounds.
  Explicit "do not build" lists for everyone. When in doubt, over-specify.
- Every handoff header declares a **Model** and **Risk level** per
  `routing.md`. When a task needs a specialist hat (e.g. "migration reviewer"),
  the orchestrator writes a **micro-role** framing inside the handoff on top of a
  base role — no new permanent role files (D001, D021).

## Escalation

Any agent that hits ambiguity, a contradiction with `soul.md`/`decisions.md`, or a
scope question: **stop, log it under "Blocked/Questions" in `progress.md`, end the
session.** Never guess on decision-level questions. The orchestrator picks it up
from there.
