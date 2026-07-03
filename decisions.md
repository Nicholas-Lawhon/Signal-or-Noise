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

## D009 — Starting bankrolls: locked values win over design pack

**Date:** 2026-07-03 · **Status:** User approved

The `docs/design/` pack shipped with Easy $15,000 / Hard $5,000. The locked values
stand: **Easy $12,500 / Medium $10,000 / Hard $7,500**. Design files (02, 04, 05)
corrected to match `soul.md`.

## D010 — Signal Score impact is a hidden formula; two-line confidence buttons

**Date:** 2026-07-03 · **Status:** User approved

Confidence buttons display exactly two lines: `Label (40%)` then the dollar amount
(dollar amount visually dominant). The ±Signal Score impact is NEVER shown on the
buttons — players see Signal Score changes only in results/reveal contexts.
Design docs (DESIGN.md, 02, 03, 05) updated. Supersedes the design pack's
four-line button spec.

## D011 — docs/design/ pack adopted as canonical UI/UX source

**Date:** 2026-07-03 · **Status:** User approved

`docs/design/` (especially `04_design_tokens.json`) is the canonical visual source:
deep-navy palette (#08111F bg), confidence color ramp (cyan/green/amber/violet),
typography and motion tokens. Tailwind theme derives from the tokens file. Also
adopted: difficulty-selector explainer copy and the brief "decision locked"
suspense state before reveal. Applied to the built prototype via handoff H002.
H001's zinc/teal palette direction is superseded (H001 is not edited — it was
already executed; fix-ups get new handoffs).

## D012 — Report-approval workflow: role agents never commit

**Date:** 2026-07-03 · **Status:** User approved

Every executing agent ends its handoff by writing a completion report to
`agents/reports/R###_H###.md` (template in that folder) and leaves ALL work
uncommitted. The orchestrator reviews the report + diff, approves or rejects, and
only the orchestrator commits to git. Consultant memos and Auditor audit files
serve as those roles' reports. H001 was executed before this rule existed and has
no R-report; its review happens via orchestrator review + audit A001.
