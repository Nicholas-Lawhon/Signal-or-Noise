import { NextResponse } from 'next/server';
import { getPlayerStats } from '@signal-or-noise/database';
import { getDb } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const identity = await getRequestIdentity();
    if (!identity.user) {
      return jsonError(401, 'UNAUTHENTICATED', 'Sign in to see saved stats');
    }
    const stats = await getPlayerStats(getDb(), { userId: identity.user.userId });
    return NextResponse.json({ stats, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
