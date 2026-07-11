# Growth Foundation: Private Tester Recruitment

**Status:** Optional future research plan; not required for Gate B or launch
**Research date:** 2026-07-10 (America/Chicago)
**Boundary:** No outreach, recruitment, account creation, spending, recording,
or collection of contact details is authorized by this artifact.

**Decision:** The User moved formal structured tester recruitment from a
required growth step to an optional study. Keep this plan ready for later use,
but do not block product readiness, launch, or the Growth roadmap on recruiting
the cohort or achieving its metrics.

## Goal

If activated, build a small, diverse private-beta tester pool that can answer four product
questions: can people understand the call and confidence system, is the reveal
satisfying, does the game feel fair rather than random, and do people want to
play another round or return for the Daily Challenge? The product is a game
using historical market scenarios, so testing must include people who are not
finance-oriented.

## Qualification and segment mix

Optional-study target: **32 qualified adults**, with a **16-person pilot**
before widening the pool. The minimum and target apply only if the User later
activates the study; they are not launch criteria or a promise to recruit.

| Segment | Target | Pilot minimum | Qualification signal |
|---|---:|---:|---|
| Daily-puzzle players | 8 | 4 | Played a daily puzzle at least twice in the last month. |
| Finance-curious gamers | 8 | 4 | Enjoys business/market history, prediction games, fantasy sports, or company stories; no professional finance requirement. |
| Trivia/business-history players | 8 | 4 | Plays trivia or follows company/business history; market knowledge may be low. |
| Less-finance-oriented control | 8 | 4 | Does not regularly follow markets or finance news and is not seeking investment advice. |

Quota rules: assign one primary segment, record relevant secondary interests,
and stop filling a segment when its target is reached. Keep experience spread
within each segment: casual users are more important than finance expertise.
Do not recruit children or ask for date of birth in this first cohort; use an
adult self-attestation only after the consent flow and approval in [D-06] exist.

## Screener

Use plain language and collect only the answers needed to qualify. Store a
random participant ID rather than a name in the research tracker. A “reject”
outcome is not a judgment; it means the current quota, safety boundary, or
session needs do not match this cohort.

| # | Question | Qualifying response | Reject or hold response |
|---:|---|---|---|
| 1 | Are you an adult who can participate in a short private game test? | Yes, after approved consent is shown. | No, unsure, or no consent: reject for this cohort. |
| 2 | Which best describes your recent play? | Daily puzzle, finance-curious gaming, trivia/business history, or less-finance-oriented control. | None of the four or quota full: hold/reject. |
| 3 | How often do you play quick mobile or browser games? | At least once a month. | Never or only if they are seeking financial advice: reject. |
| 4 | How interested are you in markets, companies, or business history? | Any answer is acceptable; use it to assign the segment and protect the control quota. | None by itself; do not reject low knowledge. |
| 5 | Have you used a brokerage, trading simulator, or finance app in the last year? | Any answer; record only a coarse yes/no for balance. | Do not use this answer to imply expertise or advice-seeking. |
| 6 | Can you use a phone or mobile browser for a 20–30 minute test? | Yes, with optional accessibility accommodations recorded separately. | No: hold for a later accessible protocol. |
| 7 | Are you willing to make fictional game calls and see historical outcomes, with no real-money activity? | Yes. | No or asks for investment guidance: reject. |
| 8 | Can you describe what you expected the game to do and what you found confusing? | Yes, by text or approved interview format. | No: hold for an observation-only protocol. |
| 9 | Do you work on or have a close conflict with Signal or Noise? | No conflict. | Yes or unsure: reject or escalate to the Growth Owner. |

Qualification outcome is **qualified** only when questions 1, 3, 6, 7, and 9
pass, the participant can be assigned to an open segment, and the approved
consent is recorded. Questions 4 and 5 are segmentation context, not a test of
financial literacy.

## Consent and privacy handling

Before any task, provide a short consent page that has qualified review. It must
state that participation is voluntary, the player may skip a question or stop,
there is no effect on access to the game, feedback is for product research, and
any incentive is separate from consent. If a recording or screen capture is
ever proposed, request a separate opt-in; do not infer recording consent from
test consent.

Minimum data set:

- Participant ID, segment, qualification outcome, consent version, session date,
  task completion, and structured feedback tags.
- Coarse experience bands only (for example, “rarely / sometimes / often”), not
  trading account details, financial holdings, income, precise location, or
  sensitive demographic data.
