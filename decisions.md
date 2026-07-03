# decisions.md — Decision Log

Settled decisions. Implementing agents never re-litigate these; if new information
contradicts one, escalate to the orchestrator instead of deviating. Only the
orchestrator writes here, and user-approval status is recorded for each entry.

Format: `D### — Title` / Date / Status / Decision / Rationale.

---

## D001 — Role structure: 5 roles

**Date:** 2026-07-03 · **Status:** User approved

Dev roles: **Consultant**, **Implementor**, **Auditor**. Business role: **Growth**
(marketing + social media + sales combined). Content role: **Content Curator**.

**Rationale:** Marketing/social/sales for a pre-revenue game share one brand voice
and are low-volume until the prototype exists — one role, split later if
monetization diverges. Scenario-card creation (100 cards) is the largest non-code
MVP workload and needs a research/writing skillset distinct from coding, so it gets
its own role. Fewer, fuller roles beat many idle ones.

## D002 — Git from day one, remote on GitHub

**Date:** 2026-07-03 · **Status:** User approved

Repo initialized with remote `origin` → https://github.com/Nicholas-Lawhon/Signal-or-Noise.
Auditor reviews rely on git diffs; agents commit at logical checkpoints but do not
push unless a handoff says to.

## D003 — Tech stack locked for MVP

**Date:** 2026-07-03 · **Status:** Follows docs (07/10); orchestrator confirmed

pnpm monorepo · Next.js App Router · TypeScript strict · Tailwind CSS · Vitest ·
Zod · Prisma + PostgreSQL (Phase 4+). Auth provider and DB host are **deliberately
undecided** — Consultant memos before Phases 4 and 5 will recommend; user approves.

## D004 — Vertical-slice implementation order

**Date:** 2026-07-03 · **Status:** Follows docs (10)

Prove the local gameplay loop first. No database, auth, or full UI system before
the Classic Run loop is playable and fun. Phases 0+1 ship together as H001.

## D005 — Game engine lives in packages/game-engine from day one

**Date:** 2026-07-03 · **Status:** Orchestrator decision

Doc 10 sequences "build in app, move to package in Phase 2", but its First Agent
Task already asks for the shared scoring package with tests. H001 builds all scoring
logic directly in `packages/game-engine`; Phase 2 becomes a hardening pass (complete
the run-state API + full test matrix) instead of a migration. Avoids churn and
guarantees the web app never grows its own scoring math.

## D006 — Prototype scenario data is placeholder-grade

**Date:** 2026-07-03 · **Status:** Orchestrator decision

H001's 6 hardcoded scenarios use approximate historical returns and may reuse the
same hidden-card text across all three difficulty variants. They are labeled
prototype-only and are fully replaced by Content Curator-produced, source-verified
cards in Phase 3+. Reason: card authorship is the Curator's job; blocking the
prototype on verified data buys nothing.

## D007 — Zero return counts as an incorrect call

**Date:** 2026-07-03 · **Status:** Orchestrator decision (flag for playtest review)

`wasCorrect = rawReturn > 0`. A scenario with exactly 0% return scores as wrong for
both long and short. Matches the scoring sketch in `docs/06_data_model.md`. In
practice curated scenarios should avoid ~0% outcomes; revisit if playtesting surfaces
confusion.

## D008 — Windows is the primary dev environment

**Date:** 2026-07-03 · **Status:** Fact of environment

All package.json scripts and tooling must be cross-platform (no bash-only commands).
Agents verify commands run under PowerShell.
