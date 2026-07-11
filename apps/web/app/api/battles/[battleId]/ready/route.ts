import { NextResponse } from 'next/server';
import { getBattleService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { battleReadyRequestSchema, runIdSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Ready for round 0, or leave a reveal toward round N+1 (D052). */
export async function POST(
  request: Request,
  { params }: { params: { battleId: string } },
): Promise<NextResponse> {
  try {
    const battleId = runIdSchema.safeParse(params.battleId);
    if (!battleId.success) return jsonError(400, 'INVALID_INPUT', 'Invalid battle id');
    const body = await request.json().catch(() => null);
    const parsed = battleReadyRequestSchema.safeParse(body);
    if (!parsed.success) return jsonError(400, 'INVALID_INPUT', 'Ready requires a round number');
    const identity = await getRequestIdentity();
    if (!identity.user) {
      return jsonError(401, 'UNAUTHENTICATED', 'Sign in to play this battle');
    }
    const battle = await getBattleService().setReady({
      userId: identity.user.userId,
      battleId: battleId.data,
      round: parsed.data.round,
    });
    return NextResponse.json({ battle, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
