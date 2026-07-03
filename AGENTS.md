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
settled decisions — never re-litigate or contradict them.

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

## Definition of Done (every handoff)

Work is done only when:

1. All acceptance criteria in the handoff prompt pass.
2. `pnpm install`, `pnpm dev`, and `pnpm test` work from the repo root.
3. All tests pass (existing and new).
4. No TypeScript errors (`pnpm typecheck` if configured, else `tsc --noEmit`).
5. `progress.md` is updated (see below).

## Session End Protocol

At the end of every session, append a session log entry to `progress.md` using the
template at the top of that file. Include: what changed, how to run it, test status,
known issues, blocked questions, and the next recommended task. Update the
"Current Status" section. Never edit `soul.md`, `decisions.md`, or `roadmap.md`
phase definitions — those belong to the orchestrator.

## Commit Rules

- Commit at logical checkpoints with clear messages: `phase1: add scenario card screen`.
- Never commit `.env`, secrets, or `node_modules`.
- Do not push unless the handoff explicitly says to.
