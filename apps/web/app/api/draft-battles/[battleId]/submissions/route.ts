import { NextResponse } from 'next/server';
import { getDraftBattleService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { draftBattleSubmissionRequestSchema, runIdSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { battleId: string } },
): Promise<NextResponse> {
  try {
    const battleId = runIdSchema.safeParse(params.battleId);
    if (!battleId.success) return jsonError(400, 'INVALID_INPUT', 'Invalid Draft Battle id');
    const parsed = draftBattleSubmissionRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError(400, 'INVALID_INPUT', 'Choose valid cards and allocations');
    const identity = await getRequestIdentity();
    if (!identity.user) return jsonError(401, 'UNAUTHENTICATED', 'Sign in to submit this Draft Battle');
    const battle = await getDraftBattleService().submit({ userId: identity.user.userId, battleId: battleId.data, ...parsed.data });
    return NextResponse.json({ battle, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
