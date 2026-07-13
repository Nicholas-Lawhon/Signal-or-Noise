import { NextResponse } from 'next/server';
import { getDraftBattleService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { runIdSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { battleId: string } },
): Promise<NextResponse> {
  try {
    const battleId = runIdSchema.safeParse(params.battleId);
    if (!battleId.success) return jsonError(400, 'INVALID_INPUT', 'Invalid Draft Battle id');
    const identity = await getRequestIdentity();
    if (!identity.user) return jsonError(401, 'UNAUTHENTICATED', 'Sign in to view this Draft Battle');
    const battle = await getDraftBattleService().getBattleState({ userId: identity.user.userId, battleId: battleId.data });
    return NextResponse.json({ battle, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
