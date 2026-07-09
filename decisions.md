# decisions.md â€” Decision Log

Settled decisions. Implementing agents never re-litigate these; if new information
contradicts one, escalate to the orchestrator instead of deviating. Only the
orchestrator writes here, and user-approval status is recorded for each entry.

Format: `D### â€” Title` / Date / Status / Decision / Rationale.

---

## Decision Index

Read this index first. Open the full decision text below only when a handoff names
the D-number or the current task directly touches that area.

| ID | Short title | Active relevance |
|---|---|---|
| D001 | Role structure: 5 roles | Agent workflow |
| D002 | Git from day one, remote on GitHub | Historical setup |
| D003 | Tech stack locked for MVP | Architecture guardrail |
| D004 | Vertical-slice implementation order | Historical setup |
| D005 | Game engine package from day one | Architecture guardrail |
| D006 | Prototype scenario data is placeholder-grade | Historical/content context |
| D007 | Zero return counts incorrect | Scoring rule |
| D008 | Windows primary dev environment | Tooling/scripts |
| D009 | Starting bankroll locked values | Scoring/setup rule |
| D010 | Signal Score impact hidden on confidence buttons | UI/gameplay rule |
| D011 | `docs/design/` canonical UI/UX source | UI work |
| D012 | Role agents never commit | Agent workflow |
| D013 | Return-mix guideline | Content curation |
| D014 | Wrong All-In = instant bust | Scoring rule |
| D015 | Call the Company bonus guess | Gameplay/scoring rule |
| D016 | Bankruptcy floor at $1 | Scoring/run rule |
| D017 | Proportional payout model | Scoring rule |
| D018 | Placeholder content bound by integrity rules | Content guardrail |
| D019 | Content-leakage audit + validator | Content pipeline |
| D020 | More placeholder scenarios to reduce repetition | Historical prototype |
| D021 | Model routing & risk-tiered execution | Superseded in part by D023/D029 |
| D022 | Difficulty-scaled clues + rulebook | Content rulebook |
| D023 | Model lineup v2 + direct CLI dispatch | Superseded in part by D028/D029 |
| D024 | Development-speed review policy | Agent workflow |
| D025 | Classic Run length scales by difficulty | Gameplay/run rule |
| D026 | Balanced Tension scenario cards | Content/schema/UI rule |
| D027 | Content Expansion moved to Phase 4 | Roadmap/phase order |
| D028 | Manual handoff default | Agent workflow |
| D029 | Token-efficient context routing | Agent workflow |
| D030 | State compaction policy | Agent workflow |
| D031 | Gate 2 judge uses Grok 4.5 | Content pipeline |
| D032 | Gate 2 runs through agent workflow, not API tokens | Content pipeline |
| D033 | GPT 5.6 Terra joins roster; all roles model-agnostic | Agent workflow |

---


## D001 â€” Role structure: 5 roles

**Date:** 2026-07-03 Â· **Status:** User approved

Dev roles: **Consultant**, **Implementor**, **Auditor**. Business role: **Growth**
(marketing + social media + sales combined). Content role: **Content Curator**.

**Rationale:** Marketing/social/sales for a pre-revenue game share one brand voice
and are low-volume until the prototype exists â€” one role, split later if
monetization diverges. Scenario-card creation (100 cards) is the largest non-code
MVP workload and needs a research/writing skillset distinct from coding, so it gets
its own role. Fewer, fuller roles beat many idle ones.

## D002 â€” Git from day one, remote on GitHub

**Date:** 2026-07-03 Â· **Status:** User approved

Repo initialized with remote `origin` â†’ https://github.com/Nicholas-Lawhon/Signal-or-Noise.
Auditor reviews rely on git diffs; agents commit at logical checkpoints but do not
push unless a handoff says to.

## D003 â€” Tech stack locked for MVP

**Date:** 2026-07-03 Â· **Status:** Follows docs (07/10); orchestrator confirmed

pnpm monorepo Â· Next.js App Router Â· TypeScript strict Â· Tailwind CSS Â· Vitest Â·
Zod Â· Prisma + PostgreSQL (Phase 4+). Auth provider and DB host are **deliberately
undecided** â€” Consultant memos before Phases 4 and 5 will recommend; user approves.

## D004 â€” Vertical-slice implementation order

**Date:** 2026-07-03 Â· **Status:** Follows docs (10)

Prove the local gameplay loop first. No database, auth, or full UI system before
the Classic Run loop is playable and fun. Phases 0+1 ship together as H001.

## D005 â€” Game engine lives in packages/game-engine from day one

**Date:** 2026-07-03 Â· **Status:** Orchestrator decision

