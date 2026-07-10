# Phase 6 Consultant Memo — Auth Provider and Guest Continuity

**Status:** approved
**Approved by:** user
**Date:** 2026-07-10

## Decision

- Use Clerk's Hobby tier for Phase 6 authentication.
- Offer optional email-code and Google sign-in through Clerk's prebuilt UI,
  themed to the existing game surface.
- Keep Neon/Prisma as the product database. Store Clerk's user ID only in
  `User.externalAuthId`; do not mirror Clerk sessions or credentials locally.
- Keep anonymous play frictionless through the existing client-held guest UUID.
- On the completed Classic Run summary, offer **Save this run**. Signing up or
  signing in from that prompt may claim that one guest run, save its stats, and
  make it eligible for the future Classic leaderboard.
- Do not claim an in-progress run merely because auth state changes. The player
  explicitly claims it after completion, or starts the next run authenticated.

## Why Clerk

Clerk has first-class Next.js App Router support, including server helpers,
middleware, route handlers, and prebuilt account UI. Its current free Hobby
tier includes up to 50,000 monthly retained users per app, which is ample for
the MVP. It also avoids introducing a second product database or building and
operating session storage inside Neon.

The integration must stay behind a small server-only identity boundary so the
game and database services receive an internal user ID rather than importing
Clerk throughout the codebase. This preserves a practical provider-exit path.

## Alternatives Considered

| Option | Tradeoff | Recommendation |
|---|---|---|
| Clerk | Fastest App Router integration and polished optional-login UI; hosted-provider dependency | Use for MVP |
| Auth.js | More control and no auth-platform usage fee, but adds provider, adapter, session, email, and account-linking work to this phase | Revisit if provider control becomes more important than speed |
| Supabase Auth | Capable SSR auth and generous free MAU quota, but adds a second hosted data project beside Neon and more cookie/client plumbing | Do not add for the current stack |

## Security and Product Constraints

- Server operations derive authenticated identity only from Clerk's verified
  server session. Never accept `userId`, `externalAuthId`, or official status
  from request data.
- Public gameplay stays public. Login gates saved stats and future official
  leaderboard eligibility, not access to Classic Run.
- Guests remain unofficial until a completed Classic Run is explicitly claimed.
- A claim must run in one transaction, verify the Clerk session and matching
  guest-session cookie, require an unclaimed completed Classic Run, attach its
  decisions to the internal user, mark it official, and refresh saved stats.
- A completed run can be claimed once. A user cannot supply either the guest ID
  or user ID in request data to claim someone else's result.
- Phase 6 records future leaderboard eligibility but does not publish an entry;
  the Phase 7 leaderboard flow will consume the claimed official run.
- Daily Challenge requires a verified account before a run is created. Guests
  cannot play it unofficially. Authenticated users may replay freely; all attempts
  are immutable and the future leaderboard uses their best completed result for
  the date.
- Phase 6 does not expose a public leaderboard or implement Daily Challenge.
- Clerk secrets remain local environment values and are never committed.

## Player Sign-up Flow

1. The player finishes a Classic Run as a guest and sees the normal summary.
2. The summary shows **Save this run** with concise benefits: keep the score and
   stats, qualify for the future leaderboard, and unlock future profile features.
3. The button opens Clerk sign-up/sign-in with email code and Google options.
4. After Clerk verifies the session, the server performs the one-time claim.
5. Success returns to the same summary, now showing the saved account state. If
   auth or claiming fails, the guest result remains intact and can be retried.

## Clerk Project Setup

1. Create a Clerk account and a **Signal or Noise?** application on the Hobby
   tier.
2. Enable email-code and Google sign-in. Do not enable paid features for Phase 6.
3. Copy the publishable and secret keys from Clerk's API Keys page into
   `apps/web/.env.local` using the Next.js variable names documented by the root
   `.env.example`. Next.js loads environment files from the web app directory in
   this monorepo.
4. Never paste the secret key into source control, a commit, or this chat.
5. The Phase Owner will configure local redirect URLs and test-mode users; any
   production-domain configuration remains a separate deployment action.

## Revisit Triggers

Revisit Clerk if pricing exceeds the free tier, hosted-auth availability becomes
a product risk, required UI cannot meet the game experience, or data-residency/
compliance needs exceed the Hobby plan.

## Official Sources

- [Clerk Next.js App Router quickstart](https://clerk.com/docs/nextjs/getting-started/quickstart)
- [Clerk Next.js SDK reference](https://clerk.com/docs/reference/nextjs/overview)
- [Clerk pricing](https://clerk.com/pricing)
- [Auth.js](https://authjs.dev/)
- [Supabase Auth for Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs)
- [Supabase Auth MAU pricing](https://supabase.com/docs/guides/platform/manage-your-usage/monthly-active-users)
