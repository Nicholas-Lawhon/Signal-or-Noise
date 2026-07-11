# Phase 9A — Competitive Modes

**Status:** complete
**Risk:** high
**Owner:** Claude Fable, interactive Claude Code session
**Branch/worktree:** `codex/phase-9a-competitive-modes` / `C:\Repos\Signal_Or_Noise-p9a-fable`

## Outcome

Ship complete Portfolio Draft and synchronized one-on-one Friend Battle modes
under D052, with pure game logic, server-owned truth, durable persistence,
leakage-safe APIs, mobile-functional screens, and integration coverage.

## Starting Context

- `soul.md` (D052 is controlling), Phase 9 in `roadmap.md`, and `progress.md`.
- `packages/game-engine/src/`, `packages/database/prisma/schema.prisma`, and the
  existing run/daily services and API routes are the best implementation models.
- `apps/web/app/play/classic/run/page.tsx` shows the current gameplay contract.

Discover other implementation context on demand. Do not preload legacy history.

## Delegated Authority

- Choose reversible schema/service/API/component structure and polling strategy.
- Add one checked-in Prisma migration, pure engine modules, tests, feature-local
  routes/components, and typed client API additions needed for both modes.
- Use existing visual tokens for functional UI. Do not redesign the shared shell.
- Repair in-scope regressions until the full acceptance suite passes.

## Stop Conditions

- A required rule conflicts with `soul.md`, answer data would cross a pre-decision
  boundary, or a material product rule is unspecified.
- Shared Neon migration deployment, credentials, spend, push, or destructive git.
- Changes are required in 9B-reserved shared shell/style/navigation files.

## Exclusions

- Portfolio Draft leaderboard, private leagues, friend graph, chat, notifications,
  public matchmaking, email delivery, or more than two players.
- Analytics, global design-system polish, sound/motion, Rules/Settings/Disclaimer,
  or broad edits to `SiteHeader`, `layout`, `globals.css`, or `/play` mode select.

## Acceptance Criteria

1. Portfolio Draft presents six eligible Medium hidden cards from one compatible
   historical window, accepts exactly three, splits $10,000 equally, and computes
   selected/optimal results in pure server-used game logic with edge-case tests.
2. Draft pre-selection payloads contain no company, ticker, return, outcome chart,
   or reveal text; reveal returns all six outcomes only after immutable selection.
3. Guests can finish Draft; signed-in completions save. Summary shows final value,
   all selections/outcomes, optimal three, and gap from optimal. No leaderboard.
4. A signed-in user can create unlimited Friend Battles, choose Classic difficulty
   and timer (`off|30|60|120`, default 60), share an opaque invite, and exactly one
   other signed-in user can join once. Creator cannot join as opponent.
5. Each battle snapshots one identical ordered scenario set; Classic difficulty
   controls rounds and starting bankroll. One immutable attempt exists per player.
6. Both players ready before round 1 and after each reveal. Server timestamps own
   round deadlines; reconnect resumes them; a missing decision at expiry becomes
   a normal Pass. Neither player can advance or inspect the next round alone.
7. Opponent progress exposes only settled bankroll, Signal Score, and prior
   position/confidence plus optional company guess after both decisions settle.
   No current-round decision or answer leaks through API, cache, or rendered data.
8. Final bankroll wins, equal bankroll uses Signal Score, equality on both draws,
   single bankruptcy immediately awards the other player, simultaneous bankruptcy
   applies the same tiebreak, and unfinished battles expire after 24 hours.
9. Creation, join, ready, decision, timeout, reconnect, expiry, authorization,
   concurrency, replay/duplicate submission, and leakage paths have unit and
   database integration coverage. Shared Neon is not migrated by the owner.
10. Feature-local mobile flows cover loading, waiting, timer, reveal, disconnect,
    error, expiry, bankruptcy, win/loss/draw, and summary states; existing Classic,
    Daily, leaderboard, auth, content, and database suites remain green.

## Final Verification

```powershell
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/database test
```

Also run targeted browser QA for both modes at approximately 375px and desktop,
including two separate authenticated sessions for a complete timed battle.

## Closeout

When all criteria pass, update `progress.md` track state and write
`agents/phase-closeouts/P09A_competitive_modes.md` in 500 words or fewer. Do not
create internal handoffs or reports and do not commit, merge, or push.
