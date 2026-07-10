# Model Routing and Phase Risk

Roles are hats, not models. Route the whole phase to the cheapest model with the
autonomy and domain strength to finish it without orchestrator decomposition.

## Roster

| Model | Intelligence | Cost efficiency | Autonomy | Best use |
|---|---:|---:|---:|---|
| Claude Fable | 10 | 2 | 10 | hardest phases, independent high-risk review |
| GPT 5.6 Sol | 10 | 5 | 10 | broad autonomous phase ownership |
| GPT 5.6 Terra | 9 | 6 | 10 | broad autonomous phase ownership/review |
| GPT 5.5 | 8 | 6 | 9 | clear medium/large phases, UI and content |
| Grok 4.5 | 8 | 8 | 7 | bounded validation, judging, focused execution |
| DeepSeek v4 Pro | 4 | 10 | 2 | mechanical internal subtasks only |

The user chooses the initial orchestrator and may choose the execution harness.
Claude Code, Codex, and T3 Code are all valid. Harness choice does not change the
charter or acceptance criteria.

## Routing Rules

- Prefer one GPT 5.5+ owner for a roadmap phase. A cheaper executor is not cheaper
  when it requires detailed handoffs, repeated context loading, and frequent review.
- Use Grok or DeepSeek for a bounded phase-internal operation only when its inputs
  and outputs are mechanical and the Phase Owner remains responsible for the result.
- Use an independent model when blindness or cross-model review matters.
- Do not split work solely to route pieces to cheaper models.
- Record a model rationale only when selecting a premium model or making an unusual
  tradeoff; two sentences is enough.

## Risk and Final Review

| Risk | Examples | Phase-close review |
|---|---|---|
| Normal | UI, ordinary features, refactors, tooling | acceptance suite + targeted diff |
| High | scoring, auth, DB trust, security/privacy, leaderboard integrity, production content pipeline | independent strong-model review + acceptance suite |

There are no routine mid-phase reviews. Tests, validation, blind Gate 2, source
checks, and browser QA run inside the phase as verification.

## Dispatch

Once the user approves a phase charter, the Orchestrator may dispatch its owner
without further approval stops. The owner works until acceptance or a legitimate
stop condition from `AGENTS.md`.

Use a dedicated non-main branch. Add a separate worktree when parallelism,
existing dirty work, or the harness benefits from it. T3 Code can manage its own
thread branch/worktree; Claude Code can be launched from the chosen worktree
directory; a normal checkout is sufficient for sequential work.

## Context and Output Budget

- Startup: `soul.md`, current roadmap phase, compact progress state, phase charter.
- Discover code context on demand with `rg`, source inspection, and tests.
- Do not preload old handoffs, reports, audits, or full documentation.
- One phase closeout, normally <=500 words. No per-session reports or persisted
  diff summaries.
