# Phase 9B — MVP Polish and Analytics

**Status:** approved
**Risk:** normal
**Owner:** GPT 5.6 Sol at Medium reasoning in a dedicated Codex task
**Branch/worktree:** `codex/phase-9b-polish-analytics` / `C:\Repos\Signal_Or_Noise-p9b-sol`

## Outcome

Turn the functional MVP into a cohesive, premium, mobile-first game across the
existing public journey, with responsive desktop enhancement, satisfying reveal
motion/sound, accessible resilient interaction, privacy-bounded analytics, and a
repeatable beta QA gate.

## Starting Context

- `soul.md`, Phase 9 in `roadmap.md`, and `progress.md`.
- `docs/design/DESIGN.md`, `docs/design/03_component_inventory.md`, and
  `docs/design/07_interaction_and_motion_spec.md` are the canonical UI baseline;
  D010 and newer `soul.md` rules override older contradictions.
- Start source discovery at `apps/web/app/`, `apps/web/components/`, and the web
  package scripts/tests. Do not preload legacy reports.

## Delegated Authority

- Rework reversible web layout/component/CSS structure, typography, local visual
  and audio assets, and browser/unit test tooling within the locked identity.
- Own shared shell, navigation, `/play` mode selection, global styling, reusable
  primitives, existing Classic/Daily UI, and PostHog instrumentation.
- Add dependencies only when justified by acceptance, preferring CSS/Web APIs and
  lightweight SVG/audio. Repair in-scope regressions through final verification.

## Stop Conditions

- A change affects scoring, server trust, auth policy, database schema, content
  truth, or another locked product rule.
- PostHog requires credentials beyond public project configuration, provider
  settings cannot meet D053, or deployment/push/spend is required.
- Work requires editing 9A feature-local files before integration.

## Exclusions

- Portfolio/Friend Battle domain logic, persistence, APIs, or feature-local UI.
- New scoring/content/auth/database behavior, monetization, sharing delivery,
  private leagues, native app work, deployment, or production configuration.

## Acceptance Criteria

1. A reusable visual system and responsive app shell deliver deliberate type,
   spacing, focus, safe-area behavior, mobile navigation, desktop navigation, and
   a restrained signal/noise motif without fintech/casino styling.
2. Landing, mode selection, Classic/Daily setup, auth, leaderboards, profile,
   gameplay, reveal, summary, bankruptcy, guest-save, and all loading/empty/error/
   retry states share clear hierarchy and work at 320–1440px.
3. Desktop gameplay uses available width for scenario and decision context while
   mobile preserves the fast read/call/confidence/lock loop and 44px targets.
4. Reveal uses a short signal-to-clarity transition, accessible win/loss/pass
   treatment, bankroll count-up, and restrained local sound sting; sound preference
   persists and every animation has a reduced-motion equivalent.
5. Charts remain lightweight and leakage-safe, add useful visual context and text
   summaries, have correct accessible treatment, and never rely on red/green alone.
6. `/rules`, `/settings`, and `/disclaimer` are complete, linked from navigation/
   footer, and accurately describe all locked MVP modes and legal positioning.
7. Keyboard flow, visible focus, semantic selection state, headings/landmarks,
   live announcements, contrast, chart alternatives, zoom, and reduced motion pass
   an accessibility audit with no serious automated findings.
8. PostHog is optional-by-configuration and uses explicit typed events only with
   cookieless mode, IP capture disabled by provider setting, and autocapture,
   session replay, and `identify()` off. No PII, company guess, invite code,
   scenario answer, bankroll amount, URL secret, or free-form property is sent.
9. Instrument the documented core funnel plus Portfolio Draft/Friend Battle event
   names through a tested provider adapter; missing environment configuration is
   a clean no-op and analytics disclosure/preferences are accurate.
10. Performance work prevents material layout shift and excessive client/bundle
    growth; production build passes and the audited mobile interaction remains
    smooth without blocking animations or oversized assets.
11. Add browser smoke coverage for public navigation, setup/gating, rules/legal,
    leaderboard/profile states, and representative gameplay states, plus
    `docs/phase_9_mvp_qa.md` covering sizes, keyboard, preferences, auth states,
    failures, win/loss/pass/bankruptcy, privacy, and cross-browser manual checks.
12. Existing monorepo behavior and locked game/content rules remain unchanged.
    Reusable primitives can absorb 9A screens; after branch integration the owner
    may receive one focused visual-integration repair against this same charter.

## Final Verification

```powershell
pnpm test
pnpm typecheck
pnpm build
pnpm --filter @signal-or-noise/content validate
pnpm --filter @signal-or-noise/content gate2 -- check
pnpm --filter @signal-or-noise/database test
pnpm --filter web test:e2e
```

Run the QA checklist in the browser at 320, 375, 390, 768, 1024, and 1440px,
including keyboard-only, reduced-motion, sound-off, guest, and signed-in paths.

## Closeout

When all track criteria pass, update `progress.md` track state and write
`agents/phase-closeouts/P09B_polish_analytics.md` in 500 words or fewer. Do not
create internal handoffs/reports, commit, merge, push, or edit 9A feature files.
