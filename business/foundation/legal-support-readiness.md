# Growth Foundation: Legal and Support Readiness

**Status:** Internal requirements checklist; no row is legal approval
**Research date:** 2026-07-10 (America/Chicago)
**Boundary:** This artifact identifies inputs, owners, approval authority, and
milestones. It does not draft counsel-approved policies, configure a live
provider, create a support address, publish a page, or authorize billing.

**User decisions recorded 2026-07-10:** public-brand selection remains open;
the repository and internal technical identifiers remain unchanged during name
exploration. Privacy-bounded PostHog analytics may be enabled by default with a
clear opt-out after required notices/review. The support and legal/entity
directions below are approved but await the brand/domain and external inputs.
Structured tester recruitment is optional, not a Gate B or launch prerequisite.
The initial private beta and public launch target the United States in English.

## Readiness checklist

| Area | Current status | Required input or next artifact | Owner | Approval authority | Required by |
|---|---|---|---|---|---|
| Entertainment / financial-advice disclaimer | The locked disclaimer is rendered on the current landing page ([source](../../apps/web/app/page.tsx)). Surface coverage beyond the landing page is not complete. | Confirm the exact disclaimer on every public acquisition, play, support, and store surface; do not shorten it into a financial claim. | Growth Owner + Product | User and qualified legal reviewer; product copy owner implements after approval | Before public beta and store submission |
| Privacy notice | No product privacy page or data-inventory surface exists in the current web app. | Legal/privacy review of account, guest cookie, leaderboard identity, tester research, support, and future analytics data; publish a policy through a separate charter. | User + Growth Owner | Qualified privacy/legal reviewer and User | Before optional analytics, tester contact collection, private beta, or store submission |
| Analytics consent and data minimization | Phase 9B selected a privacy-bounded PostHog adapter; live configuration remains separate. The User approved enabled-by-default analytics with a clear opt-out, 90-day raw retention, 12-month aggregate retention, Growth ownership, and a Product/Engineering steward. | Reconcile the final notice and opt-out behavior with qualified privacy review; preserve D053 controls: cookieless typed events, no identify/autocapture/session replay, and no PII, answer data, free text, or IP capture. | Growth Owner + Product/Engineering steward | User approved product policy; qualified privacy/legal review confirms implementation | Before live configuration |
| Terms of use | No terms page exists. | Entity/name, acceptable-use rules, game/service availability, account and leaderboard rules, disclaimers, governing-law input, and review. | User + Growth Owner | Qualified legal reviewer and User | Before private beta / public access expansion |
| Support contact | Approved direction, pending brand/domain: `support@<chosen-domain>`, User as initial accountable owner, two-business-day ordinary response target, and one-business-day target for privacy, billing, account-access, or security reports. | Register the chosen domain, create the monitored inbox, document escalation and abuse/leaderboard-name handling, and publish the support route. | User + Growth Owner | User | Before any public support promise or public launch |
| Refund handling | No Premium Unlock, checkout, or paid pack is live; no refund promise should be made. | Later document web/store purchase channel, price, entitlement, restore path, refund authority, regional rights, and support workflow. | User + Growth + future billing owner | User and qualified legal/store review | Before billing configuration or store submission |
| Store disclosures | iOS/Android listings and store accounts are not in this phase. | App/store names, privacy labels, age/content rating, support/privacy/terms URLs, screenshots, purchase disclosures, and platform-specific review answers. | Growth Owner + mobile owner | User, qualified legal review, and each store’s review process | Gate B / store submission |
| Brand and trademark | [brand-screening.md](brand-screening.md) is preliminary research. The preferred `.com` and several exact handles are occupied; related marks were visible in USPTO search. | Qualified exact/similar-mark clearance in intended jurisdictions/classes and a User decision on the name/domain/handle set under [D-01] and [D-02]. | Growth Owner records; User directs | User + qualified trademark reviewer | Before public brand lock, registration, or launch claims |
| Optional structured tester research | [tester-recruitment.md](tester-recruitment.md) is retained as an optional no-outreach plan. A formal recruited cohort is not required for Gate B or launch. | Only if activated: approve consent language, adult boundary, recording choice, tracker access, deletion period, incentive, and participant support. | Growth Owner | User and qualified privacy/research reviewer | Before any optional screener or invitation; otherwise not a gate |
| Age and safety boundary | The current game has no child-specific testing workflow or public age claim. | Decide age boundary, age-rating language, child/teen handling, and safety escalation before store or public recruitment. | User + Growth + mobile owner | User and qualified legal/store review | Before tester outreach and store submission |
| Public leaderboard identity | Current leaderboards show generated aliases or optional public display names; support for disputes and abuse is not documented. | Define moderation, name-change, impersonation, report, deletion, and support handling without exposing private account data. | Growth Owner + Product | User; qualified privacy/legal review as needed | Before public leaderboard promotion |
| Claims and positioning | Current product copy is entertainment-first; no clearance or investment-performance claim is approved. | Apply the guardrails in [positioning.md](positioning.md) to every future channel, page, and creator brief. | Growth Owner | User for new public claims; qualified legal review for sensitive copy | Before any publication |

