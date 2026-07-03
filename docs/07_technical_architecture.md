# 07 Technical Architecture — Signal or Noise?

## Architecture Goals

The architecture should support:

- Mobile-first web app
- Future Expo mobile app
- Shared TypeScript game logic
- Scenario seed generation and validation
- PostgreSQL persistence
- Optional auth
- Guest play
- Leaderboards
- Daily challenge mode
- Future paid content packs
- Agentic coding workflows

## Recommended Stack

### Web App

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui or custom component system
- Framer Motion for animations
- Recharts, Lightweight Charts, or another simple charting library

### Mobile App Later

- Expo
- React Native
- Shared TypeScript packages with web

### Backend

- Next.js API routes or server actions for MVP
- PostgreSQL
- Prisma ORM

### Auth

Options:

- Clerk
- Supabase Auth
- Auth.js

Recommended initial direction:

```text
Use the option that minimizes implementation complexity and cost during MVP.
```

Clerk has strong developer experience. Supabase Auth may be cheaper and pairs naturally with Supabase database. Auth.js gives more control but more setup.

### Hosting

Options:

- Vercel for web
- Supabase or Neon for Postgres
- Expo/EAS later for mobile app builds

## Cost Notes

Provider prices change, so verify before production.

As of July 2026 planning research:

- Vercel lists Hobby at $0/month and Pro at $20/month.
- Supabase lists Pro at $25/month.
- Clerk lists free usage up to 50,000 monthly retained users and Pro starting at $20/month.
- Neon lists a free tier and usage-based Launch examples around $15/month typical spend.

Planning recommendation:

```text
Prototype on free tiers when possible.
Avoid paid add-ons until the game loop is validated.
Use provider abstraction where reasonable to prevent lock-in.
```

## Recommended Monorepo Structure

Because the web app should lead into an Expo mobile app, use a monorepo from the start.

```text
signal-or-noise/
  apps/
    web/
      app/
      components/
      lib/
      public/
      package.json

    mobile/
      # created later with Expo

  packages/
    game-engine/
      src/
        scoring.ts
        confidence.ts
        run.ts
        daily-challenge.ts
        types.ts
      package.json

    content/
      scenarios/
        draft/
        reviewed/
        active/
      schemas/
      scripts/
      package.json

    database/
      prisma/
        schema.prisma
        migrations/
      src/
      package.json

    shared-types/
      src/
      package.json

    ui/
      # optional later if sharing UI patterns

  docs/
    01_product_overview.md
    02_game_design_doc.md
    03_business_plan.md
    04_mvp_scope.md
    05_user_stories.md
    06_data_model.md
    07_technical_architecture.md
    08_ui_ux_direction.md
    09_content_and_round_creation.md
    10_agentic_coding_handoff.md

  .env.example
  package.json
  pnpm-workspace.yaml
  README.md
```

## Package Responsibilities

### apps/web

Owns:

- Next.js routes
- Screens/pages
- Server actions/API routes
- Web-specific UI
- Auth integration
- Leaderboard views
- Profile views

### apps/mobile

Created after web prototype.

Owns:

- Expo app shell
- Native navigation
- Native mobile interactions
- Push notifications later
- Mobile-specific UI

### packages/game-engine

Owns pure logic:

- Confidence config
- Bankroll scoring
- Signal Score
- Run state transitions
- Bankruptcy logic
- Daily challenge eligibility helpers
- Tiebreaker logic
- Type-safe game constants

This package should have no database or UI dependencies.

### packages/content

Owns content pipeline:

- Scenario JSON files
- JSON schema
- Validation scripts
- Import scripts
- AI generation prompt templates
- Review metadata

### packages/database

Owns:

- Prisma schema
- DB client wrapper
- Migrations
- Seed scripts
- Scenario import logic

### packages/shared-types

Owns shared interfaces that do not belong specifically to game-engine.

### packages/ui

Optional. Add only if sharing web/mobile UI becomes worthwhile.

## Suggested Initial Commands

The coding agent can refine these, but a likely setup is:

```bash
pnpm create next-app apps/web --ts --tailwind --eslint --app
pnpm init
pnpm add -D typescript prettier eslint
pnpm add zod
pnpm add -D vitest
pnpm add prisma @prisma/client
```

For a more controlled monorepo, initialize manually rather than relying entirely on create-next-app.

## Environment Variables

Expected `.env.example` placeholders:

```env
DATABASE_URL=""
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Auth provider, if using Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""

# Auth provider, if using Supabase
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# Future AI/content generation, not used in production gameplay
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""
```

Important:

- Do not commit `.env`.
- Include `.env.example`.
- Keep AI API keys out of client-side code.
- Do not use dynamic AI generation inside production gameplay for MVP.

## Core App Routes

Suggested Next.js routes:

