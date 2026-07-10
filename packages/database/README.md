# @signal-or-noise/database

Prisma/PostgreSQL persistence for Signal or Noise?. JSON under
`packages/content` remains the reviewable content source of truth; this package
validates it and synchronizes it into PostgreSQL.

## Environment

Copy the repository-root `.env.example` to `.env` and set both variables:

- `DATABASE_URL`: Neon pooled runtime connection string.
- `DIRECT_URL`: Neon direct connection string used by Prisma migrations.

Never expose either variable to browser code and never commit `.env`.

## Commands

Run these from the repository root:

```powershell
pnpm --filter @signal-or-noise/database db:generate
pnpm --filter @signal-or-noise/database db:migrate
pnpm --filter @signal-or-noise/database db:status
pnpm --filter @signal-or-noise/database import:scenarios
pnpm --filter @signal-or-noise/database test
```

Use `db:migrate:dev -- --name <migration_name>` only when authoring a new local
migration. Deploy checked-in migrations with `db:migrate`; do not run destructive
resets against shared Neon databases.

## Server boundary

`RunService` owns run creation, current-round reads, submissions, terminal run
state, and leaderboard-entry foundations. Submission contracts accept the call,
confidence, optional company guess, and expected round index only. Bankroll,
return, scoring, company-guess correctness, and terminal status are resolved on
the server from persisted data through `@signal-or-noise/game-engine`.

Pre-decision payloads contain only the selected hidden-card variant and lookback
chart. Reveal-only fields and outcome chart data are returned only from the
transaction that first persists the round decision.
