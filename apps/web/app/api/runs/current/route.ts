import { NextResponse } from 'next/server';
import type { CurrentRunPayload } from '@signal-or-noise/database';
import { getRunService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { toErrorResponse } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The player's active run, if any. A signed-in player may still be finishing a
 * run started as a guest, so the guest cookie is consulted when the account has
 * no active run; the guest run stays guest-owned and unofficial (D047).
 */
export async function GET(): Promise<NextResponse> {
  try {
    const identity = await getRequestIdentity();
    const service = getRunService();
    let run: CurrentRunPayload | null = null;
    if (identity.user) {
      run = await service.getCurrentRun({
        owner: { kind: 'user', userId: identity.user.userId },
        mode: 'classic_run',
      });
    }
    if (!run && identity.guestSessionId) {
      run = await service.getCurrentRun({
        owner: { kind: 'guest', guestSessionId: identity.guestSessionId },
        mode: 'classic_run',
      });
    }
    return NextResponse.json({ run, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
