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
in a new Codex task/thread. Use same-task Codex subagents only for small bounded,
non-model-sensitive work: their interface does not provide model/reasoning
selection or status confirmation. API model/thinking values are requested, not
confirmed. For model-sensitive GPT work, explicitly select the requested model
and reasoning effort in a dedicated task/thread, then do not begin until its
user-visible app header has been checked and matches the request. Do not map or
assume equivalence between API and app effort labels; the app header is
authoritative and a prompt alone is not confirmation. If it does not match,
cancel/recreate the task or have the user retarget it before work begins. If the
user explicitly permits a mismatched task to finish, label it non-authoritative
and do not use it for required ownership or review. A requested non-GPT model
requires the headless CLI path in `routing.md`.
The Orchestrator may perform routine status and branch/worktree setup. Delegate
broad diff summaries and consequential integration git work to a dedicated GPT
5.6 Luna task at Low reasoning using the documented Codex workflow. Confirm the
visible task header says GPT 5.6 Luna and Low before delegated work begins. The
pinned Codex CLI helpers remain fallback paths.

Do not load legacy H/R artifacts by default. They are evidence, not the active
workflow. Never let a low-autonomy model make product, architecture, acceptance,
or phase-closure decisions.
