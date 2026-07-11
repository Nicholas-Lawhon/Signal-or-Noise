import { NextResponse } from 'next/server';
import { getBattleService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { createBattleRequestSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Friend Battles are for signed-in players only (D052). */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => null);
    const parsed = createBattleRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'INVALID_INPUT', 'Choose a difficulty and a timer of off, 30, 60, or 120 seconds');
    }
    const identity = await getRequestIdentity();
    if (!identity.user) {
      return jsonError(401, 'UNAUTHENTICATED', 'Sign in to start a Friend Battle');
    }
    const battle = await getBattleService().createBattle({
      userId: identity.user.userId,
      difficulty: parsed.data.difficulty,
      timerSeconds: parsed.data.timerSeconds,
    });
    return NextResponse.json({ battle, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const identity = await getRequestIdentity();
    if (!identity.user) {
      return jsonError(401, 'UNAUTHENTICATED', 'Sign in to see your Friend Battles');
    }
    const battles = await getBattleService().listBattles({ userId: identity.user.userId });
    return NextResponse.json({ battles, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