```text
/
Landing page

/play
Mode selection

/play/classic
Classic Run setup

/play/classic/[runId]
Active Classic Run

/play/daily
Daily Challenge landing/setup

/play/daily/today
Active Daily Challenge

/reveal/[roundDecisionId]
Optional reveal route if using route-based reveal

/leaderboards
Leaderboard hub

/leaderboards/daily
Daily leaderboard

/leaderboards/classic
Best Classic Runs

/leaderboards/signal-score
Signal Score leaderboard

/profile
Current user profile

/profile/[userId]
Public profile

/rules
Game rules

/disclaimer
Entertainment/no-financial-advice disclaimer
```

## Frontend State

Use simple state first.

Options:

- React state for static prototype
- Zustand for run state if needed
- Server state with React Query if API complexity grows

Recommendation:

```text
Start simple.
Move shared run logic into game-engine.
Avoid overbuilding client state before the run loop is proven.
```

## API / Server Action Responsibilities

Core server operations:

- Create run
- Get current run
- Submit round decision
- Complete run
- Create/get daily challenge
- Submit daily challenge result
- Get leaderboards
- Get profile stats
- Import scenarios
- Validate scenario content

## Testing Strategy

### Unit Tests

Required early:

- Bankroll scoring
- Short scoring
- Confidence stake calculation
- Signal Score
- Pass behavior
- Bankruptcy
- Tiebreakers
- Scenario validation

### Integration Tests

Add after DB setup:

- Create run
- Submit round
- Complete run
- Submit daily challenge score
- Prevent duplicate daily official attempt
- Guest cannot submit official leaderboard score

### Manual QA

Required before MVP:

- Mobile screen sizes
- Desktop screen sizes
- Guest play
- Login flow
- Bankrupt run
- Full 20-round completion
- Daily Challenge completion
- Leaderboard submission
- Scenario reveal correctness

## Game Engine Testing Example

```ts
import { describe, expect, it } from 'vitest';
import { scoreRound } from '../src/scoring';

describe('scoreRound', () => {
  it('scores a correct long call', () => {
    const result = scoreRound({
      action: 'long',
      confidence: 'medium',
      currentBankroll: 10000,
      actualReturnPercent: 0.25,
    });

    expect(result.stakeAmount).toBe(4000);
    expect(result.pnlAmount).toBe(1000);
    expect(result.newBankroll).toBe(11000);
    expect(result.signalScoreDelta).toBe(2);
    expect(result.wasCorrect).toBe(true);
  });

  it('scores a pass', () => {
    const result = scoreRound({
      action: 'pass',
      currentBankroll: 10000,
      actualReturnPercent: 0.25,
    });

    expect(result.stakeAmount).toBe(0);
    expect(result.pnlAmount).toBe(0);
    expect(result.newBankroll).toBe(10000);
    expect(result.signalScoreDelta).toBe(-0.25);
    expect(result.wasCorrect).toBe(null);
  });
});
```

## Security and Safety

- Never expose provider secrets in client code.
- Validate all round submissions server-side.
- Do not trust client-calculated scores for leaderboard submission.
- Prevent replaying/submitting Daily Challenge multiple times.
- Prevent scenario outcome data from being sent before decision if possible.
- Avoid exposing hidden company name/ticker in client payload before reveal.
- Use server-side reveal after decision submission.

Important anti-cheat note:

For a serious leaderboard, the pre-decision payload should not include company name, ticker, end price, or return. The server should only send the hidden scenario variant and chart data needed before the decision. After the user submits the decision, the server sends reveal data.

## Anti-Cheat Considerations

MVP anti-cheat should be reasonable, not overbuilt.

Do:

- Calculate score on server.
- Hide reveal fields until after decision.
- Save decisions immediately.
- Lock Daily Challenge official attempt after start or completion.
- Mark abandoned attempts appropriately.

Do not overbuild:

- Advanced fraud detection
- Device fingerprinting
- Complex replay prevention
- Competitive esports-level anti-cheat

## Analytics Events

Add basic analytics after prototype.

Recommended events:

- landing_viewed
- classic_run_started
- daily_challenge_started
- round_viewed
- decision_submitted
- reveal_viewed
- run_completed
- run_bankrupt
- leaderboard_viewed
- guest_login_prompt_viewed
- account_created_after_run

## Accessibility

MVP accessibility requirements:

- Keyboard navigation
- Good color contrast
- Buttons not relying on color alone
- Text labels for confidence levels
- Chart should have textual summary after reveal
- Responsive font sizes
- Reduced motion support if animations become heavy

## Performance

Keep the game fast:

- Load only needed scenario data.
- Avoid huge chart payloads.
- Use responsive images/assets.
- Avoid overanimated screens.
- Keep mobile interactions smooth.
- Cache public content where safe.

## Deployment Plan

### Prototype

- Local development
- Vercel preview deployments
- Seed data in local JSON

### MVP

- Vercel production deployment
- Managed Postgres
- Auth provider
- Environment variable management
- Database migrations
- Backup/export strategy for scenario content

## Future Mobile Architecture

When building Expo mobile:

- Keep scoring logic in `packages/game-engine`.
- Keep scenario types in shared packages.
- Expose API endpoints from the web/backend.
- Use the same server-side scoring rules.
- Do not duplicate scoring logic in mobile app.
- Reuse content schema and validation pipeline.
