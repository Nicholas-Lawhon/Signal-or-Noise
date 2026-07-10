import { NextResponse } from 'next/server';
import type { RunOwner } from '@signal-or-noise/database';
import { getRunService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { ensureGuestSessionId } from '@/lib/server/guestSession';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { createClassicRunRequestSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json().catch(() => null);
    const parsed = createClassicRunRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'INVALID_INPUT', 'Request must supply only a difficulty');
    }
    const identity = await getRequestIdentity();
    const owner: RunOwner = identity.user
      ? { kind: 'user', userId: identity.user.userId }
      : { kind: 'guest', guestSessionId: ensureGuestSessionId() };
    const run = await getRunService().createClassicRun({
      owner,
      difficulty: parsed.data.difficulty,
    });
    return NextResponse.json({ run, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
