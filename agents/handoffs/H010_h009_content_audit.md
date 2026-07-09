# H010 — Content Audit of H009 (Leakage Scan + Gate 1 + Gate 2 Spot Checks)

**Role:** Auditor
**Phase:** 1→2 transition (placeholder content quality gate)
**Status:** approved
**Model:** grok-4.5 (per `agents/routing.md`; first Grok dispatch — cross-model rule: implementor was a Claude subagent)
**Risk:** low (read-only analysis; writes only the audit file + one progress.md line)
**Depends on:** H009
**Estimated scope:** medium — 36 variant reviews + 9 fresh-model guessability runs

## Context

H009 rebuilt all 12 placeholder scenarios in `apps/web/lib/sampleScenarios.ts`
with per-difficulty hidden-card variants (`hidden.easy/medium/hard`, clue counts
3/2/1 per D022). The orchestrator has already verified the mechanical claims in
R007 (tests 24/24, typecheck clean, 12 scenarios × 3/2/1 clue counts confirmed
by script). **What remains unverified is content quality** — exactly the leak
patterns C001 found in the previous deck. That is your job.

**Important deviation from the usual flow:** the H009 work is already COMMITTED
(commit `dd5b5ec`), so there is no uncommitted diff to audit. Audit the current
files at HEAD; use `git show dd5b5ec --stat` if you want the change scope.
There ARE unrelated uncommitted changes possible in the tree — do not touch or
revert anything.

## Task Framing (micro-role)

For this task you are a **content-leakage and guessability auditor**. Your
rulebook is `docs/09_content_and_round_creation.md` (the Scenario Content
Rulebook): universal bans, specificity ladder, distinctive-hook ban,
hindsight-thesis ban, plausible-alternative minimums, decision-informativeness
floor, and the two-gate guessability protocol. Ignore code style, architecture,
and UI concerns entirely — R007's mechanical criteria are already verified.

## Objective

File `agents/audits/A003_H009.md` with a PASS / PASS WITH FINDINGS / FAIL
verdict on the content quality of all 36 hidden-card variants (12 scenarios ×
Easy/Medium/Hard) plus their titles, per the auditor report format in
`agents/roles/auditor.md`.

## Required Reading (in order)

1. `AGENTS.md`
2. `soul.md` — Content Integrity section
3. `agents/roles/auditor.md` — your role + report format
4. `docs/09_content_and_round_creation.md` — the full rulebook, especially
   Universal Bans, the specificity ladder, Gate 1, Gate 2, and the Calibrated
   Pass/Fail Examples
5. `agents/handoffs/H009_difficulty_variants.md` — what was built
6. `agents/reports/R007_H009.md` and `agents/reports/R007_H009_redteam.md` —
   the implementor's claims and red-team appendix

## Prescriptive Instructions

### Part A — Literal-leak scan (all 12 scenarios, all 3 variants, all titles)

For every scenario in `apps/web/lib/sampleScenarios.ts`: check `title` and each
variant's `companyDescription`, `macroContext`, and `clues` against soul.md
content integrity + doc 09 Universal Bans: no company name, ticker, founder/CEO
reference, unmistakable product name or slogan, banned distinctive hook, or
famous hindsight thesis. Titles must meet the HARD identifiability bar at every
difficulty. Also re-confirm clue counts are 3/2/1 (fast re-check; the
orchestrator already verified).

### Part B — Gate 1 triangulation review (all 36 variants)

For each variant, evaluate the FULL pre-decision payload together — `title`,
`era`, `decisionDateLabel`, the variant's `companyDescription` + `macroContext`
+ `clues`, and the `lookbackPrices` shape — and list the plausible
public-company candidates per doc 09 Gate 1. Apply the minimums: Easy ≥ 2;
Medium 2–4 with none dominant; Hard ≥ 4 with the correct company not dominant.
Cross-check your candidate lists against the red-team appendix
(`R007_H009_redteam.md`) and flag any variant where your list is materially
smaller than the appendix claims.

### Part C — Gate 2 guessability spot checks (9 pinned variants)

