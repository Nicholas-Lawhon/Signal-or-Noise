# Phase 9 MVP QA

Run `pnpm test`, `pnpm typecheck`, `pnpm build`, both content gates, the database tests, and `pnpm --filter web test:e2e` before release.

## Responsive matrix

Check landing, mode select, Classic/Daily setup, one gameplay round, reveal, summary, leaderboards, profile, sign-in, rules, settings, and disclaimer at 320, 375, 390, 768, 1024, and 1440px. Confirm no horizontal scroll, clipped controls, obscured content, layout shift, or targets below 44px. At desktop sizes confirm readable line lengths and productive use of space. At mobile sizes confirm the bottom navigation respects safe-area insets.

## Interaction and accessibility

- Complete all public navigation and a round using keyboard only. Confirm logical focus order, visible focus, correct selection announcements, one primary heading, landmarks, retry access, and live result announcements.
- At 200% zoom, confirm content reflows and remains usable. Run an automated accessibility scan and resolve serious findings.
- Enable operating-system reduced motion. Confirm reveal and bankroll changes are immediate and no interaction waits on animation.
- Disable reveal sounds in Settings, reload, and confirm the preference persists and no result sound plays. Re-enable it and confirm only a short, restrained local sting plays after user interaction.
- Confirm charts have screen-reader summaries, pre-decision charts contain no outcome data, and win/loss/pass states use text and shape as well as color.

## Game and state coverage

- Guest: Classic setup, resume, win, loss, pass, wrong/correct/no company call, bankruptcy, complete summary, sign-in-to-save prompt, failed save, and retry.
- Signed in: saved Classic summary, profile data/empty/error, public-name editing, Daily start/resume/replay/complete, and Daily best-attempt language.
- Verify all three Classic difficulties and exact round counts/starting bankrolls. Confirm confidence buttons show only label/percentage and dollar amount.
- Verify loading, empty, unavailable, network error, stale/double-submit, and retry states without exposing technical details.
- Confirm leaderboards cover Daily, each Classic difficulty, cumulative Signal, pagination, current-user rank, public guest view, empty, loading, and error.

## Privacy and analytics

- With PostHog variables absent, confirm zero provider requests and normal gameplay.
- With public project configuration present, confirm only documented event names/properties. Verify cookieless memory persistence, `person_profiles: never`, autocapture/pageview/pageleave/session replay disabled, no `identify`, and IP capture disabled in PostHog project settings.
- Inspect payloads: never allow PII, display name, email, company guess, invite code, scenario answer, bankroll, secret-bearing URL, scenario/company identifiers, or free-form values.
- Toggle anonymous analytics off, reload, and confirm no events. Confirm Settings disclosure matches behavior.

## Cross-browser and performance

Run the public journey plus representative gameplay in current Chrome/Edge, Firefox, and Safari/iOS Safari. Check touch, date controls, audio unlock, sticky navigation, safe areas, and back/forward behavior. Use a production build to inspect mobile performance, layout shift, JavaScript growth, oversized assets, long tasks, and blocked interactions.
