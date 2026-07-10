# H004 — Auditor Pass A001 (H001 + H002 + H003)

**Role:** Auditor
**Phase:** 1 (audit gate)
**Status:** approved
**Depends on:** H001, H002, H003 (all implemented; committed at `232aa19`)
**Executor:** GPT 5.5
**Deliverable:** `agents/audits/A001_H001-H003.md` (this is your report — you do NOT
write an `agents/reports/R###` file; per D012 the audit file is the report).

## Who You Are

You are the **Auditor** for Signal or Noise?. Read `agents/roles/auditor.md` in full
first — it defines your posture (skeptical by default: find what's wrong, don't
confirm what's right) and your report format. You verify the committed prototype
against the acceptance criteria of three handoffs and against the project's locked
rules. **You do not fix anything and you do not commit** — you report; the
orchestrator resolves findings via fix-up handoffs.

## Required Reading (in order)

1. `soul.md` — the locked rules most violations would violate
2. `decisions.md` — D001–D017 (especially D007, D013–D017)
3. `AGENTS.md` — conventions and definition of done
4. The three handoffs you are auditing:
   `agents/handoffs/H001_phase0_phase1_prototype.md`,
   `H002_design_alignment.md`, `H003_gameplay_fixes.md`
5. The three completion reports: `agents/reports/R001_H001.md`, `R002_H002.md`,
   `R003_H003.md` (the implementers' own claims — verify them, don't trust them)

## Environment Setup (Windows)

This machine has no system Node. A portable Node is installed. In **PowerShell**,
prepend it to PATH for each session:

```powershell
$env:Path = "$env:LOCALAPPDATA\nodejs\node-v24.18.0-win-x64;$env:Path"
node --version   # expect v24.18.0
pnpm --version   # expect 9.15.0
```

All commands run from the repo root `C:\Repos\Signal_Or_Noise`.

## Part 1 — Automated Verification (run these yourself, record exact output)

| Check | Command | Pass condition |
|-------|---------|----------------|
| Install | `pnpm install` | completes, no errors |
| Tests | `pnpm test` | **24 passed** (15 scoring + 9 run), 0 failing |
| Types | `pnpm typecheck` | zero errors in game-engine and web |
| Lint | `pnpm lint` | zero errors |
| Dev server | `pnpm dev` | serves at http://localhost:3000 |

Do not accept a report's word for these — run them and paste real output into the
audit's Evidence column.

## Part 2 — Manual Gameplay Walkthrough

Start `pnpm dev`. Drive the browser (use your browser tooling; if none, use
`curl`/HTTP for content presence and reason from the source in
`apps/web/app/play/classic/run/page.tsx`, but note where you could not visually
confirm). Test at a **375px viewport** for the mobile criteria.

### 2A. Core loop & anti-leakage
1. `/` shows name, primary tagline, Play Now, and the disclaimer paragraph.
2. `/play` — Classic Run enabled; Daily Challenge and Portfolio Draft show
   "Coming soon" / disabled.
3. `/play/classic` — Easy/Medium/Hard show **$12,500 / $10,000 / $7,500** (from
   `STARTING_BANKROLL`, not hardcoded), each with its explainer line, plus the
   "How scoring works" card with the exact copy from H003 §C5.
4. In a round, BEFORE locking: the company name, ticker, actual return, and outcome
   chart are **not rendered**. (Note: soul.md relaxes anti-cheat for the local
   prototype, so the data may exist in the JS bundle — you are checking it is not
   *displayed*, not that it is absent from the bundle.)
5. Complete a full run to the summary screen.

### 2B. Math spot-checks (compute by hand, compare to the reveal)
Fresh runs. Sample returns (from `apps/web/lib/sampleScenarios.ts`): Netflix
`11.36`, Apple `0.45`, BlackBerry `-0.52`, Amazon `-0.87`, Microsoft `0.38`,
GameStop `-0.33`. Because scenario order is shuffled, identify the card by its
reveal, then check:

| Setup | Card | Expected (verify exactly) |
|-------|------|---------------------------|
| Medium run $10,000, **Long + Low (10%)** | Apple (+0.45) | stake $1,000 · gain +$450 · bankroll $10,450 · Signal +1 |
| Medium run $10,000, **Short + Low (10%)** | BlackBerry (−0.52) | stake $1,000 · gain +$520 · bankroll $10,520 · Signal +1 |
| Medium run $10,000, **Long + Medium (40%)** | GameStop (−0.33) | stake $4,000 · loss −$1,320 · bankroll $8,680 · Signal −2 |
| Easy run $12,500, **Long + Low (10%)** | Netflix (+11.36) | stake $1,250 · gain ≈ +$14,200 · bankroll ≈ $26,700 · Signal +1 |

### 2C. Decision-specific rules
6. **Wrong All-In bust (D014):** Long + All-In on a negative-return card (e.g.
   BlackBerry −0.52, where Long is wrong) → `Loss: −$<stake>`, `New bankroll: $0`,
   run ends, Bankrupt summary. Confirm it busts even though the loss magnitude is
   only 52% (this is the whole point of the fix).
7. **Pass:** bankroll unchanged, Signal −0.25, round advances.
8. **Call the Company (D015):**
   - Correct guess (e.g. `netflix` on The Streaming Pivot) + Long/Medium → reveal
     shows the +2 line and the round's Signal delta = base + 2.
   - Wrong guess (`wrongco`) → −1 line, delta = base − 1.
   - Blank guess → no guess line, delta = base only.
   - Pass + correct guess → round Signal delta = **+1.75** (−0.25 + 2).
   - Guess matching is case/punctuation-insensitive (try `NETFLIX` and `net flix`).
9. **Reset bug (H003 §C1):** after Next Round, action, confidence, and the guess
   input are all cleared and Lock In is disabled.
10. **Summary:** shows Final Bankroll, Signal Score, Correct/Wrong/Passes, Best &
    Worst Trade (with company names), and **Companies Called** count.

### 2D. Visual/design (D011) — at 375px
11. Deep-navy `son` palette everywhere; no leftover `zinc-*`/`teal-*` (grep
    `apps/web` to confirm zero matches).
12. Confidence buttons: exactly two lines `Label (40%)` / `$amount`, **no Signal
    Score impact shown on the button**; selected states use the cyan/green/amber/
    violet ramp.
13. Lookback sparkline is cyan regardless of trend direction; outcome sparkline
    (reveal only) may be green/red by direction.
14. "Call locked." intermediate screen appears between Lock In and reveal.
15. No horizontal scroll at 375px on any screen.

## Part 3 — Locked-Rule Compliance (check even where no handoff asked)

- **Scoring values** match `soul.md`: Low 10%/±1, Medium 40%/±2, High 70%/±3,
  All-In 100%/±5; Pass −0.25. Confirm `CONFIDENCE_CONFIG` in
  `packages/game-engine/src/confidence.ts` matches exactly.
- **Forbidden copy** absent from UI strings: grep `apps/web` for `place bet`,
  `investment advice`, `guaranteed`, `buy recommendation`, `sell recommendation`,
  `profit strategy`. (The word "call"/"stake" is allowed; "place bet" is not.)
- **MVP exclusions untouched:** no auth, no database/Prisma, no API routes, no
  leaderboard/profile/daily-challenge implementation, no charting library (the
  sparkline is hand-rolled SVG).
- **`actualReturnPercent` is a decimal** and zero-return counts as incorrect (D007).

## Part 4 — Known Item to Adjudicate

R003 flagged that Netflix reveals as **+1136.0%** because its data value is `11.36`
while the doc text says +1135.6% (i.e. `11.356`). This predates H003 and was
correctly left untouched. Record it as a **MINOR** finding with your recommendation
(the orchestrator expects: correct the sample value to `11.356` in a future data
pass — non-blocking).

## Do NOT

- Fix, refactor, or restyle any code — findings only.
- Run `git commit`, `git push`, or discard/modify the working tree.
- Soften a failed criterion to "close enough" — a criterion passes or it doesn't.
- Expand findings into redesign proposals; architecture opinions go under
  "Notes for Orchestrator", not as failures.

## Deliverable & Verdict

Write `agents/audits/A001_H001-H003.md` using the report format in
`agents/roles/auditor.md`. Include:
- An acceptance-criteria results table covering **all three handoffs' criteria**
  (H001's 15, H002's 9, H003's 10), each with Result + Evidence.
- Findings tagged **[BLOCKER]** / **[MAJOR]** / **[MINOR]**.
- The Part 3 locked-rule spot-checks with evidence.
- Notes for Orchestrator.

**Verdict rules:** FAIL if any acceptance criterion fails (every ❌ is a BLOCKER).
PASS WITH FINDINGS if all criteria pass but MAJOR/MINOR findings exist. PASS only
if criteria pass with at most MINOR findings.

End by adding a one-line entry to `progress.md` pointing at the audit file. Do not
commit — the orchestrator reviews your audit and commits it.
