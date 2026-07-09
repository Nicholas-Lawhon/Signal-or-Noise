# routing.md - Model Routing & Risk Policy (D021, D023, D028, D029)

The orchestrator consults this file when authoring every handoff. This is the
single source of truth for which model executes a task, how it is invoked, and
how much review the result needs.

**Token-economy rule:** route to the cheapest model whose characteristics cover
the task. Never spend strong-model tokens on mechanical work. Never let cheap
models make decisions. Claude Fable is the orchestrator seat, not a routine
handoff executor; using it as an executor requires explicit user override after
a cost/context estimate.

## Model Roster & Characteristics

Ratings are 1-10 (10 = best). Intelligence / Cost-efficiency / Style are the
user's ratings; Speed / Autonomy are orchestrator estimates the user corrects
over time. **Autonomy** = how much judgment the model can safely be delegated -
the inverse of how prescriptive its handoffs must be.

| Model | Intelligence | Cost-eff. | Style | Speed | Autonomy | Invoked via |
|---|---:|---:|---:|---:|---:|---|
| Claude Fable | 10 | 2 | 7 | 5 | 10 | Orchestrator seat; executor only by explicit override |
| GPT 5.5 | 9 | 5 | 9 | 8 | 9 | `codex exec` |
| Grok 4.5 | 8 | 8 | TBD | 8 | 7 | `grok -p` |
| Claude Sonnet/Opus utility | 6-8 | n/a | 7 | 8 | 7 | in-session subagents only |
| DeepSeek v4 Pro | 4 | 10 | 5 | 8 | 2 | `opencode run` |

### The orchestrator seat is model-agnostic

The orchestrator is a ROLE (`agents/roles/orchestrator.md`), not a model. Binding
state lives in the repo: `soul.md`, `decisions.md`, `roadmap.md`, `progress.md`,
handoffs, reports, audits, and consultations. Model-private memory is a
convenience cache, never the source of truth.

## Routing Procedure

When authoring a handoff, the orchestrator profiles the task on five axes and
routes to the cheapest model whose profile covers it:

- **Judgment:** Does the task embed product/design/architecture decisions? Resolve
  decisions before dispatch when possible; route remaining execution cheaper.
- **Ambiguity:** Fully specified -> DeepSeek; mostly specified -> Grok; genuinely
  open-ended -> GPT 5.5.
- **Style-sensitivity:** User-facing UI, UX, copy, or production scenario content
  usually needs GPT 5.5, unless the handoff supplies tight examples and checks.
- **Scope:** Multi-file/multi-package work needs Grok or GPT 5.5.
- **Risk:** Use the risk table below; risk informs dispatch approval and review.

### Domain defaults

| Work | Default model |
|---|---|
| Boilerplate, scaffolding, mechanical refactors, tests with precomputed values, copy swaps, file discovery/summaries | DeepSeek v4 Pro |
| Feature implementation with a clear spec, test repair, medium refactors, most Auditor passes | Grok 4.5 |
| Bounded Consultant memos where the options, source files, and decision points are already named | Grok 4.5 first |
| Architecture, data model, security/auth, ambiguous bugs, design/UI/UX, production scenario content and guessability gates, high-stakes review | GPT 5.5 |
| Routing, decisions, handoff authoring, report review, commits, tiny doc edits it owns | Orchestrator |
| Orchestrator exploration, diff verification, quick checks, transcript summarization | Claude subagents as utility helpers |

### Handoff calibration by executor

- **DeepSeek v4 Pro:** fully prescriptive. Exact file paths, signatures, expected
  values, and commands. Zero design decisions.
- **Grok 4.5:** exact outcomes and constraints, with bounded local judgment for
  implementation details.
- **GPT 5.5:** goal-oriented, with explicit decision boundaries. Do not spend
  tokens restating long background that a context manifest can point to.
- **Claude Fable:** not a normal executor. Use only when the user explicitly
  chooses it for a handoff after seeing why GPT 5.5/Grok is insufficient.

## Context and Output Budgets (D029)

Every new handoff must include:

- **Context Manifest:** exact D-numbers, doc headings/sections, reports/audits,
  and source files the executor must read.
- **Context budget:** small / medium / large, plus why. Large context is reserved
  for phase audits, production-readiness reviews, and genuinely cross-cutting
  architecture decisions.
- **Output budget:** expected artifact length for memos, audits, and reports.
  Default consultation target is 1,200-2,000 words. Use a longer memo only when
  the handoff names the reason.

