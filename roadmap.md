# roadmap.md — Signal or Noise?

> **Current phase: Phase 0 (not started).** Groundwork/agent-workflow setup is complete.
> Only the orchestrator updates this file.

Phases follow `docs/10_agentic_coding_handoff.md`. Each phase ships as one or more
numbered handoff prompts (`agents/handoffs/H###_*.md`). A phase is complete only when
its acceptance criteria pass and an audit (`agents/audits/`) signs off.

## Phase 0 — Project Setup ⬜

Monorepo scaffold: pnpm workspace, Next.js app in `apps/web`, `packages/game-engine`,
`packages/content`, `.env.example`, README, lint/format basics, Vitest wiring.

**Accept:** app runs locally; game-engine builds; tests run; docs + agent files present.
**Handoff:** H001 (combined with Phase 1).

## Phase 1 — Static Classic Run Prototype ⬜

Playable 20-round Classic Run with hardcoded scenario data. Landing → mode select →
classic setup → scenario card (lookback chart placeholder) → Long/Short/Pass +
confidence → reveal → next round → end summary. Bankruptcy handling. No auth, no DB.

**Accept:** full run completable; bankroll and Signal Score math correct; Pass = −0.25;
All-In can bankrupt; outcome hidden before decision; engine unit tests pass.
**Handoff:** H001.

## Phase 2 — Game Engine Hardening ⬜

Pure logic complete in `packages/game-engine`: `calculateStake`, `scoreRound`,
`applyRoundResult`, `createRunState`, `advanceRun`, `isBankrupt`, `summarizeRun`,
`calculateLeaderboardTiebreakers`. Full required test matrix (10 cases, see doc 10).

Note: H001 already builds the engine inside `packages/game-engine` (decision D005),
so Phase 2 is a hardening/completion pass, not a migration.

## Phase 3 — Scenario Schema & Content Pipeline ⬜

Zod scenario validator, seed folder structure (`draft/reviewed/active`), type defs,
validation script, 5–10 valid sample scenario JSONs. Web app loads scenarios from JSON.

**Accept:** invalid cards fail validation; valid cards pass; app loads JSON scenarios.
**Content Curator role activates here.**

## Phase 4 — Database ⬜

Prisma schema (see `docs/06_data_model.md`), Postgres connection, scenario import,
Run/RoundDecision persistence, user/profile tables, DailyChallenge model, leaderboard
storage. Server-side score calculation — never trust the client.

**Consultant memo required before this phase** (DB provider, guest strategy).

## Phase 5 — Auth & Guest Play ⬜

Optional login. Guests play everything unofficially; login gates leaderboard
submission and saved stats.

**Consultant memo required before this phase** (auth provider selection).

## Phase 6 — Leaderboards ⬜

Daily Challenge Bankroll, Best Classic Run Bankroll, All-Time Signal Score.
Tiebreakers per doc 10: bankroll → Signal Score → correct calls → fewer passes →
completion time.

## Phase 7 — Daily Challenge ⬜

10 rounds, same pool for everyone, one official attempt per logged-in user per day,
guest unofficial play, daily leaderboard, mixed difficulty.

## Phase 8 — Content Expansion ⬜

100 scenario cards, 10 daily challenge pools, 10 famous market eras. AI-assisted
generation → validate → human review → mark active → import. (Content Curator +
Auditor heavy phase.)

## Phase 9 — MVP Polish ⬜

Mobile UI polish, reveal animation, bankroll count-up, rules + disclaimer pages,
accessibility, performance, QA checklist.

## Business Track (parallel, milestone-gated)

Growth role activates per gate — see `agents/roles/growth.md`.

- **Gate A (Phase 1 done):** positioning one-pager, name/handle availability check,
  private-tester recruitment plan.
- **Gate B (Phase 7 done):** launch plan, share-card copy, social content calendar,
  creator/community outreach list.
- **Gate C (post-MVP retention proven):** monetization experiments per
  `docs/03_business_plan.md` (content packs first).

## Post-MVP Queue (do not build during MVP)

1. Smart pass scoring
2. Portfolio Draft mode
3. Shared package cleanup for Expo readiness
4. Expo mobile app
5. Friend challenges & private leagues
6. Expanded/paid content packs, cosmetics, advanced stats
