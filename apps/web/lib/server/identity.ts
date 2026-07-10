import 'server-only';
import { auth, currentUser } from '@clerk/nextjs/server';
import type { RunOwner } from '@signal-or-noise/database';
import { getDb } from './database';
import { readGuestSessionId } from './guestSession';
import { resolveVerifiedUser } from './identityCore';
import type { VerifiedUser } from './identityCore';

export type RequestIdentity = {
  user: VerifiedUser | null;
  guestSessionId: string | null;
};

export async function getVerifiedUser(): Promise<VerifiedUser | null> {
  return resolveVerifiedUser({
    getClerkUserId: async () => (await auth()).userId,
    getClerkProfile: async () => {
      const profile = await currentUser();
      if (!profile) return null;
      return {
        email: profile.primaryEmailAddress?.emailAddress,
        displayName: profile.fullName ?? profile.username ?? undefined,
      };
    },
    db: getDb(),
  });
}

export async function getRequestIdentity(): Promise<RequestIdentity> {
  return {
    user: await getVerifiedUser(),
    guestSessionId: readGuestSessionId(),
  };
}

/**
 * Owners this request may act as, most-specific first. A signed-in player can
 * still be finishing a run started as a guest, so run operations try the user
 * identity first and fall back to the guest cookie. Signing in alone never
 * transfers or claims the guest run.
 */
export function candidateOwners(identity: RequestIdentity): RunOwner[] {
  const owners: RunOwner[] = [];
  if (identity.user) owners.push({ kind: 'user', userId: identity.user.userId });
  if (identity.guestSessionId) {
    owners.push({ kind: 'guest', guestSessionId: identity.guestSessionId });
  }
  return owners;
}

export type ApiContext = {
  isAuthenticated: boolean;
  hasGuestSession: boolean;
};

export function apiContext(identity: RequestIdentity): ApiContext {
  return {
    isAuthenticated: identity.user !== null,
    hasGuestSession: identity.guestSessionId !== null,
  };
}
