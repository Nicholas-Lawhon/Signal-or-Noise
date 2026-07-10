import { describe, expect, it, vi } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { resolveVerifiedUser } from '../lib/server/identityCore';

function fakeDb(overrides: {
  findUnique?: ReturnType<typeof vi.fn>;
  upsert?: ReturnType<typeof vi.fn>;
}): PrismaClient {
  return {
    user: {
      findUnique: overrides.findUnique ?? vi.fn().mockResolvedValue(null),
      upsert: overrides.upsert ?? vi.fn().mockResolvedValue({ id: 'internal_new', displayName: null }),
    },
    // Only the user delegate is exercised by the identity boundary.
  } as unknown as PrismaClient;
}

describe('server identity boundary', () => {
  it('resolves an existing mapped user without touching the provider profile', async () => {
    const findUnique = vi.fn().mockResolvedValue({ id: 'internal_1' });
    const getClerkProfile = vi.fn();
    const identity = await resolveVerifiedUser({
      getClerkUserId: async () => 'clerk_abc',
      getClerkProfile,
      db: fakeDb({ findUnique }),
    });
    expect(identity).toEqual({ kind: 'user', userId: 'internal_1' });
    expect(findUnique).toHaveBeenCalledWith({
      where: { externalAuthId: 'clerk_abc' },
      select: { id: true },
    });
    expect(getClerkProfile).not.toHaveBeenCalled();
  });

  it('creates the internal mapping on first sign-in via idempotent upsert', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'internal_new', displayName: 'Player' });
    const identity = await resolveVerifiedUser({
      getClerkUserId: async () => 'clerk_new',
      getClerkProfile: async () => ({ email: 'p@example.com', displayName: 'Player' }),
      db: fakeDb({ upsert }),
    });
    expect(identity).toEqual({ kind: 'user', userId: 'internal_new' });
    expect(upsert).toHaveBeenCalledTimes(1);
    const args = upsert.mock.calls[0][0];
    expect(args.where).toEqual({ externalAuthId: 'clerk_new' });
  });

  it('treats a signed-out session as a guest', async () => {
    const identity = await resolveVerifiedUser({
      getClerkUserId: async () => null,
      getClerkProfile: async () => null,
      db: fakeDb({}),
    });
    expect(identity).toBeNull();
  });

  it('falls back to guest when the auth provider is unavailable', async () => {
    const identity = await resolveVerifiedUser({
      getClerkUserId: async () => {
        throw new Error('clerk unreachable');
      },
      getClerkProfile: async () => null,
      db: fakeDb({}),
    });
    expect(identity).toBeNull();
  });

  it('falls back to guest when identity sync fails, without crashing gameplay', async () => {
    const identity = await resolveVerifiedUser({
      getClerkUserId: async () => 'clerk_abc',
      getClerkProfile: async () => null,
      db: fakeDb({
        findUnique: vi.fn().mockRejectedValue(new Error('db down')),
      }),
    });
    expect(identity).toBeNull();
  });

  it('still maps the user when only the profile enrichment fails', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'internal_bare', displayName: null });
    const identity = await resolveVerifiedUser({
      getClerkUserId: async () => 'clerk_bare',
      getClerkProfile: async () => {
        throw new Error('profile fetch failed');
      },
      db: fakeDb({ upsert }),
    });
    expect(identity).toEqual({ kind: 'user', userId: 'internal_bare' });
  });
});