## Decision register

All five foundation artifacts reference these IDs instead of repeating approval
tables. Approved direction does not mean an external account, legal review,
domain, policy, or launch action has already occurred.

| ID | Decision | Current state | Decision owner | Approval authority | Required by / stop condition |
|---|---|---|---|---|---|
| D-01 | Select and clear the public product name. | **Open.** Keep Signal or Noise? as the internal working name while brainstorming and screening distinctive alternatives in [name-exploration.md](name-exploration.md). Do not edit `soul.md` or publicly lock a name until the User selects it and qualified clearance is complete. | User | User + qualified trademark reviewer | First Growth Gate B decision; before public brand lock or registration. |
| D-02 | Choose a primary domain and distinct social-handle set. | **Blocked by D-01.** If the current name survives clearance, the User prefers a distinct `play...` domain/handle pattern rather than pursuing the occupied exact `.com`. Recheck availability before registration. | User + Growth Owner | User | Immediately after D-01; before account creation or public assets. |
| D-03 | Analytics purpose, consent, provider, identifiers, retention, and ownership. | **Approved direction.** PostHog/D053; enabled by default with clear opt-out; 90-day raw and 12-month aggregate retention; Growth data owner and Product/Engineering steward; strict no-PII/content-integrity controls. Regional/legal review may require stricter treatment. | User + Growth Owner | User approved; qualified privacy/legal reviewer confirms final notice and regional treatment | Before live configuration. |
| D-04 | Support contact and workflow owner. | **Approved direction, pending D-01/D-02.** Use `support@<chosen-domain>`; User initially owns it; two business days ordinary and one business day for privacy/billing/account/security. | User | User | Create after domain registration; required before public launch/support claims. |
| D-05 | Legal entity, privacy, terms, disclaimer review, refunds, and store disclosures. | **Approved direction, external work pending.** Obtain qualified privacy/terms review before live analytics or personal-data collection; choose a counsel/CPA-recommended entity before billing/store submission; use store-native mobile refund handling and define web refunds with the merchant provider. | User | User + qualified legal/privacy/store/tax review | Policies before live analytics/public launch; entity/refunds before billing/store submission. |
| D-06 | Structured tester recruitment protocol. | **Optional.** The formal recruited cohort is not required for Gate B or launch. The existing plan is available if the User later authorizes a study; no participant data, outreach, recording, or incentive is currently authorized. | User + Growth Owner | User + qualified privacy/research reviewer if activated | No current gate; approvals required only before optional research. |
| D-07 | Launch countries and localization scope. | **Approved direction.** United States and English only for the initial private beta and public launch. Canada, the UK, and Australia are a later English-language expansion after regional policy review. No public date is selected. | User + Growth Owner | User | Apply to store/campaign planning; revisit before expansion. |

## Required handling rules

- The current landing disclaimer is product copy, not legal approval. Do not
  describe it as a legal clearance, safe-harbor, or compliance result.
- Do not publish a privacy notice, terms, refund policy, support address, store
  disclosure, or trademark conclusion from this checklist without the owners and
  approval authorities above.
- Do not collect optional tester contact details merely because the recruitment
  plan names a field. Live analytics must follow D-03, the published notice, and
  the opt-out state.
- Route any user complaint about advice, real-money activity, impersonation,
  privacy, deletion, or a leaderboard identity through the approved support
  workflow once [D-04] exists; escalate before replying with a new claim.
- Recheck current sources immediately before any later public action. Registry,
  platform, policy, and legal states can change after this dated screen.