Doc 10 sequences "build in app, move to package in Phase 2", but its First Agent
Task already asks for the shared scoring package with tests. H001 builds all scoring
logic directly in `packages/game-engine`; Phase 2 becomes a hardening pass (complete
the run-state API + full test matrix) instead of a migration. Avoids churn and
guarantees the web app never grows its own scoring math.

## D006 â€” Prototype scenario data is placeholder-grade

**Date:** 2026-07-03 Â· **Status:** Orchestrator decision

H001's 6 hardcoded scenarios use approximate historical returns and may reuse the
same hidden-card text across all three difficulty variants. They are labeled
prototype-only and are fully replaced by Content Curator-produced, source-verified
cards in Phase 3+. Reason: card authorship is the Curator's job; blocking the
prototype on verified data buys nothing.

## D007 â€” Zero return counts as an incorrect call

**Date:** 2026-07-03 Â· **Status:** Orchestrator decision (flag for playtest review)

`wasCorrect = rawReturn > 0`. A scenario with exactly 0% return scores as wrong for
both long and short. Matches the scoring sketch in `docs/06_data_model.md`. In
practice curated scenarios should avoid ~0% outcomes; revisit if playtesting surfaces
confusion.

## D008 â€” Windows is the primary dev environment

**Date:** 2026-07-03 Â· **Status:** Fact of environment

All package.json scripts and tooling must be cross-platform (no bash-only commands).
Agents verify commands run under PowerShell.

## D009 â€” Starting bankrolls: locked values win over design pack

**Date:** 2026-07-03 Â· **Status:** User approved

The `docs/design/` pack shipped with Easy $15,000 / Hard $5,000. The locked values
stand: **Easy $12,500 / Medium $10,000 / Hard $7,500**. Design files (02, 04, 05)
corrected to match `soul.md`.

## D010 â€” Signal Score impact is a hidden formula; two-line confidence buttons

**Date:** 2026-07-03 Â· **Status:** User approved

Confidence buttons display exactly two lines: `Label (40%)` then the dollar amount
(dollar amount visually dominant). The Â±Signal Score impact is NEVER shown on the
buttons â€” players see Signal Score changes only in results/reveal contexts.
Design docs (DESIGN.md, 02, 03, 05) updated. Supersedes the design pack's
four-line button spec.

## D011 â€” docs/design/ pack adopted as canonical UI/UX source

**Date:** 2026-07-03 Â· **Status:** User approved

`docs/design/` (especially `04_design_tokens.json`) is the canonical visual source:
deep-navy palette (#08111F bg), confidence color ramp (cyan/green/amber/violet),
typography and motion tokens. Tailwind theme derives from the tokens file. Also
adopted: difficulty-selector explainer copy and the brief "decision locked"
suspense state before reveal. Applied to the built prototype via handoff H002.
H001's zinc/teal palette direction is superseded (H001 is not edited â€” it was
already executed; fix-ups get new handoffs).

## D012 â€” Report-approval workflow: role agents never commit

**Date:** 2026-07-03 Â· **Status:** User approved

Every executing agent ends its handoff by writing a completion report to
`agents/reports/R###_H###.md` (template in that folder) and leaves ALL work
uncommitted. The orchestrator reviews the report + diff, approves or rejects, and
only the orchestrator commits to git. Consultant memos and Auditor audit files
serve as those roles' reports. H001 was executed before this rule existed and has
no R-report; its review happens via orchestrator review + audit A001.

## D013 â€” Return-mix guideline; placeholder data rebalanced

**Date:** 2026-07-03 Â· **Status:** User approved

Playtest found every prototype round felt like a lottery because all 6 placeholder
scenarios had extreme returns. The engine math is correct (stake Ã— real historical
return IS the game); the deck was skewed. Fix: rebalance samples to 2 dramatic /
4 modest, and lock a content guideline for Phase 3+: **~70% of scenario cards have
modest returns (Â±10â€“60%), ~30% dramatic (>Â±80%)**, mixed windows. Content Curator
enforces this per daily pool and pack.

## D014 â€” Wrong All-In = instant bust

**Date:** 2026-07-03 Â· **Status:** User approved (user's call over orchestrator's
proportional-loss recommendation)

An incorrect All-In call loses the entire stake: bankroll â†’ $0, run ends,
regardless of return magnitude. Correct All-In still earns the full historical
return on the stake. Rationale: All-In should feel like total risk; under
proportional losses bankruptcy was nearly impossible and All-In read as "95%".
`soul.md` amended.

## D015 â€” "Call the Company" bonus guess

**Date:** 2026-07-03 Â· **Status:** User approved

