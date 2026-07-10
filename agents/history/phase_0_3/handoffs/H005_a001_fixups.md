# H005 — A001 Fix-ups: Final-Round Dead-End, Confidence Ramp, Content Leaks

**Role:** Implementor
**Phase:** 1 (fix-up, unblocks Phase 1 closeout)
**Status:** approved
**Depends on:** H001–H003 (committed `232aa19`); audit `agents/audits/A001_H001-H003.md`
**Estimated scope:** small — 2 bug fixes in one file, 4 content string edits in one file.
No game-engine changes; tests stay 24/24.

## Context

Audit A001 returned **FAIL** with two BLOCKERs and content findings. Read
`agents/audits/A001_H001-H003.md` first. This handoff fixes exactly those items and
nothing else. All edits are in two files:
`apps/web/app/play/classic/run/page.tsx` and `apps/web/lib/sampleScenarios.ts`.
Do not commit (D012).

## Objective

Full 20-round runs reach the summary; selected confidence and decision buttons show
their color ramp; placeholder cards stop leaking company identity; Netflix shows
+1135.6%. `pnpm test`, `typecheck`, `lint` all clean, then re-audit.

---

## Part A — BLOCKER 1: Final-round dead-end (run page)

**Cause:** at round 20, Lock In advances `currentRoundIndex` to 20 and switches to
`view === 'locked'`, but the guard also fires for `'locked'` when
`scenarios[20]` is undefined, rendering "No scenario available." The locked, reveal,
and summary views do NOT need `scenario` (they read `lastRound` /
`scenarioByLookup`), so the guard must apply to the round view only.

In `apps/web/app/play/classic/run/page.tsx`, change the guard (currently line ~71):

```tsx
// BEFORE
  if (!scenario && (view === 'round' || view === 'locked')) {
// AFTER
  if (!scenario && view === 'round') {
```

## Part B — BLOCKER 2: Confidence/decision color ramp not rendering (run page)

**Cause:** classes are built by interpolating a runtime color name
(`border-${color}`, `bg-${color}/10`, `text-${color}`). Tailwind's compiler only
generates CSS for class strings it can see as literals in source, so these never
exist. Fix by using fully-literal static class maps.

### B1. Add static maps

Near the top of the file, where `CONFIDENCE_COLORS` and `DECISION_COLORS` are
defined, **replace both** of those maps with these three:

```tsx
// Fully-literal class strings so Tailwind's JIT compiler emits them.
// Do NOT build these by interpolating color names at runtime.
const CONFIDENCE_SELECTED_BOX: Record<Confidence, string> = {
  low: 'border-son-signalCyan bg-son-signalCyan/10',
  medium: 'border-son-green bg-son-green/10',
  high: 'border-son-amber bg-son-amber/10',
  all_in: 'border-son-violet bg-son-violet/10',
};
const CONFIDENCE_SELECTED_TEXT: Record<Confidence, string> = {
  low: 'text-son-signalCyan',
  medium: 'text-son-green',
  high: 'text-son-amber',
  all_in: 'text-son-violet',
};
const DECISION_SELECTED: Record<RoundAction, string> = {
  long: 'border-son-green bg-son-green/10 text-son-green',
  short: 'border-son-red bg-son-red/10 text-son-red',
  pass: 'border-son-textSecondary bg-son-textSecondary/10 text-son-textSecondary',
};
```

### B2. Remove dead code

Delete the now-unused helper functions `confidenceColorClass` and
`decisionColorClass` entirely (they were never called and contain a broken
`shadow-[...var(--tw-color-shadow)...]`). Also delete the now-unused
`const color = CONFIDENCE_COLORS[level];` line inside the confidence map. `pnpm lint`
(no-unused-vars) must be clean afterward — if anything else references the removed
maps, rewire it to the new maps.

### B3. Wire decision buttons (selected branch)

```tsx
// BEFORE
  ? `border-${DECISION_COLORS[a]} bg-${DECISION_COLORS[a]}/10 text-${DECISION_COLORS[a]} font-semibold`
// AFTER
  ? `${DECISION_SELECTED[a]} font-semibold`
```

### B4. Wire confidence buttons

Selected box class:

