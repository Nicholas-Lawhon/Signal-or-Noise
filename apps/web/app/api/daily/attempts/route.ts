import { NextResponse } from 'next/server';
import {
  findDailyChallengeById,
  materializeDailyChallengeForDate,
  toDailyChallengeOverview,
} from '@signal-or-noise/database';
import { getDb, getRunService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { parseEmptyMutationRequest } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The only Daily endpoint: it lazily publishes today's immutable UTC challenge
 * and returns public metadata. A run is included only for the verified account
 * that owns it; guests can never create or resume a Daily attempt.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const identity = await getRequestIdentity();
    const owner = identity.user ? { kind: 'user' as const, userId: identity.user.userId } : null;
    const active = owner
      ? await getRunService().getCurrentRun({ owner, mode: 'daily_challenge' })
      : null;
    const activeChallengeId = active
      ? await getDb().run.findUnique({
        where: { id: active.id },
        select: { dailyChallengeId: true },
      })
      : null;
    const challenge = activeChallengeId?.dailyChallengeId
      ? await findDailyChallengeById(getDb(), activeChallengeId.dailyChallengeId)
      : await materializeDailyChallengeForDate(getDb(), new Date());
    if (!challenge) {
      return jsonError(404, 'NOT_FOUND', 'Your Daily Challenge is unavailable');
    }
    const run = owner
      ? await getRunService().getCurrentRun({
        owner,
        mode: 'daily_challenge',
        dailyChallengeId: challenge.id,
      })
      : null;
    const completedAttempts = identity.user
      ? await getDb().run.count({
        where: {
          userId: identity.user.userId,
          dailyChallengeId: challenge.id,
          status: { in: ['completed', 'bankrupt'] },
        },
      })
      : 0;
    return NextResponse.json({
      challenge: toDailyChallengeOverview(challenge),
      run,
      completedAttempts,
      context: apiContext(identity),
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!(await parseEmptyMutationRequest(request))) {
      return jsonError(400, 'INVALID_INPUT', 'This request does not accept a body');
    }
    const identity = await getRequestIdentity();
    if (!identity.user) {
      return jsonError(401, 'UNAUTHENTICATED', 'Sign in to play the Daily Challenge');
    }
    const owner = { kind: 'user' as const, userId: identity.user.userId };
    const active = await getRunService().getCurrentRun({ owner, mode: 'daily_challenge' });
    if (active) return NextResponse.json({ run: active, context: apiContext(identity) });
    const challenge = await materializeDailyChallengeForDate(getDb(), new Date());
    const run = await getRunService().createDailyChallengeRun({
      owner,
      dailyChallengeId: challenge.id,
    });
    return NextResponse.json({ run, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
