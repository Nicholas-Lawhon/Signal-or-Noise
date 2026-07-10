import { NextResponse } from 'next/server';
import { findDailyChallengeForDate } from '@signal-or-noise/database';
import { getDb, getRunService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { parseEmptyMutationRequest } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Daily Challenge entry is login-gated (D048): guests are rejected here before
 * any service call, and the database service independently rejects guest
 * owners. Authenticated users may create unlimited attempts (D049); gameplay
 * ships in a later phase.
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!(await parseEmptyMutationRequest(request))) {
      return jsonError(400, 'INVALID_INPUT', 'This request does not accept a body');
    }
    const identity = await getRequestIdentity();
    if (!identity.user) {
      return jsonError(401, 'UNAUTHENTICATED', 'Sign in to play the Daily Challenge');
    }
    const challenge = await findDailyChallengeForDate(getDb(), new Date());
    if (!challenge) {
      return jsonError(404, 'NOT_FOUND', 'No Daily Challenge is scheduled for today');
    }
    const run = await getRunService().createDailyChallengeRun({
      owner: { kind: 'user', userId: identity.user.userId },
      dailyChallengeId: challenge.id,
    });
    return NextResponse.json({ run, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
