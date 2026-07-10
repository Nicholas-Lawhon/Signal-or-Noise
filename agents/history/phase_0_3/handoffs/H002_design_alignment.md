# H002 — Align Prototype with Canonical Design Pack

**Role:** Implementor
**Phase:** 1 (fix-up)
**Status:** approved
**Depends on:** H001 (executed; work is uncommitted in the working tree)
**Estimated scope:** small/medium — styling migration + two small UI features.
No game-engine changes.

## Context

H001 built the playable prototype using a placeholder zinc/teal palette. The user
has since adopted `docs/design/` as the canonical UI/UX source (decision D011) and
made two display decisions (D009, D010). This handoff restyles the existing app to
the design tokens and adds two small approved interactions. **The working tree
contains H001's uncommitted work — build on top of it; do not revert or re-do
anything, and do not commit (decision D012).**

Read first: `soul.md`, `decisions.md` (D009–D012), `docs/design/DESIGN.md`,
`docs/design/04_design_tokens.json`.

## Objective

The prototype looks and behaves per the design pack: deep-navy token palette,
two-line confidence buttons, difficulty explainer copy, and a brief "call locked"
state before the reveal — with all H001 tests still passing.

## Prescriptive Instructions

### 1. Design tokens → Tailwind theme

Extend the Tailwind config in `apps/web` with the colors from
`docs/design/04_design_tokens.json` under a `son` namespace (copy hex values
exactly from that file — do not retype from memory):

```ts
colors: {
  son: {
    bg: '#08111F', surface: '#0E1A2D', card: '#111F35', cardElevated: '#17263D',
    borderSubtle: '#1B2A42', border: '#24324A', borderStrong: '#38506F',
    text: '#F4F7FB', textSecondary: '#A9B7CA', textMuted: '#66758C',
    signalBlue: '#4DA3FF', signalCyan: '#38D5E6', green: '#35D07F',
    amber: '#FFB84D', red: '#FF5C73', violet: '#A875FF', noiseGray: '#4E5C70',
  },
}
```

Then replace the zinc/teal palette across ALL screens:
- Page background → `son-bg`; card panels → `son-card` with `son-border` borders;
  primary/secondary/muted text → the three text tokens.
- Primary action buttons (Play Now, Start Run, Lock In, Next Round) →
  `son-signalBlue` (dark text `#06101E` on filled buttons).
- Border radius: cards `rounded-2xl`, buttons `rounded-lg` (per tokens radius scale).

### 2. Confidence buttons (decision D010)

Exactly two lines per button:
- Line 1: `Low (10%)` / `Medium (40%)` / `High (70%)` / `All-In (100%)` — smaller text.
- Line 2: the live dollar amount — larger, bold, tabular-nums.
- Remove any third line if present. NEVER display the ± Signal Score impact.

Selected-state accent color per level (border + subtle glow/fill, label always
present — never color alone): Low `son-signalCyan`, Medium `son-green`,
High `son-amber`, All-In `son-violet`.

### 3. Decision buttons

Selected-state accents: Long `son-green`, Short `son-red`, Pass `son-textSecondary`.
Unselected buttons stay neutral (`son-card` + `son-border`). Long and Short must
have identical size/weight — no visual bias toward Long.

### 4. Sparkline colors

The lookback (pre-decision) sparkline is ALWAYS `son-signalCyan`, regardless of
price direction — a trend-colored lookback editorializes the clue. The outcome
sparkline (reveal view only) may color by result: `son-green` if the price rose
over the outcome window, `son-red` if it fell.

### 5. Difficulty selector explainer copy (D011)

On `/play/classic`, each difficulty card adds one explainer line under the
bankroll: Easy → `More direct clues.` · Medium → `Balanced clues.` ·
Hard → `Less obvious company context.`

### 6. "Call locked" state (D011)

In the run page, extend the view state union with `'locked'`:
`'round' | 'locked' | 'reveal' | 'summary'`. Lock In now sets `view = 'locked'`
(after applying the round result exactly as it does today). The locked view shows,
centered on a `son-cardElevated` panel:
- Heading: `Call locked.`
- Lines: `Your call: Long` · `Confidence: Medium (40%)` · `At risk: $4,000`
  (for Pass: just `Your call: Pass` and `Nothing at risk.`)
- Button: `Reveal Result` → `view = 'reveal'`.
No timers or auto-advance; the button gates the reveal.

## Do NOT

- Touch `packages/game-engine` (no logic or test changes).
- Change any copy other than what's specified above.
- Add animation libraries or motion beyond simple CSS transitions.
- Redesign layouts — this is a restyle + two additions, not a rebuild.
- Delete or modify `requirements.txt` — it is intentional (user-requested
  prerequisites file).
- Commit or push anything (D012).
- Anything on the MVP exclusion list in `soul.md`.

## Acceptance Criteria

1. `pnpm test` — all 18 H001 tests still pass. — *run it*
2. `pnpm typecheck` and `pnpm lint` pass. — *run them*
3. Every screen uses the token palette; no `zinc-*` or `teal-*` classes remain in
   `apps/web`. — *grep `zinc-` and `teal-` under apps/web/app and components*
4. Confidence buttons show exactly two lines in the `Label (%)` / `$amount` format;
   no Signal Score impact anywhere on them. — *inspect in browser*
5. Selected confidence levels show the cyan/green/amber/violet ramp. — *click each*
6. Lookback sparkline is cyan on a scenario whose lookback trend is downward
   (e.g. round with The Streaming Pivot). — *observe*
7. Difficulty cards show the three explainer lines. — *open `/play/classic`*
8. Lock In → locked view (call/confidence/at-risk) → Reveal Result → reveal.
   Pass shows the pass variant. — *play it*
9. 375px viewport: no horizontal scroll. — *devtools*

## Verification Steps for the Implementor

`pnpm test` → `pnpm typecheck` → full playthrough of one run at 375px including a
Pass round and the locked state, plus the greps in criterion 3.

## Reporting

Set Status to `complete`, update `progress.md`, and write completion report
`agents/reports/R002_H002.md` per the template. Do NOT commit — the orchestrator
reviews and commits (D012).
