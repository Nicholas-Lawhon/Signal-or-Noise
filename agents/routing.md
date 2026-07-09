# routing.md — Model Routing & Risk Policy (D021, D023)

The orchestrator consults this file when authoring every handoff. Single source
of truth for which model executes a task, how it is invoked, and how much review
the result needs.

**The token-economy rule:** route to the cheapest model whose characteristics
cover the task. Never spend strong-model tokens on mechanical work. Never let
cheap models make decisions.

## Model Roster & Characteristics

Ratings are 1–10 (10 = best). Intelligence / Cost-efficiency / Style are the
user's ratings; Speed / Autonomy are orchestrator estimates the user corrects
over time. **Autonomy** = how much judgment the model can safely be delegated —
the inverse of how prescriptive its handoffs must be.

| Model | Intelligence | Cost-eff. | Style | Speed | Autonomy | Invoked via |
|---|---|---|---|---|---|---|
| Claude Fable | 10 | 2 | 7 | 5 | 10 | `claude -p` |
| GPT 5.5 | 9 | 5 | 9 | 8 | 9 | `codex exec` |
| Grok 4.5 | 8 | 8 | TBD¹ | 6 | 7 | `grok -p` |
| Claude Sonnet/Opus (utility) | 6–8 | n/a² | 7 | 8 | 7 | in-session subagents³ |
| DeepSeek v4 Pro | 4 | 10 | 5 | 8 | 2 | `opencode run` |

¹ Style TBD — the user rates it after Grok's first 2–3 handoffs; update this table.
² Included in the orchestrator session; not a separately billed executor.
³ Via the orchestrator host's subagent facility (Claude Code: the Agent tool).
  A non-Claude orchestrator uses `claude -p` (see dispatch commands) instead.

### The orchestrator seat is model-agnostic

The orchestrator is a ROLE (`agents/roles/orchestrator.md`), not a model. All
binding state lives in the repo — `soul.md`, `decisions.md`, `roadmap.md`,
`progress.md`, the handoff/report/audit files — and every entry path
(`CLAUDE.md`, `AGENTS.md`) routes a fresh session through the same Required
Reading Order. To seat a different model as orchestrator: start its session in
the repo root, have it read `AGENTS.md` → `agents/roles/orchestrator.md`, and
update this table's orchestrator row. Any model-private memory (e.g. Claude's
auto-memory) is a convenience cache, never the source of truth.

## Routing Procedure

When authoring a handoff, the orchestrator profiles the task on five axes and
routes to the cheapest model whose profile covers it:

- **Judgment** — does the task embed product/design/architecture decisions?
  High judgment → GPT 5.5, or the orchestrator resolves the decisions first and
  routes the residue cheaper.
- **Ambiguity** — can the outcome be fully specified up front? Fully → DeepSeek;
  mostly → Grok; genuinely open-ended → GPT 5.5.
- **Style-sensitivity** — user-facing UI, UX, copy, or scenario content where
  taste matters → GPT 5.5 (Style 9).
- **Scope** — multi-file/multi-package work needs a model that holds context:
  Grok or GPT 5.5, not DeepSeek.
- **Risk** — per the risk table below; risk gates dispatch approval and informs
  review depth. D024 overrides the old automatic medium-risk audit loop during
  active development.

### Domain defaults

| Work | Default model |
|---|---|
| Boilerplate, scaffolding, mechanical refactors, tests with precomputed values, copy swaps, file discovery/summaries | DeepSeek v4 Pro |
| Feature implementation with a clear spec, test repair, medium refactors, most Auditor passes | Grok 4.5 |
| Architecture, data model, security/auth, ambiguous bugs, design/UI/UX, production scenario content + guessability gates (Curator work), Consultant memos, high-stakes review | GPT 5.5 |
| Routing, decisions, handoff authoring, report review, commits, tiny doc edits it owns | Orchestrator |
| Orchestrator's own exploration, diff verification, quick checks (not handoff execution) | Claude subagents (utility) |

### Handoff calibration by executor

Instruction granularity scales inversely with the executor's Autonomy rating:

- **DeepSeek v4 Pro** — fully prescriptive: exact file paths, exact signatures,
  precomputed expected values, code blocks for anything that could drift. Zero
  design decisions left to the model.
- **Grok 4.5** — prescriptive on outcomes and constraints: exact acceptance
  criteria and do-not lists, but local implementation judgment (file-internal
  structure, minor naming, test organization) is delegated within stated bounds.
- **GPT 5.5** — goal-oriented: objective, constraints, acceptance criteria, and
  explicitly delegated bounded design decisions. Spend its intelligence — tell
  it what problem to solve and where the fences are, not each step.

## Direct CLI Dispatch (D023)

All three executor CLIs are installed and authenticated on the dev machine. The
orchestrator dispatches handoffs itself instead of the user pasting prompts.

**Standard dispatch prompt** (same framing for every executor):

> You are an agent working in this repository. Read `AGENTS.md` and follow its
> Required Reading Order, then read and execute `agents/handoffs/H###_<name>.md`
> exactly. Do NOT run `git commit` or `git push`. When done, write your
> completion report per the handoff's Reporting section.

