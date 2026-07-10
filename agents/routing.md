# Model Routing and Phase Risk

Roles are hats, not models. Route a phase or large task to the cheapest model
with enough autonomy and domain strength to finish it without orchestrator
decomposition.

## Roster

| Model           | Intelligence | Cost efficiency | Autonomy | Best use |
|-----------------|-------------:|----------------:|---------:|----------|
| Claude Fable    |           10 |               2 |       10 | hardest phases, independent high-risk review |
| GPT 5.6 Sol     |           10 |               5 |       10 | Orchestrator, broad autonomous phase ownership |
| GPT 5.6 Terra   |            9 |               6 |        9 | broad autonomous phase ownership/review |
| GPT 5.6 Luna    |            7 |               8 |        8 | focused execution and judging; Low effort for git/diff work |
| GPT 5.5         |            7 |               6 |        8 | clear medium/large phases, UI and content |
| Grok 4.5        |            8 |               8 |        8 | bounded validation, judging, focused execution |
| DeepSeek v4 Pro |            4 |              10 |        2 | fully prescribed mechanical internal subtasks |

The user chooses the initial orchestrator and may choose the execution harness.
Harness choice does not change the charter or acceptance criteria.

## Codex Subagents vs. Headless Agents

These are different dispatch mechanisms. Do not substitute one silently for the
other.

- **GPT/Codex model:** phase implementations and other large tasks use a new
  Codex task/thread. Same-task Codex subagents have no available interface for
  selecting or confirming their model and reasoning effort, so never use them
  for model-sensitive work. Instead, create a dedicated task/thread, explicitly
  select the requested model and reasoning effort, and do not begin
  model-sensitive work until the user-visible app header has been checked and
  matches the request. API model/thinking values are requested settings, not
  confirmation; do not map or assume equivalence between API and app effort
  labels. The app header is authoritative, and an agent prompt is not
  confirmation. On a mismatch, cancel/recreate the task or let the user retarget
  it before work begins. If the user explicitly allows a mismatched task to
  finish, label it non-authoritative and do not use it to satisfy required
  ownership or review. Same-task subagents are limited to small, bounded,
  non-model-sensitive work.
- **Non-GPT model:** invoke a headless CLI session from the selected worktree.
  Claude uses Claude Code; Grok uses its CLI; DeepSeek uses OpenCode. A Codex
  subagent cannot stand in for a specifically requested non-GPT model.
- When the user does not name a model, default phase and large-task execution to
  **GPT 5.6 Luna with max reasoning** in a new Codex task/thread.
- Preserve the exact requested GPT line and reasoning level. If the harness
  cannot start that model, troubleshoot first; if it still fails, ask the user
  before choosing a replacement, using this roster to recommend one.
- If the active Codex platform blocks an approved non-GPT headless CLI because
  of its external-data policy, do not substitute a Codex model and do not bypass
  the restriction. Give the user the exact repository-local command to run,
  wait for its output, and continue from that output.

## Headless CLI Dispatch

Run from the intended repository/worktree directory. Prompts must tell the agent
to load `AGENTS.md` and the phase/task context, respect the current branch, and
finish the requested acceptance criteria.

```powershell
# DeepSeek v4 Pro through OpenCode
opencode run --auto --pure -m deepseek/deepseek-v4-pro --format default "<task prompt>"

# Grok 4.5
grok -p "<task prompt>" --no-subagents --output-format plain

# Claude Code (use the exact Claude model requested by the user)
claude -p "<task prompt>" --model <requested-model>
```

Headless sessions may implement and test within their delegated scope. They do
not gain permission to push, deploy, spend money, change locked rules, or take
other outward/irreversible actions.

## Git and Diff Offloading

All git operations in the orchestrated workflow—including status, diff, staging,
committing, branch cleanup, merging, and pushing—are delegated to a dedicated
Codex task using **GPT 5.6 Luna at Low reasoning**. Target the exact local project
or worktree, explicitly select `gpt-5.6-luna` and `low`, and confirm the visible
task header matches before allowing git commands. Same-task subagents cannot
substitute because their model and effort cannot be selected or confirmed. The
orchestrator supplies the exact intended scope and retains responsibility for
authorization and the result. Luna Low must not push without explicit user
approval or discard unrelated work.

The normal Codex-app flow is authoritative. Use the pinned non-interactive helper
only when a dedicated app task is unavailable:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Invoke-CodexGit.ps1 `
  -Task "Inspect status, stage only the approved Phase 7 files, run the staged diff check, and report the result. Do not commit or push."
```

Use the read-only diff summarizer before a higher-reasoning model reads a broad
diff. It prints a compact Luna Low summary and does not create a report artifact:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/Invoke-DiffSummarizer.ps1 -Mode Staged
```

Both helpers pin `gpt-5.6-luna`, `model_reasoning_effort="low"`, and strict
configuration validation. A CLI request is not a substitute for visible header
confirmation when the app flow is available. The summary is a routing aid, not
approval. Expand into the raw diff only for security-sensitive areas,
discrepancies, or risks the summary identifies.

## Routing Rules

- Prefer one capable owner for a roadmap phase. Do not split work solely to route
  pieces to cheaper models.
- Use Grok or DeepSeek for bounded mechanical work when the Phase Owner remains
  responsible for the result.
- Use an independent model when blindness or cross-model review matters.
- Record a model rationale only for a premium choice or unusual tradeoff; two
  sentences is enough.

## Risk and Final Review

| Risk | Examples | Phase-close review |
|------|----------|--------------------|
| Normal | UI, ordinary features, refactors, tooling | acceptance suite + targeted diff |
| High | scoring, auth, DB trust, security/privacy, leaderboard integrity, production content pipeline | independent strong-model review + acceptance suite |

There are no routine mid-phase reviews. Tests, validation, blind Gate 2, source
checks, and browser QA run inside the phase as verification.

## Dispatch

Once the user approves a phase charter, the Orchestrator may dispatch its owner
without further approval stops. The owner works until acceptance or a legitimate
stop condition from `AGENTS.md`.

Use a dedicated non-main branch. Add a separate worktree when parallelism,
existing dirty work, or the harness benefits from it.

## Context and Output Budget

- Startup: routing policy, `soul.md`, current roadmap phase, compact progress
  state, and phase charter.
- Discover code context on demand with `rg`, source inspection, and tests.
- Do not preload old handoffs, reports, audits, or full documentation.
- One phase closeout, normally <=500 words. No per-session reports or persisted
  diff summaries.
