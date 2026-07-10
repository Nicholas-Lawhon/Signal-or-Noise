# agents/ — Phase-Oriented Workflow

The roadmap phase is the default unit of agent work. The user approves one short
charter, one autonomous owner executes it end to end, and a different capable
agent reviews once at phase completion.

```text
User + Orchestrator
        |
        v
  phase charter -------- one authorization
        |
        v
  Phase Owner ----------- discover / build / test / repair
        |
        +--------------- independent validators when intrinsically required
        |
        v
  phase closeout -------- one concise evidence summary
        |
        v
  phase review ---------- accept or one focused repair
```

Internal batches are allowed, but they do not create new prompts, reports,
approval gates, or reviews.

## Active Files

```text
orchestrator_boot.md   minimal interactive startup
routing.md             model selection and phase-risk policy
roles/                 specialist boundaries
phases/                active phase charters
phase-closeouts/       one final closeout per completed phase
history/               archived/legacy evidence
```

Legacy `handoffs/`, `reports/`, `audits/`, and `consultations/` entry
points are retired. Their evidence and retired templates live in phase bundles
under `history/`; new development does not use H###/R### chains.

## Charter Rules

A charter contains only:

- phase outcome and exclusions;
- delegated authority and true stop conditions;
- a few high-value context starting points;
- binary acceptance criteria and final verification;
- branch/worktree arrangement when relevant.

It should not dictate ordinary implementation steps or enumerate every file an
autonomous owner may inspect.

## Tool Compatibility

The workflow is independent of the coding harness:

- Claude Code: launch it from the checkout/worktree that owns the phase.
- T3 Code: let the app create a thread branch/worktree and point the thread at the
  phase charter.
- Codex: use the current checkout or a Codex-managed worktree.

Branches isolate history. Worktrees additionally isolate filesystem state and are
useful for parallelism. Neither changes the repository instructions.