**Commands** (run from repo root, in the background; wait for the R### report).
Smoke-tested 2026-07-08 — the stdin/auto details below are required, not optional:

```powershell
# Grok 4.5 (medium work) — bypassPermissions is required for any handoff that
# runs shell commands (tests, git show, sub-CLI calls): acceptEdits auto-approves
# file edits only, and a blocked shell approval ends the session SILENTLY with
# exit 0 and no error. The --deny rules still apply in bypass mode. If a run
# ends early, `grok --resume <session-id> -p "<continue instruction>"` picks it
# up with context intact (`grok sessions list` for the id).
grok -p "<dispatch prompt>" --permission-mode bypassPermissions --deny "Bash(git commit*)" --deny "Bash(git push*)"

# GPT 5.5 (hard work) — codex exec reads the prompt from stdin when not attached
# to a TTY: pipe it in and pass `-` as the prompt argument, or it hangs.
"<dispatch prompt>" | codex exec --sandbox workspace-write -a never -

# DeepSeek v4 Pro (cheap work) — --auto is required headlessly, AND stdin must
# be closed or the run hangs before sending anything (from PowerShell wrap in
# cmd /c with `< NUL`; from bash append `< /dev/null`).
cmd /c "opencode run --auto -m deepseek/deepseek-v4-pro ""<dispatch prompt>"" < NUL"

# Claude (Fable/Opus/Sonnet via --model) — only when Claude is NOT the
# orchestrator, or a Claude executor is explicitly wanted. Tolerates a non-TTY
# stdin (3s wait, then proceeds); `< NUL` skips the wait.
claude -p "<dispatch prompt>" --permission-mode acceptEdits --disallowedTools "Bash(git commit*)" "Bash(git push*)"
```

Verified smoke-test results (2026-07-08): all four ran headlessly against this
repo and answered correctly (grok/codex/opencode read `progress.md`; claude
echo test). Grok needs no stdin workaround.

Guardrails: workspace-write, no git. Headless agents auto-approve edits inside
the repo; git commit/push is forbidden by CLI deny rules where the CLI supports
them and by the dispatch prompt + `AGENTS.md` everywhere (D012 unchanged: the
uncommitted diff plus the R### report is the review artifact). **Manual paste
remains the fallback** if a CLI is down — same handoff file, same rules.

**Post-dispatch health check:** exit code 0 does NOT mean the handoff finished —
a headless run that hits an unapprovable permission prompt can end silently.
Before reviewing, confirm the expected R###/A### file exists and `git status`
shows the agent's changes; if not, inspect the executor's session transcript,
fix the flags, and resume rather than restart.

**Dispatch approval gate (D024 development policy):**

Current rule: low- and routine medium-risk development handoffs may be dispatched
after the user agrees to the task; no second handoff-approval stop is required.
Explicit pre-dispatch user approval remains required for high-risk work, major
feature additions, phase gates, irreversible/outward-facing actions, and product
rule changes. Any older medium/high approval text in historical entries or
legacy bullets is superseded by this D024 rule.


## Risk Levels

Every handoff header declares a risk level. Risk decides the dispatch approval
gate and helps the orchestrator choose review depth; it does not automatically
force an Auditor pass during active development (D024). The handoff should add
`**Audit:** required | optional | none` when review depth is not obvious.

| Risk | Definition | Required before orchestrator commits |
|------|-----------|--------------------------------------|
| **Low** | Mechanical, tightly scoped, easily reversible; no game-logic or durable user-visible behavior change | Orchestrator reviews report + diff and runs cheap verification. Auditor normally none. |
| **Medium** | Spans multiple files/packages or changes prototype user-visible behavior | Orchestrator review + tests/typecheck. Auditor optional; use for major feature additions, phase gates, or explicit request. |
| **High** | Scoring math, architecture, security/auth, data model, leaderboard integrity, production content pipeline, or anything touching `soul.md` rules | GPT 5.5 execution or review, formal Auditor/cross-model review, and explicit user sign-off. |

**Development-speed rule (D024):** formal audits are selective until production
readiness. Use them for major phase completions, substantial feature additions,
high-risk domains, or explicit user/orchestrator request. Placeholder scenario
content only needs literal leak checks and D022 clue-count structure unless a
handoff marks it production-quality.

**Cross-model audit rule (D023):** when a formal audit is used, the Auditor is
always a different model than the Implementor of the handoff under audit — e.g.
Grok implements → GPT 5.5 audits; GPT 5.5 implements → Grok audits. Independent
eyes catch self-consistent mistakes.

## Micro-Roles

When a task needs a specialist framing (e.g., "database migration reviewer",
"UX copy editor"), the orchestrator writes that framing INTO the handoff's
`Task Framing (micro-role)` section, layered on a base role (Implementor,
Auditor, or Consultant). The framing states what to focus on and what to ignore
for this task only. Permanent role files stay few (D001); a new permanent role
still requires recurring future work no existing role plausibly owns, plus user
approval.
