# Phase 10 — First Playtest Repairs Closeout

**Status:** accepted/complete

## Delivered

- Removed the redundant Classic `Call locked` / `Reveal Result` screen. A
  successful server submission now transitions directly to the reveal; the
  existing submitting guard, conflict resync, server scoring, and reveal
  boundary remain intact.
- Added conservative UTF-8/Windows-1252 mojibake repair at the content and API
  UI boundary, with focused nested-text regression tests and browser coverage
  for both pre-decision and reveal copy. Stored Gate 2 judge evidence was
  preserved; 120 payload hashes were refreshed for the encoding-only source
  corrections.
- Made sound and analytics preference keys typed and stable, and gave switches
  stable accessible names, labelled descriptions, and checked-state behavior.
- Added concise guest Classic guidance explaining unofficial device-local
  results and what signing in enables. Empty Daily, Classic, and Signal boards
  now have contextual copy and a play CTA without synthetic rows.
- Added a keyboard-usable skip link targeting a focusable `main#main-content`
  on every app route, plus a compact mobile Rules/Settings utility row outside
  the four-item primary navigation. Added mobile-safe summary spacing.
- Added focused Playwright coverage for guest copy, empty boards, skip focus,
  stable preferences, direct reveal, Unicode normalization, and mobile layout.

## Verification

- `pnpm test` — pass: game engine 61, content 79, database 42, web 26.
- `pnpm typecheck` — pass; `pnpm --filter web lint` — pass; web production build — pass.
- Content validate and Gate 2 check — 0 errors, 40 existing non-blocking
  warnings, 0 missing variants.
- `pnpm --filter web test:e2e` — 24 passed across Chromium and mobile WebKit.
- Interactive in-app browser QA at approximately 375px confirmed landing,
  mode selection, Classic guest entry, Settings, an empty Daily leaderboard,
  a real Classic decision/reveal, no horizontal overflow, no bottom-nav
  obstruction, Unicode rendering, and skip-link focus.

## Deferred action

The shorter landing-to-first-decision funnel remains deferred until more
behavioral playtest data is available. It was not implemented in this phase.
