# AGENTS.md — Operating Rules for All Coding Agents

You are working on **Signal or Noise?**, a mobile-first market-history guessing game.
This file defines how every agent (Claude Code, OpenCode, Codex, or any other)
operates in this repository.

## Required Reading Order

Before doing ANY work, read in this order:

1. `soul.md` — product identity and locked rules (non-negotiable)
2. `roadmap.md` — phases and current phase marker
3. `progress.md` — current state, last session log
4. Your role file in `agents/roles/` (the handoff prompt tells you which one)
5. Your assigned handoff prompt in `agents/handoffs/`

Consult `docs/` (01–10) when your handoff references them. `decisions.md` records
settled decisions — never re-litigate or contradict them. During active
development, D024 controls review depth: ship tested increments quickly; reserve
formal audits for phase gates, major feature additions, and high-risk domains.

## The Golden Rule

**Implement exactly what your handoff prompt specifies. Nothing more, nothing less.**

- Do not add features, packages, abstractions, or "improvements" beyond the handoff.
- Do not refactor code outside the handoff's scope.
- If the handoff is ambiguous, contradicts these docs, or seems wrong: STOP, write
  what you found in `progress.md` under "Blocked/Questions", and end your session.
  Do not guess on decision-level questions.
- Small mechanical judgment calls (variable names, file-internal organization) are
  yours to make. Product, architecture, and scope calls are not.

## Tech Stack (locked — see decisions.md)

- pnpm monorepo (`pnpm-workspace.yaml`)
- Next.js (App Router) + TypeScript (strict) + Tailwind CSS — `apps/web`
- Pure game logic in `packages/game-engine` (no UI, no database imports)
- Content pipeline in `packages/content` (Zod validation)
- Prisma + PostgreSQL (Phase 4+, not before)
- Vitest for unit tests
- Zod for scenario validation

## Repository Layout

```text
apps/web/            Next.js web app (routes, screens, server actions)
apps/mobile/         Expo app — LATER, do not create yet
packages/game-engine/ Pure TypeScript game logic + tests
packages/content/    Scenario JSON seeds, schemas, validation scripts
packages/database/   Prisma schema, migrations, import scripts (Phase 4+)
packages/shared-types/ Shared interfaces (create only when first needed)
docs/                Product documentation (read-only for implementors)
agents/              Roles, handoffs, audits, consultations
business/            Growth-role outputs (marketing, social, sales)
```

## Game Math Quick Reference

All scoring math lives in `packages/game-engine` and nowhere else. The web app,
and later the server and mobile app, import it. Never duplicate scoring logic.

- Confidence: Low 10%/±1, Medium 40%/±2, High 70%/±3, All-In 100%/±5
- Pass: $0 bankroll change, −0.25 Signal Score, counts as completed round
- Short losses capped at stake; bankroll floors at $0 (bankruptcy ends run)
- `actualReturnPercent` is a decimal: +35% = `0.35`
- A return of exactly 0 counts as an incorrect call (`rawReturn > 0` is the test)

Full rules: `soul.md`. If code and `soul.md` disagree, `soul.md` wins — report the
discrepancy.

## Coding Conventions

- TypeScript `strict: true` everywhere. No `any` unless justified in a comment.
- String-union types for game enums (`'long' | 'short' | 'pass'`), matching
  `docs/06_data_model.md`.
- Game-engine functions are pure: no I/O, no Date.now() inside scoring, no
  side effects.
- Tests live next to packages (`packages/game-engine/tests/` or `src/*.test.ts`);
  run with `pnpm test` from repo root.
- Currency is stored/computed as plain numbers (dollars) in the prototype;
  display formatting happens only in UI components.
- Mobile-first: build every screen for ~375px width first.
- Keep components small; screens compose components.
- Cross-platform scripts only — the primary dev machine is **Windows**. No bash-only
  script commands in package.json (no `rm -rf`, use `rimraf` or Node scripts if needed).

## Anti-Cheat Posture

Local prototype (Phases 0–2): reveal data may live client-side.
Database-backed phases (4+): server calculates official scores; the pre-decision
payload must not contain company name, ticker, end price, return, reveal text, or
outcome chart data. Never trust client-calculated scores for leaderboards.

## Definition of Done (development default)

Work is done only when:

1. All acceptance criteria in the handoff prompt pass.
2. The verification commands named in the handoff pass. By default this means
   `pnpm test` and `pnpm typecheck`; `pnpm dev` is required only when the handoff
   changes web runtime behavior or explicitly asks for a browser/dev-server check.
3. Existing and new tests pass, unless the handoff explicitly records an accepted
   prototype limitation.
4. `progress.md` is updated and a completion report is written (see below).

Production-readiness work uses a stricter definition of done: install/dev/test,
typecheck, manual QA where relevant, formal audit, and any content/security checks
required by the owning docs. Placeholder prototype scenario content does not need
full doc 09 Gate 1/Gate 2 polishing unless the handoff says it is production
content; it must still avoid literal `soul.md` leaks and keep D022 clue counts.

## Session End Protocol

At the end of every session:

1. Append a session log entry to `progress.md` using the template at the top of
   that file (what changed, how to run, test status, known issues, blocked
   questions, next recommended task) and update its "Current Status" section.
2. Write a concise completion report to `agents/reports/R###_H###.md` following
   `agents/reports/TEMPLATE.md` (next sequential R-number). The orchestrator
   reads this report to approve or reject your work. No report = no review =
   the work doesn't count. (Consultants and Auditors: your memo/audit file is
   your report.)

Never edit `soul.md`, `decisions.md`, or `roadmap.md` phase definitions — those
belong to the orchestrator.

## Git Rules (decision D012)

- **Role agents never run `git commit` or `git push`.** Leave all work
  uncommitted in the working tree — that diff, together with your completion
  report, is what the orchestrator reviews. Only the orchestrator commits, and
  only after approving the report.
- Never stage or write `.env`, secrets, or `node_modules`.
- Never discard or revert uncommitted changes you didn't make — they may be
  another agent's work awaiting review; escalate instead.
