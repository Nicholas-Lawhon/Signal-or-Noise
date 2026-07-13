# @signal-or-noise/shared-types

Platform-neutral API contracts shared by the web app, the database services,
and the future Expo/React Native app.

This package is part of the **mobile shared surface**: it must stay importable
without Node builtins, Prisma, Next.js, `react-dom`, DOM globals, or any other
platform-specific dependency. Its only runtime dependency is `zod`. The
constraint check and Metro bundle smoke test in `tools/mobile-smoke` enforce
this.

- `src/contracts.ts` — request schemas and response payload types for every
  gameplay endpoint (runs, Daily, Draft, Friend Battle, Draft Battle, identity).
- `src/leaderboard.ts` — leaderboard query schemas and page payload types.

Server-only trust rules do not change: these are wire shapes, not scoring
logic. Scoring stays in `@signal-or-noise/game-engine` and server-side
services.