Optional company guess before Lock In: correct +2 Signal Score, wrong âˆ’1, blank 0.
Allowed with any action including Pass. Never affects bankroll. The wrong-guess
penalty exists so guessing is a real declaration, not free spam. Matching is
normalized (lowercase, alphanumerics only) against a per-scenario accepted-names
list. This folds "what the player knew" into Signal Score's identity as the
decision-quality stat.

## D016 â€” Bankruptcy floor at $1

**Date:** 2026-07-03 Â· **Status:** Orchestrator decision (complements D014)

A run ends in bankruptcy when bankroll drops below $1, not only at exactly $0 â€”
prevents unplayable "zombie runs" at $3 after repeated High-confidence losses.

## D017 â€” Payout model re-confirmed: proportional to real historical return

**Date:** 2026-07-03 Â· **Status:** User approved (explicitly re-confirmed after
playtest question)

`pnl = stake Ã— actualReturnPercent` stands, exactly as specified in docs 02/06/10
and soul.md. Alternatives considered and rejected: even-money 1:1 (magnitude of
the historical move would carry no gameplay weight; reads as betting) and capped
proportional (gains capped at +100% of stake). The size of the real market move
IS the payoff â€” a $1,250 low-confidence stake on Netflix 2012â€“2017 (+1,135.6%)
correctly pays â‰ˆ$14,200. Swing management is handled by deck composition (D013),
not by changing the math.

## D018 â€” Placeholder content is still bound by soul.md content integrity

**Date:** 2026-07-03 Â· **Status:** Orchestrator decision

Audit A001 found the Amazon placeholder card leaked identity (famous book-title
reference, founder reference, Amazon's literal mission statement); the orchestrator
also found a Microsoft card naming the product "Windows" and a near-unmistakable
BlackBerry title. Prototype/placeholder data (D006) does NOT get a pass on the
`soul.md` content-integrity rules â€” no company name, ticker, founder/CEO reference,
or unmistakable product name/slogan in hidden-card content, ever, even before the
Phase 3 curated replacement. Fixed in H005. The Content Curator role file already
encodes this for Phase 3+; D018 makes it retroactive to placeholder data.

## D019 â€” Content-leakage is a standing audit check + Phase 3 automated validator

**Date:** 2026-07-03 Â· **Status:** User-requested

Two-layer defense against identifying information in hidden-card content:
1. **Now:** every Auditor pass that touches scenario content runs a content-leakage
   scan (company name / ticker / founder / product-name-or-slogan) â€” added to
   `agents/roles/auditor.md`. A001 already caught the Amazon leak this way.
2. **Phase 3:** the content pipeline (`packages/content`) ships an automated
   leakage/difficulty validator (Zod schema + a rules check) so cards fail
   validation before a human ever reviews them. Logged in `roadmap.md` Phase 3.

## D020 â€” Prototype needs more placeholder scenarios to reduce repetition

**Date:** 2026-07-03 Â· **Status:** User-reported, orchestrator decision

Playtest: a 20-round run only showed ~4â€“5 distinct companies because the pool has
6 cards and `buildRunScenarioList` cycles them. Fix (H006): expand placeholder pool
to 12 orchestrator-authored cards and make `buildRunScenarioList` exhaust the pool
before repeating (no card twice until all shown; no back-to-back repeat at lap
boundaries). Still placeholder-grade (D006); Phase 3 replaces all of it with 100
curated cards, so this is a demo-quality stopgap, not final content.

## D021 â€” Model routing & risk-tiered execution

**Date:** 2026-07-06 Â· **Status:** User approved

The workflow becomes routing-first: for every task the orchestrator classifies
type and risk, then routes to the cheapest execution tier that can do the work
without making judgment calls. Full policy in `agents/routing.md` (single source
of truth). Summary:

- **Orchestrator/planner:** Claude Fable (interactive session). Routes, decides,
  authors handoffs, reviews, commits. Does not implement mechanical work itself.
- **Cheap tier â€” DeepSeek** (manual handoff): easy, fully-prescribed tasks.
- **Medium tier â€” Claude Sonnet/Opus subagent** (orchestrator spawns in-session):
  medium-strength tasks, or anything too subtle for the cheap tier. Subagents
  follow the identical procedure as external agents â€” no commits, R### report,
  orchestrator review (D012 unchanged).
- **Strong tier â€” GPT 5.5** (manual handoff): architecture, scoring design,
  security, ambiguous bugs, high-stakes review.

Auditor passes are now gated by the handoff's **risk level** (low/medium/high per
`agents/routing.md`) instead of the vague "code-heavy" rule. Ad-hoc specialist
needs are met with **micro-roles** â€” task-specific framing written inside the
handoff on top of a base role â€” never new permanent role files (reinforces D001).

