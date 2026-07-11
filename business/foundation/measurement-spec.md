# Growth Foundation: Measurement Specification

**Status:** Product policy approved; Phase 9B selected a privacy-bounded PostHog
adapter, while live configuration and final privacy review remain pending
**Research date:** 2026-07-10 (America/Chicago)
**Data owner:** Growth Owner is accountable for the measurement definition and
reporting. A Product/Engineering data steward must be named by the future
implementation charter.

## Measurement boundary

The current web product has no analytics SDK or event calls in `apps/web` or the
packages. The server already owns run identity, official status, decisions,
reveals, and scores. The measurement implementation must preserve that boundary
and must not use analytics as a second scoring system.

Observed behavior that this specification reconciles:

- The landing page links to `/play`; Classic setup links to difficulty-specific
  runs; Daily entry loads a UTC challenge and gates official play on sign-in
  ([landing](../../apps/web/app/page.tsx), [mode page](../../apps/web/app/play/page.tsx),
  [Daily entry](../../apps/web/app/play/daily/page.tsx)).
- A pre-decision payload contains scenario presentation and lookback chart only;
  answer/reveal fields are separate ([database contracts](../../packages/database/src/contracts.ts)).
- A decision is accepted by the server before the client shows the reveal; the
  run summary is terminal only after completion or bankruptcy ([run service](../../packages/database/src/runService.ts)).
- Guests use a necessary httpOnly session cookie; a completed Classic Run can
  be explicitly claimed after sign-in. Daily attempts are authenticated and
  replayable.
- Official leaderboard rows are derived from canonical finished runs; the
  client has no score-write path ([leaderboard service](../../packages/database/src/leaderboardService.ts)).

## Principles and identifiers

1. **Game first:** measure comprehension, reveals, completion, and return intent;
   do not optimize raw clicks at the expense of the game loop.
2. **Server authority:** `decision_submitted`, outcome class, and `run_finished`
   are accepted or enriched server-side. Client events may describe intent or
   view state but cannot declare official scores.
3. **Minimum data:** use a random first-party `anonymous_session_id` and an
   internal opaque `account_key` only where necessary. Never send the guest
   cookie value, email address, Clerk external ID, IP address, precise location,
   or raw public display name to analytics.
4. **Content integrity:** before a decision, never send `scenario_id`, company
   name, ticker, end price, actual return, reveal text, outcome-chart data, or
   any field that could disclose the answer. Do not send free-text company
   guesses at any time; send only `company_guess_present` and, after reveal,
   an aggregate correctness flag if the approved data policy permits it.
5. **Choice separation:** necessary auth, guest-session, gameplay, and score
   storage are separate from optional analytics. Under approved [D-03], analytics
   may be enabled by default for the US launch only after the notice and provider
   controls are ready, and every user receives a clear opt-out. A legal/regional
   review may require stricter treatment.

Every event must have `schema_version`, `event_id`, a server-normalized
`occurred_at`, `surface: "web"`, and the applicable `analytics_choice_state`.
Events are deduplicated by `event_id`; retries must not create duplicate funnel
steps, and opted-out users send no optional events.

## Canonical events

All rows below are proposed names for a future implementation charter. None are
currently live.