Run the doc 09 Gate 2 test on EXACTLY these 9 variants (chosen to include the
leak patterns C001 found in the old deck):

| Difficulty | Scenarios |
|---|---|
| Easy | proto_nvidia_2015_2017, proto_amazon_1999_2001, proto_cocacola_2010_2013 |
| Medium | proto_visa_2011_2013, proto_microsoft_2014_2016, proto_starbucks_2012_2014 |
| Hard | proto_blackberry_2008_2010, proto_gamestop_2016_2018, proto_boeing_2013_2015 |

Procedure per variant (test model: a FRESH `grok` single-turn session — record
this as the designated model in the audit):

1. Write the payload to a temp file, e.g. `%TEMP%\gate2_<id>_<difficulty>.txt`,
   containing: the title, era, decision date label, companyDescription,
   macroContext, the clues, the lookback price series — and NOTHING that names
   the company — followed by the exact doc 09 prompt: "Name the hidden company.
   Give your top 5 guesses with a confidence percentage for each."
2. Run it as a fresh session with no repo context and no tools:
   `grok --prompt-file "<temp file>" --cwd "%TEMP%" --disable-web-search --tools "" --no-subagents -p ""`
   (if that exact flag combination errors, the requirement is: fresh single-turn
   grok call, prompt from the file, cwd outside the repo, no web search, no
   file tools — adjust flags to meet it and record the command you used).
3. Record the top-5 guesses + confidences verbatim in the audit file, and apply
   the doc 09 thresholds: Easy = correct company should appear in top 3, fail
   if absent from top 5; Medium = fail if correct company is #1 with ≥ 40%
   confidence or leads #2 by 15+ points; Hard = fail if correct company appears
   in top 5 with ≥ 15% confidence.

### Part D — File the audit

Write `agents/audits/A003_H009.md` in the exact format from
`agents/roles/auditor.md`, covering: acceptance-criteria table (H009 criteria
4–5, the content ones; cite R007 for the already-verified mechanical ones),
findings with severities (any leak ≥ MAJOR; any Gate threshold failure is a
BLOCKER on that variant), the per-scenario leakage scan table, Gate 1 candidate
lists, Gate 2 transcripts + threshold results, and Notes for Orchestrator.
Add ONE line to `progress.md`'s session log pointing at A003 (see the
one-line audit entries already in that file for the pattern).

## Do NOT

- Do NOT fix, rewrite, or "improve" any scenario content — you report; a fix-up
  handoff fixes.
- Do NOT touch any app code, `soul.md`, `decisions.md`, `roadmap.md`, or doc 09.
- Do NOT run `git commit`, `git push`, or discard/revert anything in the tree.
- Do NOT re-litigate the 3/2/1 clue-count decision (D022) or any decisions.md
  entry.
- Do NOT run Gate 2 on more or fewer than the 9 pinned variants.
- Do NOT include the company name in any Gate 2 payload file.
- Anything on the MVP exclusion list in soul.md.

## Acceptance Criteria (for this audit itself)

1. `agents/audits/A003_H009.md` exists, follows the auditor.md format, and
   states a verdict. Verify: open the file.
2. The leakage scan covers all 12 scenarios × 3 variants + 12 titles (36 + 12
   rows or grouped equivalent). Verify: count rows in the audit file.
3. Gate 1 candidate lists exist for all 36 variants with the minimums applied.
   Verify: inspect the audit file.
4. Gate 2 results for exactly the 9 pinned variants, each with the recorded
   command, verbatim top-5 + confidences, and a threshold pass/fail. Verify:
   inspect the audit file.
5. Every finding carries a severity (BLOCKER/MAJOR/MINOR) and evidence.
6. One progress.md session-log line added; nothing committed
   (`git status` shows your two file changes uncommitted).

## Reporting

Your audit file IS your completion report (auditor.md) — do not write an R###
file. When done: ensure H010's Status is updated to `complete`, the progress.md
line is added, and everything is left uncommitted. If blocked (e.g., the grok
CLI refuses the Gate 2 flags in a way you cannot adapt within the stated
requirements), stop, log the question under Blocked/Questions in `progress.md`,
and end your session.
