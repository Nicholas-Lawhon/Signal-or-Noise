import { NextResponse } from 'next/server';
import type { RunOwner } from '@signal-or-noise/database';
import { getDraftService } from '@/lib/server/database';
import { apiContext, candidateOwners, getRequestIdentity } from '@/lib/server/identity';
import { ensureGuestSessionId } from '@/lib/server/guestSession';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { parseEmptyMutationRequest } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Portfolio Draft is open to guests (D052); signed-in completions save. */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    if (!(await parseEmptyMutationRequest(request))) {
      return jsonError(400, 'INVALID_INPUT', 'This request does not accept a body');
    }
    const identity = await getRequestIdentity();
    const owner: RunOwner = identity.user
      ? { kind: 'user', userId: identity.user.userId }
      : { kind: 'guest', guestSessionId: ensureGuestSessionId() };
    const draft = await getDraftService().createDraft({ owner });
    return NextResponse.json({ draft, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}

/**
 * The player's active draft, if any. A signed-in player may still be finishing
 * a draft started as a guest, so the guest cookie is consulted when the
 * account has no active draft (mirrors /api/runs/current).
 */
export async function GET(): Promise<NextResponse> {
  try {
    const identity = await getRequestIdentity();
    let draft = null;
    for (const owner of candidateOwners(identity)) {
      draft = await getDraftService().getCurrentDraft({ owner });
      if (draft) break;
    }
    return NextResponse.json({ draft, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
