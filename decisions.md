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

## D013 — Return-mix guideline; placeholder data rebalanced

**Date:** 2026-07-03 · **Status:** User approved

Playtest found every prototype round felt like a lottery because all 6 placeholder
scenarios had extreme returns. The engine math is correct (stake × real historical
return IS the game); the deck was skewed. Fix: rebalance samples to 2 dramatic /
4 modest, and lock a content guideline for Phase 3+: **~70% of scenario cards have
modest returns (±10–60%), ~30% dramatic (>±80%)**, mixed windows. Content Curator
enforces this per daily pool and pack.

## D014 — Wrong All-In = instant bust

**Date:** 2026-07-03 · **Status:** User approved (user's call over orchestrator's
proportional-loss recommendation)

An incorrect All-In call loses the entire stake: bankroll → $0, run ends,
regardless of return magnitude. Correct All-In still earns the full historical
return on the stake. Rationale: All-In should feel like total risk; under
proportional losses bankruptcy was nearly impossible and All-In read as "95%".
`soul.md` amended.

## D015 — "Call the Company" bonus guess

**Date:** 2026-07-03 · **Status:** User approved

Optional company guess before Lock In: correct +2 Signal Score, wrong −1, blank 0.
Allowed with any action including Pass. Never affects bankroll. The wrong-guess
penalty exists so guessing is a real declaration, not free spam. Matching is
normalized (lowercase, alphanumerics only) against a per-scenario accepted-names
list. This folds "what the player knew" into Signal Score's identity as the
decision-quality stat.

## D016 — Bankruptcy floor at $1

**Date:** 2026-07-03 · **Status:** Orchestrator decision (complements D014)

A run ends in bankruptcy when bankroll drops below $1, not only at exactly $0 —
prevents unplayable "zombie runs" at $3 after repeated High-confidence losses.

## D017 — Payout model re-confirmed: proportional to real historical return

**Date:** 2026-07-03 · **Status:** User approved (explicitly re-confirmed after
playtest question)

`pnl = stake × actualReturnPercent` stands, exactly as specified in docs 02/06/10
and soul.md. Alternatives considered and rejected: even-money 1:1 (magnitude of
the historical move would carry no gameplay weight; reads as betting) and capped
proportional (gains capped at +100% of stake). The size of the real market move
IS the payoff — a $1,250 low-confidence stake on Netflix 2012–2017 (+1,135.6%)
correctly pays ≈$14,200. Swing management is handled by deck composition (D013),
not by changing the math.

## D018 — Placeholder content is still bound by soul.md content integrity

**Date:** 2026-07-03 · **Status:** Orchestrator decision

Audit A001 found the Amazon placeholder card leaked identity (famous book-title
reference, founder reference, Amazon's literal mission statement); the orchestrator
also found a Microsoft card naming the product "Windows" and a near-unmistakable
BlackBerry title. Prototype/placeholder data (D006) does NOT get a pass on the
`soul.md` content-integrity rules — no company name, ticker, founder/CEO reference,
or unmistakable product name/slogan in hidden-card content, ever, even before the
Phase 3 curated replacement. Fixed in H005. The Content Curator role file already
encodes this for Phase 3+; D018 makes it retroactive to placeholder data.

## D019 — Content-leakage is a standing audit check + Phase 3 automated validator

**Date:** 2026-07-03 · **Status:** User-requested

Two-layer defense against identifying information in hidden-card content:
1. **Now:** every Auditor pass that touches scenario content runs a content-leakage
   scan (company name / ticker / founder / product-name-or-slogan) — added to
   `agents/roles/auditor.md`. A001 already caught the Amazon leak this way.
2. **Phase 3:** the content pipeline (`packages/content`) ships an automated
   leakage/difficulty validator (Zod schema + a rules check) so cards fail
   validation before a human ever reviews them. Logged in `roadmap.md` Phase 3.

## D020 — Prototype needs more placeholder scenarios to reduce repetition

**Date:** 2026-07-03 · **Status:** User-reported, orchestrator decision

Playtest: a 20-round run only showed ~4–5 distinct companies because the pool has
6 cards and `buildRunScenarioList` cycles them. Fix (H006): expand placeholder pool
to 12 orchestrator-authored cards and make `buildRunScenarioList` exhaust the pool
before repeating (no card twice until all shown; no back-to-back repeat at lap
boundaries). Still placeholder-grade (D006); Phase 3 replaces all of it with 100
curated cards, so this is a demo-quality stopgap, not final content.

## Open Design Question — composite Final Score / Information Tiers (NOT a decision)

**Date:** 2026-07-03 · **Status:** Exploration pending

User is considering restructuring scoring around three axes: Bankroll (outcome),
Signal Score (decision quality), Information Tier (what the player knew), possibly
with a composite final score — potentially demoting or removing bankroll.
Orchestrator position: bankroll is the core product fantasy per soul.md and all
docs; do not remove it casually. Agreed path: a design memo with 2–3 concrete
scoring models after audit A001, then a deliberate decision. Until then, bankroll
remains the primary score.