- Contact information only in a separately access-controlled scheduling list,
  only after [D-04] supplies a support/contact owner and [D-06] approves the
  collection and retention process.
- Delete or de-identify the scheduling list when the approved retention period
  ends. The Growth Owner is accountable for the tracker; the implementation
  owner and storage location must be assigned before recruitment.

Do not ask testers to share passwords, one-time codes, brokerage credentials,
private account data, or personal financial advice questions. Do not feed raw
company guesses or pre-reveal answers into public research materials.

## Recruitment channels (hypotheses, not authorization)

1. Personal puzzle/trivia networks: likely high-quality casual testers; use a
   one-to-one invitation only after approval.
2. Gaming, puzzle, trivia, and fantasy-sports communities: likely useful for
   the daily-puzzle and competitive-gamer wedges; follow each community’s rules
   and moderator expectations.
3. Finance-curious and business-history communities: likely useful for reveal
   depth and historical credibility; avoid investment-advice framing and
   never target people with promises of returns.
4. Developer/product communities: useful for usability and browser/device
   diversity, but do not let technical familiarity replace casual players.
5. Creator/community referrals: defer until the claims, support workflow,
   domain/handle choice, and outreach authority are approved.

No channel may be used until the no-outreach checklist below is complete and the
User authorizes the specific channel, copy, audience, and any incentive.

## Incentive assumptions

No amount, gift card, cash equivalent, subscription, or other incentive is
approved. The working assumption is that a small thank-you may improve response,
but the value, eligibility, tax treatment, delivery method, and budget require
User approval under [D-06]. An incentive must never depend on positive feedback,
completion of every question, or acceptance of a public claim.

## Conversion stages and definitions

Track the recruitment funnel in a restricted research tracker, not in the game’s
production analytics until a separate implementation charter exists:

1. **Reach:** person sees an approved invitation.
2. **Interest:** person follows the approved screener link or replies through an
   approved channel.
3. **Screener started:** first required screener answer is submitted.
4. **Qualified:** all mandatory questions pass and an open quota exists.
5. **Consented:** approved consent version accepted; any recording consent is
   separate.
6. **Scheduled:** a time or self-serve test window is confirmed.
7. **Activated session:** tester reaches the first pre-decision card and makes a
   first call.
8. **Completed session:** tester reaches a reveal and provides structured
   feedback.
9. **Repeat intent:** tester volunteers to play another run or return for the
   Daily Challenge; this is stated intent, not retention evidence.

Primary recruitment conversion is `qualified / screener_started`. Primary
product learning signals are first-call rate, first-reveal rate, comprehension,
reveal satisfaction, and repeat intent, segmented by the four cohorts.

## Feedback routing

Use one structured feedback form after the session, with optional free text.
Tag each observation into one or more of:

- `comprehension`: scenario, Long/Short/Pass, Confidence, Bankroll, Signal Score;
- `fairness`: clues, difficulty, outcome expectations, or scoring confusion;
- `reveal`: satisfaction, clarity, and desire for another round;
- `identity`: name, disclaimer, finance-vs-game perception;
- `accessibility`: readability, touch targets, chart comprehension, device issues;
- `support/privacy`: consent, account, sign-in, or data concerns.

Route `identity` and `support/privacy` to Growth and the User before any public
copy change. Route content/fairness observations to Content/Product. Route
implementation bugs to the future product owner; this phase does not change
Phase 9 or product code. Mark severity as `blocker`, `high`, `medium`, or
`observation`, with a reproduction note that contains no personal data.

## No-outreach execution checklist

Before any invitation or screener link is sent, confirm all items below:

- [ ] User approves the channel, audience, message, claim set, and pilot quota.
- [ ] Name/domain/handle direction is decided or the invitation avoids an
      unresolved public brand claim ([D-01], [D-02]).
- [ ] Support contact and escalation owner are available ([D-04]).
- [ ] Consent language, adult boundary, recording option, data fields, storage,
      retention, and deletion process are approved ([D-05], [D-06]).
- [ ] Incentive value, budget, eligibility, and delivery are approved ([D-06]).
- [ ] Community rules and moderator expectations are checked for every channel.
- [ ] A participant can stop without penalty, and no account credentials or
      financial information are requested.
- [ ] A named Growth Owner is responsible for the tracker and incident routing.
- [ ] Stop immediately for an allegation of advice, real-money activity, unsafe
      collection, or brand confusion; escalate rather than improvise.
