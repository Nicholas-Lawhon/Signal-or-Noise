# roadmap.md — Signal or Noise?

> **Current phase: Phase 9A/9B - Competitive Modes and MVP Polish.**
> Phases 0 + 1 COMPLETE and audited (A002 PASS). Phase 2 COMPLETE under D024.
> Phase 3 COMPLETE and audited (A005 PASS WITH FINDINGS). Phase order
> renumbered by D027 (Content Expansion moved up from Phase 8). Only the
> orchestrator updates this file.

Phase contents follow `docs/10_agentic_coding_handoff.md`; phase ORDER here
supersedes docs/10 after the D027 renumbering. Under D043, each active phase uses
one charter in `agents/phases/`, one autonomous owner, and one phase-boundary
review. Historical H### entries below record the legacy workflow. A phase closes
when its acceptance criteria pass and the user/orchestrator accepts the final
review; high-risk phases receive independent cross-model depth.

## Phase 0 — Project Setup ✅

Monorepo scaffold: pnpm workspace, Next.js app in `apps/web`, `packages/game-engine`,
`packages/content`, `.env.example`, README, lint/format basics, Vitest wiring.

**Accept:** app runs locally; game-engine builds; tests run; docs + agent files present.
**Handoffs:** H001. **Done:** delivered in H001, audited A002 PASS.

## Phase 1 — Static Classic Run Prototype ✅

Playable 20-round Classic Run with hardcoded scenario data. Landing → mode select →
classic setup → scenario card (lookback chart placeholder) → Long/Short/Pass +
confidence → reveal → next round → end summary. Bankruptcy handling. No auth, no DB.

**Accept:** full run completable; bankroll and Signal Score math correct; Pass = −0.25;
All-In can bankrupt; outcome hidden before decision; engine unit tests pass.
**Handoffs:** H001 → H002 (design) → H003 (gameplay fixes) → H005 (A001 fixups) →
H006 (variety + reveal banner). **Audits:** A001 (FAIL) → fixed → A002 (PASS).
**Done 2026-07-03.** 12 placeholder cards, 24 engine tests. Adds beyond original
scope: Call the Company (D015), wrong-All-In bust (D014), win/loss banner.

## Phase 2 — Game Engine Hardening ✅

Pure logic complete in `packages/game-engine`: `calculateStake`, `scoreRound`,
`applyRoundResult`, `createRunState`, `advanceRun`, `isBankrupt`, `summarizeRun`,
`calculateLeaderboardTiebreakers`. Full required test matrix (10 cases, see doc 10).

Note: H001 already builds the engine inside `packages/game-engine` (decision D005),
so Phase 2 is a hardening/completion pass, not a migration.

**Handoff:** H012. **Done 2026-07-09.** 37 game-engine tests. Adds
`advanceRun`, streak tracking, leaderboard tiebreakers, and guard tests.

## Phase 3 — Scenario Schema & Content Pipeline ✅

Zod scenario validator, seed folder structure (`draft/reviewed/active`), type defs,
validation script, 5–10 valid sample scenario JSONs. Web app loads scenarios from JSON.
The validator must include an **automated content-leakage/difficulty check** (D019):
reject any card whose hidden-card fields contain the company name, ticker,
founder/CEO reference, or an unmistakable product name/slogan, or that lacks the correct amount of hints.

**Accept:** invalid cards fail validation; valid cards pass; leakage check rejects a
card that names its company; app loads JSON scenarios.
**Content Curator role activates here.**
**Handoffs:** H015 → H016 (build fix). **Audit:** H017/A005 PASS WITH FINDINGS.
**Done 2026-07-09.** Zod schema + validation API/CLI, 10 content tests, 6 active
JSON seeds, JSON-backed Classic Run. A005 MAJOR fix-ups ride post-close handoff
H018; A005 MINORs are Phase 4 Part A work.

## Phase 4 — Content Foundation & Expansion ⬜ (was Phase 8; moved up by D027)

The cards ARE the game: retire content-quality risk before building more
systems. Two parts, gated in order.

