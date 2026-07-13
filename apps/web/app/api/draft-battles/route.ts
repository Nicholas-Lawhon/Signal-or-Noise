import { NextResponse } from 'next/server';
import { getDraftBattleService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { draftBattleFormatRequestSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const parsed = draftBattleFormatRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return jsonError(400, 'INVALID_INPUT', 'Invalid Draft Battle format, era, or timer');
    const identity = await getRequestIdentity();
    if (!identity.user) return jsonError(401, 'UNAUTHENTICATED', 'Sign in to start a Draft Battle');
    const battle = await getDraftBattleService().createBattle({ userId: identity.user.userId, ...parsed.data });
    return NextResponse.json({ battle, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
