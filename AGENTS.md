# AGENTS.md — Phase-Oriented Operating Rules

You are working on **Signal or Noise?**, a mobile-first market-history guessing
game. Work is organized by roadmap phase. The default unit of autonomous agent
work is an entire phase, not a small handoff.

## Startup

### Interactive session with no assigned phase or role

You are the Orchestrator. Read `agents/orchestrator_boot.md` first and follow its
minimal-context startup.

### Assigned phase

Read, in order:

1. `soul.md` — locked product identity and rules.
2. The current phase section of `roadmap.md`.
3. `progress.md` — Current Status, How to Run, and Blocked/Questions only.
4. The assigned charter in `agents/phases/`.
5. A role file only when the charter assigns a specialist role.

Then inspect the relevant source directly. Do not preload historical reports,
old handoffs, archived decisions, or broad documentation unless the phase charter
or a concrete blocker identifies them as necessary.

## Operating Model

1. The user approves a concise phase charter once.
2. One high-autonomy **Phase Owner** executes the phase end to end: discovery,
   implementation, tests, correction, and final verification.
3. Internal batches and checkpoints are implementation details. They do not
   require new handoffs, reports, approvals, or orchestrator reviews.
4. The owner stops only for a decision outside delegated authority, a conflict
   with locked rules, required external credentials/access, an irreversible or
   outward-facing action, or a blocker that prevents the phase acceptance
   criteria from being met.
5. When every criterion passes, the owner writes one concise phase closeout in
   `agents/phase-closeouts/` and marks the phase ready for review.
6. A different capable agent reviews once at the phase boundary. High-risk
   phases receive cross-model audit depth; normal phases receive acceptance-suite
   verification and targeted diff inspection.
7. The Orchestrator accepts or requests one focused repair cycle, then commits or
   integrates the phase. Never push without the user's approval.

Tests, validators, blind judging, security checks, and browser checks are
**verification**, not extra management reviews. Run them whenever useful. When
independence matters — for example blind content judging — use a separate model
inside the phase without creating a new approval/report loop.

## Token-Efficiency Rules

- One source of truth per fact. Link to owning code/docs instead of restating it.
- A phase charter states outcomes, constraints, delegated authority, acceptance,
  and the few best starting points. It does not enumerate every file the owner
  may inspect.
- Let autonomous models discover implementation context with `rg` and tests.
- Do not create routine session logs, fix-up handoffs, dispatch-approval reports,
  review reports, or persisted diff summaries.
- The phase closeout defaults to 500 words or fewer. Put bulky evidence in an
  existing machine-readable product artifact only when the product workflow
  genuinely needs it.
- Record durable product/architecture decisions in `decisions.md`; do not record
  ordinary implementation judgments.
- Keep `progress.md` as current state, not chronology. Git history and archived
  phase closeouts preserve history.
- Split a phase only when external sequencing or an independently shippable
  boundary makes one owner impractical. Do not split merely to reduce perceived
  task size.

## Branches and Worktrees

- A dedicated phase branch is recommended because it gives the phase one clean
  diff and keeps incomplete work off the main branch.
- A separate worktree is optional. Use one for parallel agents, a dirty primary
  checkout, or when the chosen harness creates one automatically. A single
  sequential phase can run on a dedicated branch in the normal checkout.
- This policy is harness-agnostic. Claude Code runs from the selected worktree
  directory; T3 Code may create and manage a thread branch/worktree itself; Codex
  may do the same. Repository rules and the phase charter remain authoritative.
- A Phase Owner may make checkpoint commits only on a dedicated non-main phase
  branch. Checkpoint commits are not approval. Never push unless authorized.
- When working in the main/shared checkout, agents do not commit. Never discard
  or overwrite changes they did not make.

## Golden Rule

Deliver the phase outcome and acceptance criteria while respecting locked rules
and explicit exclusions. The owner has discretion over reversible implementation
details and may repair, replace, or reorganize in-scope work without asking for
permission. Product scope, game rules, architecture commitments, and outward
actions remain Orchestrator/user decisions.

## Locked Stack and Layout

- pnpm monorepo (`pnpm-workspace.yaml`)
- Next.js App Router + strict TypeScript + Tailwind CSS in `apps/web`
- Pure game logic in `packages/game-engine`
- Zod-validated content pipeline in `packages/content`
- Prisma + PostgreSQL in Phase 5+, not before
- Vitest for unit tests
- Mobile-first UI at approximately 375px first
- Windows-compatible scripts; no bash-only package scripts

```text
apps/web/                 web app
packages/game-engine/     pure scoring and run logic
packages/content/         scenarios, schemas, validation
packages/database/        database work from Phase 5+
docs/                     product documentation
agents/phases/            active phase charters
agents/phase-closeouts/   one closeout per completed phase
agents/history/           legacy and archived workflow evidence
business/                 growth outputs
```

## Game-Math Guardrails

All scoring math lives in `packages/game-engine`; never duplicate it in UI or
server code.

- Confidence: Low 10%/±1, Medium 40%/±2, High 70%/±3, All-In 100%/±5
- Pass: $0 bankroll change, −0.25 Signal Score, completed round
- Short losses capped at stake; bankroll never goes below $0
- `actualReturnPercent` is decimal (`0.35` means +35%)
- Exactly zero return is an incorrect call (`rawReturn > 0`)

If code and `soul.md` disagree, `soul.md` wins and the owner reports the conflict.

## Coding and Safety Conventions

- TypeScript `strict: true`; no `any` without a comment explaining why.
- Use string unions for game enums.
- Game-engine functions are pure: no I/O, time reads, or side effects.
- Currency uses plain numbers in the prototype; formatting belongs in UI.
- Keep components small and compose screens from them.
- Never expose pre-decision answer, reveal, end-price, return, or outcome-chart
  data in database-backed phases. Official scores are server-calculated.
- Never edit `soul.md`, roadmap phase definitions, or settled decisions without
  explicit user approval.
- Never stage or commit secrets, `.env`, or `node_modules`.
- Preserve unrelated dirty-worktree changes.

## Definition of Done

A phase is ready for its single review when:

1. Every phase-charter acceptance criterion passes.
2. Relevant tests and validators pass; the full phase acceptance suite has run.
3. Runtime behavior was checked when the phase changes user-facing execution.
4. Known limitations are explicit and do not contradict acceptance.
5. `progress.md` current state is accurate.
6. One concise phase closeout exists.

Legacy `agents/handoffs/` and `agents/reports/` files remain evidence for work
started under the old process. Do not create new H### or R### artifacts unless an
active phase charter explicitly requires compatibility with unfinished legacy work.