| Event | Trigger and authority | Allowed properties | Prohibited or deferred data |
|---|---|---|---|
| `analytics_choice_changed` | The local preference layer records an opt-out or later opt-in. | `choice` (`enabled`, `disabled`), `notice_version`, `surface`; record locally before changing provider state. | No provider should receive the disabling event or any later optional event. |
| `page_viewed` | Approved page view on landing, play, Daily, leaderboard, profile, sign-in, or future acquisition pages. | `route`, `referrer_domain`, sanitized UTM fields, `platform_bucket` (`web_mobile`, `web_desktop`), `is_returning_session`. | Full URL/query string, email, IP, precise device fingerprint. |
| `mode_viewed` | `/play` mode selection is visible. | `available_modes` (`classic`, `daily`), `signed_in_state`. | No hidden future modes or account identifiers. |
| `classic_setup_viewed` | Classic difficulty screen is visible. | `resume_available`, `signed_in_state`. | No run ID or scenario data. |
| `classic_run_started` | Server creates a Classic Run. | `mode`, `difficulty`, `total_rounds`, `owner_type` (`guest`, `account`), `is_official`. | Starting bankroll exact value in client analytics; use a pre-approved bucket if needed. |
| `daily_challenge_viewed` | Daily page has loaded a challenge overview or gate. | `challenge_date`, `total_rounds`, `is_signed_in`, `has_active_attempt`, `completed_attempt_count_bucket`. | Scenario order, scenario IDs, answer data. |
| `daily_attempt_started` | Server creates or resumes an authenticated Daily attempt. | `mode`, `challenge_date`, `total_rounds`, `is_replay`, `is_resume`. | User email, scenario order, hidden company data. |
| `round_viewed` | A pre-decision card is visible. | `mode`, `difficulty`, `round_index`, `total_rounds`, `is_daily`. | `scenario_id`, title text, chart points, answer/reveal fields, or free text. |
| `decision_submitted` | Server accepts one round decision. | `mode`, `difficulty`, `round_index`, `action`, `confidence` or `null`, `company_guess_present`, `is_daily`, `owner_type`. | Raw guess, scenario ID, actual return, outcome, company, ticker, bankroll exact value. |
| `decision_error_shown` | A decision request fails or is rejected. | `surface`, `error_code`, `http_status_class`, `retryable`. | Stack traces, request body, run ID in client payloads, personal data. |
| `reveal_viewed` | Reveal screen becomes visible after a successful accepted decision. | `mode`, `round_index`, `action`, `confidence`, `outcome_class` (`correct`, `wrong`, `pass`), `company_guess_present`, `bankrupt_after_round`. | Company name, ticker, exact price/return, reveal text, outcome chart, raw P&L. |
| `round_advanced` | Player selects Next Round or See Summary. | `mode`, `round_index`, `destination` (`next_round`, `summary`). | Reveal content. |
| `run_finished` | Server marks a run `completed` or `bankrupt`. | `mode`, `difficulty`, `status`, `is_official`, `total_rounds`, `completed_rounds`, `correct_calls`, `wrong_calls`, `passes`, `completion_time_bucket`. | Scenario-level outcome list, company names, exact returns, exact bankroll if not needed by an approved report. |
| `guest_save_prompt_viewed` | A claimable guest summary shows the Save this run card. | `mode`, `status`, `claimable`, `signed_in_state`. | Run ID, scores, company details. |
| `guest_save_started` | Player clicks Save this run or begins the claim flow. | `mode`, `status`, `signed_in_state`. | Email, redirect URL, run ID in client analytics. |
| `auth_started` | Approved sign-in or sign-up surface is opened. | `surface`, `reason` (`daily_gate`, `save_run`, `header`, `profile`). | Email, provider user ID, OTP/code, redirect query. |
| `auth_completed` | Verified session returns to the app. | `surface`, `reason`, `redirect_success`. | Email, external auth ID, raw URL. |
| `guest_run_claimed` | Server completes the one-time Classic guest claim. | `mode`, `status`, `is_official_after_claim`. | Guest cookie, account ID in client event, score detail. |
| `leaderboard_viewed` | A leaderboard selection loads successfully. | `board` (`daily`, `classic`, `signal`), `difficulty` when applicable, `challenge_date` when applicable, `page`. | Other players’ identifiers beyond the public display already rendered; no private account data. |
| `profile_viewed` | Signed-in profile loads or guest sign-in prompt is visible. | `signed_in_state`, `has_saved_stats`. | Email, private identity, exact run list. |
| `public_display_name_saved` | Server accepts a public display-name update. | `result` (`saved`, `cleared`, `conflict`, `invalid`). | Raw name, error text containing user input. |
| `product_error_shown` | A user-facing non-decision error is visible. | `surface`, stable `error_code`, `retryable`. | Stack, request body, user input, hidden product data. |