**Rationale:** Goal is efficiency and lower token cost. The existing handoff/
report/review machinery already matched best practice (task packets, output
contracts, review gates); what was missing was explicit model routing and
risk-based gating. Rejected from the external proposal that prompted this:
lifecycle folders (`queued/active/done` â€” status headers already track this),
role renames (cosmetic churn), a `workflows/` process-doc folder (context bloat),
and splitting memory files (violates one-source-of-truth).

## D022 â€” Difficulty-scaled clue counts (3/2/1) + Scenario Content Rulebook

**Date:** 2026-07-06 Â· **Status:** User approved

Playtesting found the company is trivially guessable even on Medium. Two causes:
(1) the prototype's placeholder cards have NO per-difficulty variants â€” one
hidden-text set is shown at every difficulty (a D006 shortcut), so difficulty
only changed bankroll; (2) the difficulty guidelines in doc 09 were one vague
example sentence per level with no testable rules.

Decision, amending `soul.md`'s "exactly 3 clues at every difficulty" rule:

1. **Clue counts scale with difficulty: Easy 3 / Medium 2 / Hard 1.** Difficulty
   now scales both the QUANTITY of information (clue count) and the IDENTIFYING
   POWER of every hidden field (specificity rules).
2. **The Scenario Content Rulebook lives in `docs/09_content_and_round_creation.md`**
   (one source of truth; it was already the Curator's manual): clue taxonomy,
   specificity ladder with per-difficulty caps, universal leak bans (extending
   soul.md's list), title rules (titles are pre-decision content and must meet
   the HARD bar at every difficulty), a decision-informativeness requirement
   (anti-randomness floor, especially for Hard's single clue), and a falsifiable
   **guessability test**: ask a fresh LLM to name the company from the hidden
   card â€” Easy: correct answer should appear in its top 3; Medium: may appear
   but must not be a single confident #1; Hard: must not appear in top 3. The
   Phase 3 validator (D019) automates this with a model call per variant.
3. **Sequencing:** orchestrator drafts the rulebook (this session) â†’ GPT 5.5
   reviews it via handoff H008 (strong tier, high risk per routing.md) â†’
   placeholder cards regenerated with real per-difficulty variants in a
   follow-up cheap-tier handoff (H009) so playtests exercise the rulebook.
   No placeholder pool expansion â€” repetition is solved by Phase 3 content.

**Rationale:** count scaling is legible to players the way bankroll scaling is
("Hard = less info"), dovetails with the open Information-Tier design question,
and makes Hard cards cheaper to author. The specificity rules and guessability
test carry the real anti-leak burden â€” fewer clues alone would not fix a single
razor-specific clue. Risk accepted: Hard's single clue may feel random; the
decision-informativeness rule mitigates, and playtest verdicts can revisit the
1-clue count without reopening the rest of this decision.

**Amended 2026-07-06 (user approved):** merged four additions from an
independent GPT 5.5 memo the user commissioned on the same problem:
(1) literal-leak vs triangulation-leak terminology; (2) a mandatory private
**fact bank** authoring step (reveal-only / decision-useful / prohibited
facts, enumerated before writing); (3) **Hard-first generation order** (write
Hard, add specificity for Medium, then Easy â€” never vague Easy down);
(4) **red-team likely-guesses lists** per variant as required curator output
(Phase 3 schema metadata later), with Medium calibrated to "2â€“4 plausible
alternatives". The memo's retention of 3-clues-everywhere was explicitly
rejected by the user â€” 3/2/1 stands. Its claim that triangulation can't be
auto-checked was rejected too: the LLM guessability check performs
triangulation by construction; term-list warnings become a supplementary
Phase 3 validator layer only.

**Second amendment 2026-07-07 (orchestrator, per consultation C001):** adopted
all 10 fixes from the H008 adversarial review (`agents/consultations/
C001_rulebook_review.md`), which found the rulebook sound but exploitable via
cross-field triangulation. Now in doc 09: (1) whole-card triangulation gate
(Gate 1, human) ahead of the model test; (2) distinctive-hook ban (interface,
category origin, pricing incident, etc. famous for one company in the window);
(3) plausible-alternative minimums per difficulty (Easy â‰¥2 / Medium 2â€“4 /
Hard â‰¥4); (4) famous-hindsight-thesis ban; (5) informativeness floor requires
a concrete Long driver AND Short risk anchored to the fact bank; (6) Gate 2
protocol pinned (same model + prompt, top-5 with confidence, numeric
thresholds as tunable calibration values); (7) M broadened to Market-position/
setup (valuation, balance sheet, margins, sentiment), Hard's S clue may fold
in one setup element; (8) ladder escalation rules (2+ identity dimensions =
+1 level; <3 plausible companies with era/date = L4); (9) guess lists require
the pointing fact per guess; (10) calibrated pass/fail examples added.
Adaptations: dropped C001's "Hard fails if ANY guess exceeds 50% confidence"
(a confident WRONG guess is camouflage, not a leak) and its temperature-0
requirement applies to the Phase 3 automated validator, not manual runs.
D015 calibration note (Call the Company becomes rare on Hard by design) is
tracked for playtest review, not a scoring change.

## D023 â€” Model lineup v2: Grok 4.5, characteristic-based routing, direct CLI dispatch

**Date:** 2026-07-08 Â· **Status:** User approved

Supersedes D021's execution-tier table (D021's risk gates, micro-roles, and the
D012 review machinery all carry forward unchanged). Full policy in
`agents/routing.md` (single source of truth). Settled points:

1. **Grok 4.5 replaces the Claude Sonnet/Opus subagent tier** for medium-strength
   execution work (user rates it â‰ˆ Opus 4.7/4.8 capability at much lower cost).
2. **Claude subagents become a utility tier** â€” spawned in-session by the
   orchestrator for its own exploration, diff verification, and quick checks.
   They no longer execute handoffs.
3. **GPT 5.5 expands** beyond high-stakes review to own hard implementation,
   design/UI/UX work, and content/scenario work (Content Curator role).
4. **DeepSeek v4 Pro unchanged**: boilerplate and fully-prescribed implementation.
5. **Routing is characteristic-based**: the orchestrator profiles each task
   (judgment, ambiguity, style-sensitivity, scope, risk) and matches it against
   a ranked model-characteristics table (Intelligence / Cost-efficiency / Style
   ratings supplied by the user; Speed / Autonomy proposed by the orchestrator).
6. **Direct CLI dispatch** replaces manual paste as the default invocation:
   the orchestrator launches executors headlessly (`grok -p`, `codex exec`,
   `opencode run -m deepseek/deepseek-v4-pro`) and waits for the R### report.
   Manual paste remains the fallback if a CLI is down.
7. **Risk-based approval gate**: low-risk handoffs dispatch immediately after
   task agreement; medium/high-risk handoffs need explicit user approval of the
   drafted handoff before launch.
8. **Guardrails**: workspace-write, no git â€” headless agents auto-approve edits
   inside the repo; CLI flags (where available) plus handoff text forbid
   `git commit`/`git push` (D012) and out-of-repo writes.
9. **Cross-model audits**: the Auditor is always a different model than the
   Implementor of the handoff under audit.
10. **Handoff prescriptiveness scales to executor autonomy**: DeepSeek gets
    fully prescriptive instructions; Grok gets outcome-prescriptive with bounded
    local judgment; GPT 5.5 gets goal-oriented handoffs that delegate bounded
    design decisions.

**Rationale:** Grok 4.5 delivers the old medium tier's capability at a fraction
of the cost, and all three executor CLIs are installed and authenticated on the
dev machine, making manual prompt-pasting pure overhead. Characteristic matching
replaces the rigid 3-tier ladder so routing survives future lineup changes
(update the table, not the process). Roles stay at five (D001); only which model
wears each hat changed.

## D024 â€” Development-speed review policy; strict gates return for production readiness

**Date:** 2026-07-09 Â· **Status:** User approved

During prototype and active MVP development, optimize for efficient token usage
and forward code progress. The default review loop is now:

1. Role agent executes the handoff, runs required tests/typecheck, updates
   `progress.md`, and writes the R-report.
2. Orchestrator reviews the report + diff, reruns cheap verification, and commits
   when the result is good enough for the current development stage.
3. Formal Auditor passes are **not automatic** for all medium-risk work. Use them
   only for major phase completions, substantial feature additions, high-risk
   domains, or when the orchestrator/user explicitly wants extra review.

Routine low- and medium-risk development handoffs may be dispatched after the
user agrees to the task; they do not need a second "approve this handoff" stop.
Explicit pre-dispatch user approval remains required for high-risk work, major
feature additions, phase-completion handoffs, irreversible/outward-facing actions,
or anything that changes product rules.

High-risk domains still require stronger review even during development:
scoring/game-engine math, leaderboard integrity, auth, database/server trust
boundaries, security/privacy, changes to `soul.md` rules, production content
pipeline validation, and anything user/outward-facing enough that a mistake is
expensive to unwind. These get an Auditor pass or equivalent cross-model review.

Placeholder scenario content is allowed to be prototype-grade as long as it avoids
literal `soul.md` leaks (company name, ticker, founder/CEO, unmistakable product
name/slogan) and keeps the D022 3/2/1 clue structure. Full doc 09 Gate 1/Gate 2
guessability enforcement applies when content is entering the real Phase 3
pipeline (`reviewed`/`active`) or when the orchestrator explicitly marks a content
handoff production-quality. Do not spend repeated model cycles polishing temporary
placeholder cards.

Production-readiness / pre-launch work restores the stricter safety harness:
formal audits at phase gates, content validator enforcement, anti-cheat review,
accessibility/performance QA, and cross-model review for any durable surface that
will be shipped publicly.

**Rationale:** The H009â†’H011 placeholder-content loop consumed multiple model
passes and audits without materially advancing the app. That level of process is
appropriate before production content ships, but it is too expensive for a basic
prototype game. Shipping velocity is now the priority until the app reaches
production-readiness gates.

## D025 â€” Classic Run length scales by difficulty

**Date:** 2026-07-09 Â· **Status:** User approved

Classic Run is no longer a flat 20-round session by default. Default run length
now scales with difficulty:

```text
Easy:   10 rounds
Medium: 15 rounds
Hard:   20 rounds
```

Daily Challenge remains 10 rounds. Starting bankrolls are unchanged: Easy
$12,500 / Medium $10,000 / Hard $7,500.

**Rationale:** Playtesting showed the old 20-round default is too long for a
normal session. Scaling length by difficulty makes Easy a faster on-ramp, Medium
a standard session, and Hard the endurance mode without changing scoring math,
content rules, or Daily Challenge fairness. These values are playtest-tunable,
but the product rule is that Classic Run length is difficulty-configured rather
than globally fixed.

## D026 â€” Balanced Tension scenario cards

**Date:** 2026-07-09 Â· **Status:** User approved

Phase 3 scenario cards use a **Balanced Tension** pre-decision model. Each
difficulty variant includes:

```text
companyDescription
macroContext
situation
longCase
shortCase
setupHints
```

The player-facing card frames the tension under the product name:

```text
Signal or Noise?
Why it might work
What could break
```

Internal schema fields remain `longCase` and `shortCase` because they are
unambiguous for validation and scoring-adjacent review. The UI must not label
one side "Signal" and the other "Noise"; that would imply the bear case should
be disregarded. The player is deciding whether the whole setup is signal or
noise, not whether the upside is inherently signal and downside is inherently
noise.

The old D022 clue-count rule is clarified for the structured model: difficulty
now scales **setup hint count and specificity**, while every variant still has
the balanced decision core (`situation`, `longCase`, `shortCase`).

```text
Easy:   1 setup hint, more direct specificity
Medium: 0â€“1 setup hints, balanced specificity
Hard:   0 setup hints, abstract but still decision-useful
```

The pre-decision lookback chart stays, but is demoted to atmosphere/context:
small, non-predictive, and reviewed as part of the full pre-decision payload.
It must not become a momentum/reversal oracle or a company-identity silhouette.

**Rationale:** Playtests showed players could infer Long/Short from directional
sentiment even when company identity remained hidden. Free-form clue lists made
it too easy for one side to be concrete and the other decorative. Balanced
Tension makes the unresolved debate first-class, fair, and validator-friendly
while preserving the game's core decision fantasy.

## D027 â€” Content Expansion moves up to Phase 4, split into two parts

**Date:** 2026-07-09 Â· **Status:** User approved

The roadmap phase order changes. Content Expansion (previously Phase 8) becomes
**Phase 4**, and every phase between shifts down one:

```text
Phase 4: Content Foundation & Expansion (was Phase 8), in two parts:
         Part A â€” content-rules & validator hardening (AI-assisted-generation
                  readiness, A005 MINOR follow-ups, automated Gate 2
                  guessability check, re-review of existing cards)
         Part B â€” content generation at scale (the original Phase 8 scope)
Phase 5: Database        (was Phase 4)
Phase 6: Auth & Guest Play (was Phase 5)
Phase 7: Leaderboards    (was Phase 6)
Phase 8: Daily Challenge (was Phase 7)
Phase 9: MVP Polish      (unchanged)
```

**Rationale (user):** the scenario cards ARE the game â€” if they leak identity or
direction, or simply aren't fun, there is no reason to build the surrounding
systems. Hardening the generation rules and guards first means new cards can be
added quickly and confidently later, without worrying about leaks or unfun
cards. Content quality risk is retired before infrastructure investment.

**Renumbering note:** phase-number references written before this decision
(e.g. "Prisma + PostgreSQL (Phase 4+)" in D002, consultant-memo timing in
earlier entries, "Phase 8" deferrals in A005/H018) refer to the OLD numbering.
`roadmap.md` is the single source of truth for phase order; `AGENTS.md`
operating references are updated to the new numbers. Historical decision
entries are not rewritten. The consultant-memo requirements move with their
phases: DB provider/guest strategy memo before Phase 5, auth provider memo
before Phase 6.

## D028 â€” Manual handoff is the default dispatch mode

**Date:** 2026-07-09 Â· **Status:** User approved

Amends the dispatch portion of D023 (routing, model characteristics, and
calibration are unchanged):

- **Default: manual handoff.** The orchestrator authors the handoff, then gives
  the user the standard dispatch prompt (see `agents/routing.md`); the user
  launches the executor themselves and returns to the orchestrator when the
  R###/A###/C### artifact exists.
- **Direct dispatch is opt-in.** The orchestrator may launch a handoff executor
  itself (headless CLI or tool call) only with the user's explicit permission â€”
  granted per dispatch or per session. The D023 CLI commands remain documented
  in `agents/routing.md` as the opt-in path.
- **Utility subagents are unaffected.** The orchestrator may freely call agents
  to help with its OWN work (exploration, diff verification, research). The
  permission requirement applies only to agents executing handoff prompt tasks
  (Implementor, Auditor, Consultant, Curator, Growth).

**Rationale (user):** the user wants visibility and control over when executor
sessions launch and which model runs them, while keeping the automated path
available on request. Cost/routing decisions stay human-approved by default.

## D029 â€” Token-efficient context routing

**Date:** 2026-07-09 Â· **Status:** User requested

The agent workflow now treats context as an explicit budgeted resource. New
handoffs must include a Context Manifest, Context Budget, and Output Budget.
Default reading is scoped: agents read `progress.md` Current Status / How to Run /
Blocked-Questions / latest entries, plus only the decisions, docs, artifacts, and
source files named by the handoff. Broad "read all history/docs" instructions are
reserved for phase gates, production-readiness audits, and genuinely cross-cutting
architecture decisions.

Claude Fable is the orchestrator seat by default, not a normal handoff executor.
Fable or any high-reasoning executor run requires explicit user override with a
short explanation of why Grok/GPT 5.5 is insufficient and what context/output size
is expected. Bounded consultations route to Grok first; GPT 5.5 is reserved for
genuinely ambiguous or high-stakes design work.

**Rationale:** The H013/C002 and H019/C003 consultation pattern combined expensive
models, full-file required reading, long historical state files, and long memo
outputs. That made one prompt consume a disproportionate share of the user's
five-hour usage window. The fix is to route expensive models only when necessary
and to make context/output limits first-class in every handoff.

## D030 - State compaction policy

**Date:** 2026-07-09 · **Status:** User approved

`progress.md` is the live operational dashboard, not permanent long-form history.
After each major milestone or phase close, the orchestrator compacts state:

1. Keep `progress.md` focused on Current Status, How to Run, Blocked/Questions,
   and the current/recent session log entries needed for active work.
2. Move older detailed logs into `agents/history/progress_phase_*.md` with a
   concise phase summary and carried-forward issues.
3. Keep `roadmap.md` as the strategic phase map and acceptance record; do not use
   it as a session log.
4. Keep `decisions.md` as the decision index plus full decision text. Agents read
   the index first and open full decisions only when a handoff names specific
   D-numbers.
5. Handoffs should link to archive files only when historical detail is necessary.

**Rationale:** Phase 0-3 history is useful for audits and archaeology, but active
Phase 4 agents do not need detailed Phase 1 session logs in their default context.
Compaction preserves traceability while keeping routine context small.

## D031 - Automated Gate 2 judge uses Grok 4.5

**Date:** 2026-07-09 · **Status:** User approved

C003's Gate 2 design is accepted with these resolutions:

1. The handoff executor for the Gate 2 implementation should be **Grok 4.5**.
2. The automated Gate 2 judge model should also be pinned to **Grok 4.5**, not
   Claude Sonnet 5. The judge is used only as a validation-time "strong player"
   that tries to identify the hidden company and infer Long/Short direction from
   the same pre-decision payload a player sees. It is not used for gameplay
   content generation, and its output is never shown to players.
3. D022's "pinned model at temperature 0" wording is clarified to mean: use the
   most deterministic configuration the pinned model supports, with temperature
   0 or equivalent low-randomness settings where available, no web/search tools,
   structured JSON output, and cached results keyed by content hash.
4. Direction leakage starts as WARN-only while calibrated on the active seeds and
   fixtures. Promotion to a blocking reviewed/active rule requires a later
   orchestrator decision.
5. Easy Gate 2 result mapping: correct company at rank 1-3 passes; correct at
   rank 4-5 warns; missing from top 5 fails as too vague.

**Rationale:** Grok 4.5 is strong enough for both implementation and the
validation judge, has high autonomy for the scoped task, and is cheaper per API
call than Sonnet 5 at current published pricing. The gate still needs fixture
calibration before Part B scale-up, but the chosen model is cost-effective enough
to run over 100+ cards without making content expansion expensive. This does not
weaken the `soul.md` ban on dynamic AI-generated production gameplay because the
model judges already-authored cards offline; it does not create served content.

## D032 - Gate 2 runs through agent workflow, not API tokens

**Date:** 2026-07-09 · **Status:** User approved

Gate 2 model judgment should use the existing role-agent workflow and the user's
SuperGrok/Grok usage limits, not a new embedded xAI API integration in
`packages/content`.

Implementation implication:

1. `packages/content` owns deterministic/offline pieces only: render the exact
   pre-decision payload, hash it, define/store `review.gate2`, evaluate stored
   raw results against thresholds, and make `validate` fail closed for
   reviewed/active cards with missing/stale/failing Gate 2 data.
2. A Gate 2 execution is a normal handoff to Grok 4.5. Default dispatch remains
   manual per D028; the orchestrator may invoke a headless Grok agent only when
   the user explicitly approves that dispatch.
3. The Grok role agent reads the rendered payloads, acts as the pinned judge, and
   writes structured raw results into the scenario JSON. The repo then validates
   those stored results offline.
4. No `XAI_API_KEY`, `.env` secret, xAI SDK, or network-dependent default
   validation path is required for MVP Gate 2.

**Rationale:** This preserves the current agent workflow and avoids separate API
token spend while still giving the repository a falsifiable, cached, offline
enforcement layer. The tradeoff is that Gate 2 is "agent-assisted automation"
rather than a fully self-contained CLI API call; that is acceptable for the
current solo MVP pipeline and can be revisited if batch volume or CI needs later
justify API integration.

## D033 - GPT 5.6 Terra joins the roster; all roles are model-agnostic

**Date:** 2026-07-09 · **Status:** User approved

Amends the D023/D029 model lineup. Full routing policy stays in
`agents/routing.md` (single source of truth). Settled points:

1. **GPT 5.6 Terra added** to the roster: Intelligence 10, Cost-eff 5, Style 8,
   Speed 8, Autonomy 10. Invoked via `codex exec` with model/reasoning
   overrides; the High reasoning variant is the standard configuration for its
   tier.
2. **Rating corrections:** GPT 5.5 Cost-efficiency 5 → 6; Grok 4.5 Style
   TBD → 6.
3. **Claude Fable is no longer the default orchestrator seat.** Fable is a
   high-reasoning roster model like Terra: usable for hard tasks, high-stakes
   reviews/audits, and consultations. It is not locked to any single role.
4. **All roles are model-agnostic** — any roster model can be slotted into any
   role (including Orchestrator) based on the task. The initial orchestrator
   for a work session is always initiated and picked by the user, who kicks off
   the session.
5. **Cross-model review at the top tier:** with two Autonomy-10 models
   (Fable, Terra), high-stakes work produced or orchestrated by one can be
   reviewed/audited by the other, extending the D023 cross-model audit rule to
   the strongest tier.
6. High-reasoning assignments still record a 2-3 sentence rationale (why
   Grok/GPT 5.5 is insufficient, expected context/output size) per D029's
   token-economy intent; the D029 "Fable is the orchestrator seat by default"
   wording is superseded by this decision.

**Rationale:** A second frontier model removes the single-point dependency on
Fable for hard work and enables genuine cross-model review at the top tier.
Making every seat model-agnostic keeps the workflow durable across future
lineup changes: the roster table changes, the process does not.
## Open Design Question â€” composite Final Score / Information Tiers (NOT a decision)

**Date:** 2026-07-03 Â· **Status:** Exploration pending

User is considering restructuring scoring around three axes: Bankroll (outcome),
Signal Score (decision quality), Information Tier (what the player knew), possibly
with a composite final score â€” potentially demoting or removing bankroll.
Orchestrator position: bankroll is the core product fantasy per soul.md and all
docs; do not remove it casually. Agreed path: a design memo with 2â€“3 concrete
scoring models after audit A001, then a deliberate decision. Until then, bankroll
remains the primary score.
