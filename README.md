# Signal or Noise?

**Can you find the signal through the noise?**

Signal or Noise? is a mobile-first web game where players read disguised historical stock-market scenarios and decide whether to go Long, Short, or Pass. Players stake a fictional bankroll based on their confidence, then see the company revealed and how much they would have made or lost.

## Quickstart

```bash
pnpm install
pnpm dev
pnpm test
```

## Monorepo Layout

```text
apps/web/            Next.js web app (routes, screens, components)
packages/game-engine/ Pure TypeScript game logic + tests
packages/content/    Scenario JSON seeds, schemas, validation scripts (Phase 3+)
packages/database/   Prisma schema, migrations, import scripts (Phase 4+)
packages/shared-types/ Shared interfaces (when needed)
docs/                Product documentation
agents/              Phase charters, roles, closeouts, archived workflow history
```

## Documentation

See `docs/` for product overview, game design, technical architecture, and more.
Agent conventions are in `AGENTS.md`.

## Disclaimer

Signal or Noise? is a game using historical market scenarios for entertainment
and trivia. It does not provide financial advice, investment recommendations,
or real-money trading.
