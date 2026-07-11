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

Default an unspecified phase/large-task owner to GPT 5.6 Luna at xHigh reasoning
in a new Codex task/thread. For Luna, request the Codex effort label `xhigh` for
the maximum-intended setting; `max` currently resolves to Medium in the app. Use
same-task Codex subagents only for small bounded,
non-model-sensitive work: their interface does not provide model/reasoning
selection. For model-sensitive GPT work, explicitly select the requested model
and reasoning effort in a dedicated task/thread; manual visible-header
confirmation is not required. If the task or runtime reports a mismatch,
cancel/recreate it, have the user retarget it, or obtain an explicit exception.
A requested non-GPT model requires the headless CLI path in `routing.md`.
Delegate every git operation and broad diff summary to a dedicated GPT 5.6 Luna
task at Low reasoning using the documented Codex workflow. The pinned Codex CLI
helpers are fallback paths only; never replace delegated git work with direct
orchestrator git commands.

Do not load legacy H/R artifacts by default. They are evidence, not the active
workflow. Never let a low-autonomy model make product, architecture, acceptance,
or phase-closure decisions.
