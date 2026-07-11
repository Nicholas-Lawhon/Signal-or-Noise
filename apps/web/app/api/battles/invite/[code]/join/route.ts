import { NextResponse } from 'next/server';
import { getBattleService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { inviteCodeRequestSchema, parseEmptyMutationRequest } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Exactly one other signed-in player can join, once (D052). */
export async function POST(
  request: Request,
  { params }: { params: { code: string } },
): Promise<NextResponse> {
  try {
    const code = inviteCodeRequestSchema.safeParse(params.code);
    if (!code.success) return jsonError(400, 'INVALID_INPUT', 'Invalid invite code');
    if (!(await parseEmptyMutationRequest(request))) {
      return jsonError(400, 'INVALID_INPUT', 'This request does not accept a body');
    }
    const identity = await getRequestIdentity();
    if (!identity.user) {
      return jsonError(401, 'UNAUTHENTICATED', 'Sign in to join this battle');
    }
    const battle = await getBattleService().joinBattle({
      userId: identity.user.userId,
      inviteCode: code.data,
    });
    return NextResponse.json({ battle, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
