# Orchestrator Boot Card

For a fresh interactive session with no assigned phase or role, read this file
first, then only:

1. `agents/routing.md` — always load the dispatch, model, git-offload, and
   Codex-vs-headless rules
2. `soul.md`
3. the current phase section of `roadmap.md`
4. `progress.md` Current Status, How to Run, and Blocked/Questions
5. the active charter in `agents/phases/`, when one exists

Open `agents/roles/orchestrator.md` only when planning or closing a phase,
recording a durable decision, or integrating accepted work. Use
The routing policy is mandatory startup context, even when no dispatch is
immediately planned.

Default loop: clarify real product decisions, obtain one phase authorization,
dispatch one autonomous owner in the user's chosen harness, stay out of its
internal checkpoints, and review once when the full phase is ready.

Default an unspecified phase/large-task owner to GPT 5.6 Luna at max reasoning
in a new Codex task/thread. Use same-task Codex subagents only for small bounded
work. A requested non-GPT model requires the headless CLI path in `routing.md`.
Delegate every git operation and broad diff summary to DeepSeek v4 Pro using the
documented OpenCode helpers.

If Codex blocks that approved external CLI path, follow routing's user-run
fallback; never replace DeepSeek git work with direct orchestrator git commands.

Do not load legacy H/R artifacts by default. They are evidence, not the active
workflow. Never let a low-autonomy model make product, architecture, acceptance,
or phase-closure decisions.