`outcome_class` is permitted only after the reveal is visible and should be
server-derived. Exact company, return, and outcome-chart fields remain in the
official gameplay response boundary; they are not analytics properties.

## Funnel definitions

| Funnel | Definition | Primary owner and cadence |
|---|---|---|
| Acquisition | Tagged or organic `page_viewed` → `mode_viewed` → `classic_setup_viewed` or `daily_challenge_viewed` → `classic_run_started` or signed-in `daily_attempt_started`. Report by sanitized first-touch and last-touch channel. | Growth Owner; weekly during beta, daily during an approved launch window. |
| Activation | A unique session reaches `classic_run_started`/`daily_attempt_started`, then one accepted `decision_submitted`, then `reveal_viewed`. Activation means first reveal, not first page view. | Growth Owner + Product; weekly. |
| First-run completion | Activated run reaches server-authoritative `run_finished` with `completed` or `bankrupt`; report completion separately from bankruptcy. | Product owner; weekly. |
| Scoring comprehension | Research instrument asks the tester to explain action, Confidence, Bankroll, Signal Score, and Pass after a run; production events supply behavior but do not infer understanding. | Growth Owner + research owner; per study, summarized weekly. |
| Daily habit | `daily_challenge_viewed` → `daily_attempt_started` → Daily `run_finished`; a replay is a separate attempt, while the official board uses the server’s best completed attempt. | Growth Owner; daily operational view, weekly cohort view. |
| Account conversion | Guest Classic `run_finished` → `guest_save_prompt_viewed` → `guest_save_started` → `auth_completed` → `guest_run_claimed`. Daily sign-in conversion is `daily_challenge_viewed` while signed out → `auth_started` → `auth_completed` → `daily_attempt_started`. | Growth Owner; weekly. |
| Retention | For each first completed/activated player date, a later consented `page_viewed`, `daily_challenge_viewed`, or run-start event on D1, D7, and D30. Report by first mode and source, not by email or raw identity. | Growth Owner; weekly cohort review. |
| Engagement and sharing | Current product has no share action. Capture repeat intent in the tester instrument; add `share_card_viewed`/`share_clicked` only with a future feature charter. | Growth Owner; research cadence now, product cadence later. |
| Revenue | No current paywall, Premium Unlock, or paid pack exists. Paywall comprehension and willingness to pay are research questions for a later stage; do not invent conversion events now. | User + Growth; Stage 2/launch charter. |

## Attribution requirements

Capture only while analytics is live under D-03 and the user has not opted out:

- First-touch and last-touch `utm_source`, `utm_medium`, `utm_campaign`,
  `utm_content`, and `utm_term`, each normalized to a short allowlisted value.
- Coarse `referrer_domain`, landing route, and `platform_bucket`.
- A campaign/creative key that is stable across tagged links, never the full
  destination URL or a personal referral token.
- A random first-party session identifier. Do not fingerprint a device or join
  an anonymous session to an account by email.

Channel response means a qualified consented session that reaches the agreed
  funnel stage (first reveal, first-run completion, or tester screener start),
not an impression or click alone. Each future channel must use a tagged link and
an approved claims set; no tagged campaign is authorized in this phase.

## Consent, privacy, and retention requirements

These are approved product requirements, not a legal conclusion:

- Necessary gameplay, authentication, the httpOnly `son_guest_session` cookie,
  database scores, and public leaderboard operation remain available only as
  product functionality requires. Never transmit the cookie value to analytics.
- For the initial US/English launch, optional analytics may be enabled by
  default only after the purpose notice, visible opt-out, PostHog/D053 provider
  controls, deletion path, and accountable owners are ready. A user who opts out
  sends no optional event. Do not extend this default to another region without
  its required review.
- Do not collect names, emails, precise location, contact lists, financial
  holdings, brokerage data, raw company guesses, raw scenario text, or
  pre-reveal answer data for growth measurement.
