# Phase 5 Consultant Memo — Database Provider and Guest Strategy

**Status:** approved
**Approved by:** user
**Date:** 2026-07-10

## Decision

- Use Neon’s free tier as the PostgreSQL provider for the prototype.
- Use Prisma as the database ORM and migration layer.
- Keep authentication-provider selection separate for Phase 6.
- Use a client-generated guest session ID. Guests may play without an account;
  guest runs remain unofficial. Persist guest continuity locally first, with
  anonymous server persistence where the connected run flow requires it.
- Authenticated users become eligible for official leaderboard submission in
  the later Auth/Leaderboard phases.

## Rationale

Neon provides a low-cost, usage-based path appropriate for the prototype while
remaining standard PostgreSQL behind Prisma. The database layer should avoid
provider-specific APIs so a later provider change does not alter game logic or
the web-facing persistence contracts.

## Constraints

- Neon credentials stay in local environment configuration and are never
  committed.
- Runtime scoring is server-authoritative and delegates all game math to
  `packages/game-engine`.
- This decision does not authorize production deployment, paid upgrades, or
  authentication implementation.

## Revisit Triggers

Revisit the provider if free-tier limits, uptime needs, sustained traffic,
backup requirements, or Phase 6 authentication integration make the current
choice unsuitable.