Default context loading is scoped: read `progress.md` Current Status, How to Run,
Blocked/Questions, and the latest 3 entries. Read older history only when the
handoff names the relevant date, report, audit, or decision trail. Use `rg` and
headings before opening long docs. Do not instruct an executor to read all of
`docs/`, all of `decisions.md`, or all historical progress unless that breadth is
itself part of the task.

Archived progress files under `agents/history/` are opt-in context. Reference a
specific archive section in the Context Manifest when historical detail matters;
otherwise rely on the phase summaries in `progress.md` and `roadmap.md`.

High-reasoning modes are opt-in. Before assigning Fable or any "high reasoning
effort" run, the orchestrator records in the handoff why Grok/GPT 5.5 is
insufficient, the expected context size, and the expected artifact size. If that
cannot be explained in 2-3 sentences, the routing is probably wrong.

## Handoff Dispatch (D023, amended by D028)

**Default: manual handoff.** The orchestrator authors the handoff, then gives the
user the standard dispatch prompt below. The user launches the executor and
returns when the expected R###/A###/C### artifact exists.

**Direct dispatch is opt-in (D028).** The orchestrator may launch a handoff
executor itself - via the headless CLI commands below or a direct tool call -
only with the user's explicit permission, granted per dispatch or per session.
Utility subagents for the orchestrator's own exploration/verification never
require permission.

**Standard dispatch prompt:**

> You are an agent working in this repository. Read `AGENTS.md` and follow its
> Required Reading Order, then read and execute `agents/handoffs/H###_<name>.md`
> exactly. Do NOT run `git commit` or `git push`. When done, write your
> completion report per the handoff's Reporting section.

**Commands for orchestrator-driven dispatch (opt-in, D028):**

```powershell
# Grok 4.5
grok -p "<dispatch prompt>" --permission-mode bypassPermissions --deny "Bash(git commit*)" --deny "Bash(git push*)"

# GPT 5.5 - codex exec reads stdin when not attached to a TTY
"<dispatch prompt>" | codex exec --sandbox workspace-write -a never -

# DeepSeek v4 Pro - stdin must be closed under PowerShell
cmd /c "opencode run --auto -m deepseek/deepseek-v4-pro ""<dispatch prompt>"" < NUL"

# Claude executor, only by explicit override
claude -p "<dispatch prompt>" --permission-mode acceptEdits --disallowedTools "Bash(git commit*)" "Bash(git push*)"
```

Guardrails: workspace-write, no git commit/push. Headless agents auto-approve
edits inside the repo; CLI flags plus the dispatch prompt and `AGENTS.md` forbid
commits/pushes. Manual handoff uses the same handoff file and same rules.

**Post-dispatch health check:** exit code 0 does not mean the handoff finished.
Before reviewing, confirm the expected R###/A###/C### file exists and `git status`
shows the expected changes. If not, inspect the executor session transcript, fix
the flags, and resume rather than restart.

**Dispatch approval gate (D024):** Low- and routine medium-risk development
handoffs may dispatch after task agreement. Explicit pre-dispatch user approval
remains required for high-risk work, major feature additions, phase gates,
irreversible/outward-facing actions, product-rule changes, and any Fable/high
reasoning executor override.

## Risk Levels

Every handoff header declares a risk level. Risk decides the dispatch approval
gate and helps the orchestrator choose review depth; it does not automatically
force an Auditor pass during active development (D024).

| Risk | Definition | Required before orchestrator commits |
|------|------------|--------------------------------------|
| Low | Mechanical, tightly scoped, easily reversible; no game-logic or durable user-visible behavior change | Orchestrator reviews report + diff and runs cheap verification. Auditor normally none. |
| Medium | Spans multiple files/packages or changes prototype user-visible behavior | Orchestrator review + tests/typecheck. Auditor optional. |
| High | Scoring math, architecture, security/auth, data model, leaderboard integrity, production content pipeline, or anything touching `soul.md` rules | GPT 5.5 execution or review, formal Auditor/cross-model review when useful, and explicit user sign-off. |

**Development-speed rule (D024):** formal audits are selective until production
readiness. Use them for major phase completions, substantial feature additions,
high-risk domains, or explicit request.

**Cross-model audit rule (D023):** when a formal audit is used, the Auditor is
always a different model than the Implementor of the handoff under audit.

## Micro-Roles

When a task needs specialist framing, write that framing into the handoff's
`Task Framing (micro-role)` section on top of a base role. Permanent role files
stay few (D001); a new permanent role requires recurring future work no existing
role owns, plus user approval.