```tsx
// BEFORE
  } else if (selected) {
    classes = `border-${color} bg-${color}/10`;
// AFTER
  } else if (selected) {
    classes = CONFIDENCE_SELECTED_BOX[level];
```

Inner label + value text (two occurrences of `text-${color}`):

```tsx
// BEFORE (label div)
  <div className={`text-xs ${disabled ? '' : selected ? `text-${color}` : 'text-son-textSecondary'}`}>
// AFTER
  <div className={`text-xs ${disabled ? '' : selected ? CONFIDENCE_SELECTED_TEXT[level] : 'text-son-textSecondary'}`}>

// BEFORE (value div)
  <div className={`mt-0.5 text-lg font-bold tabular-nums ${disabled ? '' : selected ? `text-${color}` : 'text-son-text'}`}>
// AFTER
  <div className={`mt-0.5 text-lg font-bold tabular-nums ${disabled ? '' : selected ? CONFIDENCE_SELECTED_TEXT[level] : 'text-son-text'}`}>
```

After B, grep the file for `` border-${ ``, `` bg-${ ``, `` text-${ `` — there must be
**zero** interpolated color classes remaining.

## Part C — Content de-identification (soul.md, decision D018)

Placeholder cards must still obey `soul.md` content integrity (no company name,
ticker, founder/CEO reference, or unmistakable product name/slogan in hidden-card
content). Fix these exact strings in `apps/web/lib/sampleScenarios.ts`:

1. **Amazon** — title `Everything Store, Everything Crash` (echoes a famous Amazon
   book) → `Growth at Any Cost`.
2. **Amazon** — clue 1
   `The company has a visionary founder who promises to build the world's most
   customer-centric company.` (founder reference + Amazon's literal mission
   statement) →
   `Leadership preaches relentless customer obsession and pours every dollar back
   into growth.`
3. **Microsoft** — the clue
   `The company's new CEO is pivoting strategy toward cross-platform cloud services
   rather than protecting legacy Windows revenue.` (names the product "Windows") →
   `New leadership is pivoting toward cross-platform cloud services rather than
   defending its legacy desktop-software franchise.`
4. **BlackBerry** — title `The Keyboard King` (near-unmistakable for the era) →
   `Losing the Screen War`.

Do not change any other card text, returns, dates, or prices in Part C.

## Part D — MINOR: Netflix precision

In `apps/web/lib/sampleScenarios.ts`, the Netflix scenario
`actualReturnPercent: 11.36` → `11.356` so the reveal shows `+1135.6%`. (This is a
display-precision fix, not a rebalance; Netflix stays the dramatic card.)

## Do NOT

- Touch `packages/game-engine` or any test file (no engine behavior changes).
- Add a Tailwind safelist — use the static maps above instead.
- Restyle, relayout, or change any copy beyond Parts C/D.
- Change other scenarios' returns/dates/prices.
- Commit or push (D012). Nothing on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `pnpm test` — 24/24 still pass. — *run it*
2. `pnpm typecheck` + `pnpm lint` clean (confirms dead code removed). — *run them*
3. A **full non-bankrupt 20-round Medium run** reaches the "Run Complete." summary —
   Round 20 Lock In → locked → Reveal Result → See Summary, no "No scenario
   available." — *play a full run passing every round*
4. Selecting each confidence level shows its ramp color on the button border/bg/text
   (Low cyan, Medium green, High amber, All-In violet) — verify computed style, not
   just class names. — *inspect in browser*
5. Selecting Long/Short/Pass shows green/red/gray selected styling. — *inspect*
6. Grep of `run/page.tsx` for interpolated `border-${`/`bg-${`/`text-${` returns
   zero matches. — *grep*
7. Amazon card title/clue, Microsoft clue, BlackBerry title show the new text; no
   company name, founder reference, or product name ("Windows") in any hidden-card
   content. — *observe in-app + read source*
8. Netflix reveal shows `+1135.6%`. — *play to a Netflix reveal*

## Reporting

Set Status `complete`, update `progress.md`, write `agents/reports/R005_H005.md`.
Do NOT commit. Recommended next step: **re-audit A002** (re-run the H004 checklist,
focused on the two former BLOCKERs and the content items) before the orchestrator
commits and closes Phase 1.
