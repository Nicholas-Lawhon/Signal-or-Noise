# routing.md — Model Routing & Risk Policy (D021)

The orchestrator consults this file when authoring every handoff. Single source
of truth for which model executes a task and how much review the result needs.

**The token-economy rule:** route to the cheapest tier that can execute without
making judgment calls. Never spend strong-model tokens on mechanical work. Never
let cheap models make decisions.

## Execution Tiers

| Tier | Model | Invoked via | Use for | Never use for |
|------|-------|-------------|---------|---------------|
| Orchestrator | Claude Fable (interactive session) | The user's session | Routing, decisions, handoff authoring, report review, commits, tiny doc edits it owns | Mechanical implementation a cheaper tier can do |
| Cheap | DeepSeek | Manual handoff (user pastes prompt) | Easy tasks with fully prescriptive instructions: scoped implementation, mechanical refactors, test additions with precomputed values, copy changes, file discovery/summaries | Anything requiring a product, architecture, or scope judgment |
| Medium | Claude Sonnet/Opus subagent | Orchestrator spawns in-session (Agent tool) | Medium-strength tasks; anything the orchestrator judges too subtle for the cheap tier; most Auditor passes | Architecture/scoring/security decisions |
| Strong | GPT 5.5 | Manual handoff (user pastes prompt) | Hard tasks: architecture, schema/data model, scoring design, security/auth, ambiguous bugs, high-stakes review, consultations | Mechanical work |

In-session subagents follow the identical procedure as external agents: they
read the approved handoff plus required reading, obey `AGENTS.md` and their role
file, leave all work uncommitted, and write the R### completion report. The
review loop does not change (D012).

## Risk Levels

Every handoff header declares a risk level. Risk decides the review gate, not
the model tier (though high risk usually implies the strong tier).

| Risk | Definition | Required before orchestrator commits |
|------|-----------|--------------------------------------|
| **Low** | Mechanical, tightly scoped, easily reversible; no game-logic or user-visible behavior change | Orchestrator reviews report + diff. Auditor pass optional. |
| **Medium** | Touches game logic, spans multiple files/packages, or changes user-visible behavior | Auditor pass required before approval. |
| **High** | Scoring math, architecture, security/auth, data model, or anything touching `soul.md` rules | Strong-tier execution or review, Auditor pass, and explicit user sign-off. |

## Micro-Roles

When a task needs a specialist framing (e.g., "database migration reviewer",
"UX copy editor"), the orchestrator writes that framing INTO the handoff's
`Task Framing (micro-role)` section, layered on a base role (Implementor,
Auditor, or Consultant). The framing states what to focus on and what to ignore
for this task only. Permanent role files stay few (D001); a new permanent role
still requires recurring future work no existing role plausibly owns, plus user
approval.