**Part A — Content rules & validator hardening: ✅ CLOSED (D035, 2026-07-09)**
- Close A005 MINORs: calendar-date validity, price/return internal-consistency
  checks, likely-guess quality floor on reviewed/active content.
- Automated Gate 2 guessability check in the validation pipeline (pinned model,
  temperature 0) per D019/D022 — the last unautomated D019 layer.
- Review doc 09 rulebook + generation prompt template for AI-assisted
  generation readiness (fact-bank workflow, Hard-first ordering, red-team
  likely-guess lists).
- Re-review the 6 active seeds against the hardened gates; fix or replace.

**Accept (Part A):** MET — each new invalid class fails validation
(H018/H020); the guessability check runs automatically with pinned judge and
D031 thresholds (H021/H022); every active card was re-reviewed and rewritten
against the hardened gates (H025–H032; Netflix blind rejudge waived per D035);
user signed off that the guards are trusted (D035).

**Part B — Content generation at scale (the original Phase 8 scope): CLOSED (D045, 2026-07-09)**
40 scenario cards (D034; was 100), 10 daily challenge pools, 10 famous market
eras. AI-assisted generation → validate → human review → mark active. JSON
seeds until the database lands in Phase 5. (Content Curator + Auditor heavy.)

**Accept (Part B):** MET - 40 active, human-reviewed cards pass validation and
Gate 2; pools and eras are defined. Classic Run loads the production set; the
six prototype seeds are archived outside gameplay.

**Closeout:** `agents/phase-closeouts/P04B_content_expansion.md`. The legacy
H034-H037 batch chain is archived provenance only; it received no separate review.

## Phase 5 — Database ✅ (was Phase 4)

Prisma schema (see `docs/06_data_model.md`), Postgres connection, scenario import,
Run/RoundDecision persistence, user/profile tables, DailyChallenge model, leaderboard
storage. Server-side score calculation — never trust the client.

**Consultant memo required before this phase** (DB provider, guest strategy).

## Phase 6 — Auth & Guest Play ✅ (was Phase 5)

Optional login for Classic Run. Guests play Classic unofficially; login gates
saved stats, leaderboard eligibility, and all Daily Challenge play.

**Consultant memo required before this phase** (auth provider selection).

## Phase 7 — Leaderboards ✅ (was Phase 6)

Daily Challenge Bankroll, Best Classic Run Bankroll, All-Time Signal Score.
Tiebreakers per doc 10: bankroll → Signal Score → correct calls → fewer passes →
completion time.

**Accepted 2026-07-10 under D050.** Public Daily, difficulty-separated Classic,
and cumulative Signal leaderboards derive from official immutable runs; public
identity uses stable generated aliases or an explicitly chosen unique name.

## Phase 8 — Daily Challenge ✅ (was Phase 7)

10 rounds, same curated pool for everyone, login required, unlimited attempts,
best completed score per user/day on the daily leaderboard, mixed difficulty.

**Accepted 2026-07-10.** Deterministic UTC scheduling, immutable daily snapshots,
authenticated resume/replay, server-owned scoring/reveal privacy, and best-attempt
Daily leaderboard integration ship end to end.

## Phase 9 — Competitive Expansion and MVP Polish ✅

D051 authorizes two parallel, independently owned tracks because the user is
running the high-risk competitive work in a separate Claude harness/worktree.

### Phase 9A — Competitive Modes

Portfolio Draft plus synchronized one-on-one Friend Battles. Draft is a six-card,
choose-three equal-weight historical winner-picking mode with no MVP leaderboard.
Friend Battles use Classic difficulty lengths and scoring over one immutable
scenario snapshot, synchronized server-timed rounds, safe opponent progress, and
a 24-hour expiry. Full rules are locked by D052 in `soul.md`.

### Phase 9B — Polish and Analytics

Mobile/desktop UI polish, app shell and navigation, reveal animation, bankroll
count-up, win/loss sound, improved charts and supporting states, rules/settings/
disclaimer pages, accessibility, performance, PostHog analytics under D053, and
the MVP QA checklist.

**Phase boundary:** both track suites pass, 9A receives independent high-risk
review, both branches integrate cleanly, the new modes receive the shared visual
system, and the integrated acceptance suite passes before Phase 9 is accepted.

