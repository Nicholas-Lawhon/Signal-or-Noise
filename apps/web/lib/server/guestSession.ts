import 'server-only';
import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Guest continuity is a first-party httpOnly cookie holding a random UUID.
 * The browser never reads it from script and the server never accepts a guest
 * ID from request bodies — routes derive it from this cookie only, which is
 * what makes the one-time run claim cookie-bound.
 */
export const GUEST_SESSION_COOKIE = 'son_guest_session';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function readGuestSessionId(): string | null {
  const value = cookies().get(GUEST_SESSION_COOKIE)?.value;
  return value && UUID_PATTERN.test(value) ? value.toLowerCase() : null;
}

/**
 * Read the guest session, creating the cookie when missing. Only call from
 * route handlers that mutate state (run creation) — reads must not mint
 * sessions for every anonymous visitor.
 */
export function ensureGuestSessionId(): string {
  const existing = readGuestSessionId();
  if (existing) return existing;
  const created = randomUUID();
  cookies().set(GUEST_SESSION_COOKIE, created, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
  return created;
}
