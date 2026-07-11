import { NextResponse } from 'next/server';
import { getBattleService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { runIdSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Participant-only battle state. Reading enforces authoritative server time:
 * expiry and round deadlines settle here, so polling this endpoint is the
 * synchronization engine for both clients.
 */
export async function GET(
  _request: Request,
  { params }: { params: { battleId: string } },
): Promise<NextResponse> {
  try {
    const battleId = runIdSchema.safeParse(params.battleId);
    if (!battleId.success) return jsonError(400, 'INVALID_INPUT', 'Invalid battle id');
    const identity = await getRequestIdentity();
    if (!identity.user) {
      return jsonError(401, 'UNAUTHENTICATED', 'Sign in to view this battle');
    }
    const battle = await getBattleService().getBattleState({
      userId: identity.user.userId,
      battleId: battleId.data,
    });
    return NextResponse.json({ battle, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