- Retain raw events for no more than 90 days and justified aggregate cohort
  results for no more than 12 months, then delete them unless the User approves
  a revised policy after privacy review.
- A data dictionary and access list must name the Growth Owner as accountable,
  the Product/Engineering steward, the support/legal reviewer, and the people
  allowed to view raw events. Raw event access is not needed for tester
  recruitment volunteers.
- Provide a correction/deletion route for any optional analytics identifier;
  document how a withdrawal stops future collection and breaks the anonymous
  link without altering the official game record.

## Stage metric coverage matrix

“Current” means the product exposes a behavior that can be instrumented; “new”
means a future event or research instrument is required. Nothing below implies
that instrumentation is already present.

| Roadmap metric | Coverage source | Required properties/instrument | Stage/status |
|---|---|---|---|
| Qualified tester pool | Restricted tester tracker | Segment, qualification outcome, consent version, participant ID | Stage 1; research tracker, not production analytics. |
| Recruitment conversion | Tester tracker | `screener_started`, `qualified`, `consented`, `scheduled` counts | Stage 1; new research instrument. |
| Channel response | `page_viewed`, run-start events, tester tracker | Sanitized UTM fields, referrer domain, first reveal, screener start | Stage 1; event plus tracker. |
| Landing-page intent signals | `page_viewed` route `/`, `mode_viewed`, setup views, run starts | Route, source, mode, signed-in state | Stage 1; new event. |
| Measurement coverage | Schema QA and weekly reconciliation | Event dictionary version, missing-event rate, server/client count reconciliation | Stage 1; implementation QA. |
| Landing-to-play/install intent | Landing and run-start events plus tester question | `page_viewed`, run start, platform bucket, stated install intent | Stage 2; web behavior current, install intent research/new. |
| Onboarding completion | No onboarding flow is present | Future `onboarding_started`/`onboarding_completed` or remove metric if no onboarding | Stage 2; future product charter. |
| First decision | `decision_submitted` | Mode, difficulty, round index, action, confidence, no answer data | Stage 2; new event. |
| First reveal | `reveal_viewed` | Round index, outcome class after reveal | Stage 2; new event. |
| First-run completion | `run_finished` | Status, rounds, correct/wrong/pass counts, completion bucket | Stage 2; new server-authoritative event. |
| Scoring comprehension | Tester instrument | Explain action, Confidence, Bankroll, Signal Score, Pass; unambiguous correct/unclear rubric | Stage 2; research instrument. |
| Daily completion | Daily `run_finished` | Mode, challenge date, status, completed rounds, replay/resume flags | Stage 2; new event. |
| Account conversion | Auth and claim events | Reason, signed-in state, claim result; no email | Stage 2; new event. |
| D1/D7 return | `page_viewed`, Daily view, run starts | Cohort date, return interval, first mode/source | Stage 2; cohort logic. |
| Share intent/use | Tester question now; future share events | Stated intent now; actual share event only when feature exists | Stage 2; research now, product later. |
| Paywall comprehension | Private-beta research only | Concept shown, comprehension, confusion, no billing event | Stage 2; no current paywall. |
| Willingness to pay | Approved private-beta survey | Price concept, free/premium boundary, opt-in response; no purchase | Stage 2; research only; price remains unresolved. |

## Reporting and QA

- **Weekly foundation/beta review:** Growth Owner reviews acquisition-to-first-
  reveal funnel, completion, Daily completion, account conversion, D1/D7/D30
  cohorts when available, tester feedback, and event coverage.
- **Daily launch review:** only after a separate launch charter; monitor qualified
  traffic, first reveal, completion, errors, auth/claim failures, and support
  volume. Do not scale spend from clicks alone.
- **Monthly decision review:** once a trustworthy baseline exists, compare channel
  and cohort quality and decide which experiment needs a product charter.
- **QA gates:** validate event schemas in development, assert no prohibited keys
  on pre-reveal events, deduplicate retries, compare accepted server decisions to
  `decision_submitted`, compare terminal runs to `run_finished`, and verify
  denied-consent sessions send no optional event.
