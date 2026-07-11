import { NextResponse } from 'next/server';
import { getBattleService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { battleDecisionRequestSchema, runIdSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Locks the caller's decision for the current round. The response is the
 * viewer-scoped battle state: no round result crosses the wire until both
 * decisions settle.
 */
export async function POST(
  request: Request,
  { params }: { params: { battleId: string } },
): Promise<NextResponse> {
  try {
    const battleId = runIdSchema.safeParse(params.battleId);
    if (!battleId.success) return jsonError(400, 'INVALID_INPUT', 'Invalid battle id');
    const body = await request.json().catch(() => null);
    const parsed = battleDecisionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'INVALID_INPUT', 'Invalid decision payload');
    }
    const identity = await getRequestIdentity();
    if (!identity.user) {
      return jsonError(401, 'UNAUTHENTICATED', 'Sign in to play this battle');
    }
    const battle = await getBattleService().submitDecision({
      userId: identity.user.userId,
      battleId: battleId.data,
      roundIndex: parsed.data.roundIndex,
      action: parsed.data.action,
      ...(parsed.data.confidence ? { confidence: parsed.data.confidence } : {}),
      ...(parsed.data.companyGuess ? { companyGuess: parsed.data.companyGuess } : {}),
    });
    return NextResponse.json({ battle, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