**Accepted 2026-07-10.** Both tracks and the focused integration repair passed
independent review. Shared Neon is migrated; the final merged suite reports 61
engine, 77 content, 42 database, and 26 web tests with zero skips, plus 20/20
browser checks across Chromium and mobile WebKit.

## Phase 11 — Strategic Pass and Portfolio Draft Expansion ✅

Add curator-reviewed Smart Pass scoring to every Classic-style decision loop.
Expand Portfolio Draft with Classic, Quick, and Era formats, constrained variable
weighting, separate all-time solo leaderboards, and synchronized two-player Draft
Battles. Server-owned scoring, pre-decision privacy, and mobile-first play remain
controlling requirements under D055.

**Accept:** Smart Pass metadata and scoring are validated and leakage-safe across
Classic, Daily, and Friend Battle; all three weighted Draft formats, official
format-separated leaderboards, and invite-based Draft Battles work end to end;
the full acceptance suite and independent high-risk review pass.

**Accepted 2026-07-13.** Merged to `main` at `1c99037` with follow-up playtest
fix `ad4612b`. Closeout: `agents/phase-closeouts/P11_strategic_pass_draft_expansion.md`.

## Phase 12 — Shared Package Cleanup for Expo Readiness ✅

Post-MVP queue item 2. Make `packages/game-engine`, `packages/content` (its
consumable surface), and the shared type/contract surface provably consumable by
a future Expo/React Native app: extract shared types and API contracts to a
platform-neutral home, remove web/Node-only coupling from what mobile will
import, and add enforceable import/dependency constraints plus a Metro/React
Native bundling smoke test. Zero behavior change to the web app; no Expo app
shell yet (that is queue item 3).

**Accept:** the shared surface mobile needs bundles under Metro/React Native and
is guarded by automated constraint checks; web behavior is unchanged and the full
acceptance suite passes.

**Accepted 2026-07-13.** Merged to `main` at `15d5506`. Closeout:
`agents/phase-closeouts/P12_expo_readiness.md`.

## Phase 13 — Expo Mobile App ⬜

Post-MVP queue item 3. Build the native iOS/Android app with Expo in
`apps/mobile`, consuming the Phase 12 mobile shared surface
(`@signal-or-noise/shared-types`, `@signal-or-noise/game-engine`, the neutral
content subpaths) and the same server APIs and server-owned scoring as web —
no duplicated scoring logic and no scenario catalog or reveal data in the
client bundle. Includes the mobile API client (the native equivalent of
`apps/web/lib/api.ts`) and native auth/session handling.

**Gate:** does not start until Nicholas's final MVP pass confirms auth and
session behavior are stable, since the mobile client's auth layer designs
against them. Phase opens with a consultant-style decision memo (Expo
SDK/router choice, native auth strategy, dev-vs-deployed API targeting)
before the charter.

**Accept:** to be locked in the Phase 13 charter after the decision memo.

## Business Track (parallel, milestone-gated)

Growth role activates per gate — see `agents/roles/growth.md` and
`business/growth-roadmap.md`.

- **Gate A — Foundation (complete 2026-07-10):** positioning, audience,
  name/domain/handle checks, tester recruitment, channel hypotheses, and
  measurement requirements. Closeout: `agents/phase-closeouts/G01_growth_foundation.md`.
- **Gate B — Product readiness and beta (next):** resolve public-name clearance
  first, then coordinate Phase 9 and Expo readiness;
  prepare the integrated website, store assets, private testing, launch plan,
  share copy, social calendar, and creator/community outreach.
- **Gate C — Coordinated launch:** release web, iOS, and Android with a useful
  free experience and one-time Premium Unlock, plus approved organic and capped
  paid acquisition campaigns.
- **Gate D — Retention and revenue expansion:** optimize the funnel and add paid
  scenario packs first; consider other monetization only when retention and unit
  economics support it.

## Post-MVP Queue (do not build during MVP)

1. Expanded Friend Battle settings and private leagues
2. Shared package cleanup for Expo readiness
3. Expo mobile app
4. Expanded/paid content packs, cosmetics, advanced stats
