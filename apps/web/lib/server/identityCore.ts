import type { PrismaClient } from '@prisma/client';
import { ensureUserForExternalAuth } from '@signal-or-noise/database';

export type VerifiedUser = { kind: 'user'; userId: string };

export type IdentityDeps = {
  /** Returns the Clerk user ID from the verified server session, or null. */
  getClerkUserId: () => Promise<string | null>;
  /** Optional profile enrichment used only on first sign-in. */
  getClerkProfile: () => Promise<{ email?: string; displayName?: string } | null>;
  db: PrismaClient;
};

/**
 * Maps the verified provider session to the internal User. This is the only
 * place authenticated identity enters the app; request data never supplies a
 * user ID, guest ID, external auth ID, or official-status flag. Any provider
 * failure resolves to null (guest) so auth can never block public gameplay.
 */
export async function resolveVerifiedUser(deps: IdentityDeps): Promise<VerifiedUser | null> {
  let clerkUserId: string | null;
  try {
    clerkUserId = await deps.getClerkUserId();
  } catch {
    return null;
  }
  if (!clerkUserId) return null;

  try {
    const existing = await deps.db.user.findUnique({
      where: { externalAuthId: clerkUserId },
      select: { id: true },
    });
    if (existing) return { kind: 'user', userId: existing.id };

    let profile: { email?: string; displayName?: string } | null = null;
    try {
      profile = await deps.getClerkProfile();
    } catch {
      profile = null;
    }
    const user = await ensureUserForExternalAuth(deps.db, {
      externalAuthId: clerkUserId,
      email: profile?.email,
      displayName: profile?.displayName,
    });
    return { kind: 'user', userId: user.id };
  } catch {
    // Identity sync failure degrades to guest play instead of blocking the game.
    return null;
  }
}
