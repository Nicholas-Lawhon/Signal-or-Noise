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
| Claude Fable (orchestrator) | 10 | 2 | 7 | 5 | — | the user's session |
| GPT 5.5 | 9 | 4 | 9 | 4 | 9 | `codex exec` |
| Grok 4.5 | 7 | 8 | TBD¹ | 7 | 6 | `grok -p` |
| Claude Sonnet/Opus (utility) | 6–8 | n/a² | 7 | 8 | 7 | Agent tool, in-session |
| DeepSeek v4 Pro | 4 | 10 | 5 | 8 | 2 | `opencode run` |

¹ Style TBD — the user rates it after Grok's first 2–3 handoffs; update this table.
² Included in the orchestrator session; not a separately billed executor.

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
- **Risk** — per the risk table below; risk gates review and dispatch approval,
  and high risk usually implies GPT 5.5 execution or review.

### Domain defaults

| Work | Default model |
|---|---|
| Boilerplate, scaffolding, mechanical refactors, tests with precomputed values, copy swaps, file discovery/summaries | DeepSeek v4 Pro |
| Feature implementation with a clear spec, test repair, medium refactors, most Auditor passes | Grok 4.5 |
| Architecture, data model, security/auth, ambiguous bugs, design/UI/UX, scenario content + guessability gates (Curator work), Consultant memos, high-stakes review | GPT 5.5 |
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
# Grok 4.5 (medium work)
grok -p "<dispatch prompt>" --permission-mode acceptEdits --deny "Bash(git commit*)" --deny "Bash(git push*)"

# GPT 5.5 (hard work) — codex exec reads the prompt from stdin when not attached
# to a TTY: pipe it in and pass `-` as the prompt argument, or it hangs.
"<dispatch prompt>" | codex exec --sandbox workspace-write -a never -

# DeepSeek v4 Pro (cheap work) — --auto is required headlessly, AND stdin must
# be closed or the run hangs before sending anything (from PowerShell wrap in
# cmd /c with `< NUL`; from bash append `< /dev/null`).
cmd /c "opencode run --auto -m deepseek/deepseek-v4-pro ""<dispatch prompt>"" < NUL"
```

Verified smoke-test results (2026-07-08): all three read `progress.md` in this
repo headlessly and answered correctly. Grok needs no stdin workaround.

Guardrails: workspace-write, no git. Headless agents auto-approve edits inside
the repo; git commit/push is forbidden by CLI deny rules where the CLI supports
them and by the dispatch prompt + `AGENTS.md` everywhere (D012 unchanged: the
uncommitted diff plus the R### report is the review artifact). **Manual paste
remains the fallback** if a CLI is down — same handoff file, same rules.

**Dispatch approval gate (risk-based):**

- **Low risk** — the orchestrator authors the handoff and dispatches immediately
  after the user agrees to the task; no second stop.
- **Medium / High risk** — the user approves the drafted handoff
  (`draft → approved`) before the orchestrator launches the executor.

## Risk Levels

Every handoff header declares a risk level. Risk decides the review gate and
the dispatch approval gate, not the model choice (though high risk usually
implies GPT 5.5 execution or review).

| Risk | Definition | Required before orchestrator commits |
|------|-----------|--------------------------------------|
| **Low** | Mechanical, tightly scoped, easily reversible; no game-logic or user-visible behavior change | Orchestrator reviews report + diff. Auditor pass optional. |
| **Medium** | Touches game logic, spans multiple files/packages, or changes user-visible behavior | Auditor pass required before approval. |
| **High** | Scoring math, architecture, security/auth, data model, or anything touching `soul.md` rules | GPT 5.5 execution or review, Auditor pass, and explicit user sign-off. |

**Cross-model audit rule (D023):** the Auditor is always a different model than
the Implementor of the handoff under audit — e.g. Grok implements → GPT 5.5
audits (high risk) or a Claude utility subagent verifies; GPT 5.5 implements →
Grok audits. Independent eyes catch self-consistent mistakes.

## Micro-Roles

When a task needs a specialist framing (e.g., "database migration reviewer",
"UX copy editor"), the orchestrator writes that framing INTO the handoff's
`Task Framing (micro-role)` section, layered on a base role (Implementor,
Auditor, or Consultant). The framing states what to focus on and what to ignore
for this task only. Permanent role files stay few (D001); a new permanent role
still requires recurring future work no existing role plausibly owns, plus user
approval.
