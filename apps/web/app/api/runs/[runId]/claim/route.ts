import { NextResponse } from 'next/server';
import { getRunService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { parseEmptyMutationRequest, runIdSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Explicit one-time claim of a completed guest Classic Run (D047). Requires
 * both a verified Clerk session and the guest-session cookie that owned the
 * run before authentication; both identifiers are derived server-side. The
 * request body is intentionally ignored — nothing in it is trusted.
 */
export async function POST(
  request: Request,
  { params }: { params: { runId: string } },
): Promise<NextResponse> {
  try {
    const runId = runIdSchema.safeParse(params.runId);
    if (!runId.success) {
      return jsonError(400, 'INVALID_INPUT', 'Invalid run ID');
    }
    if (!(await parseEmptyMutationRequest(request))) {
      return jsonError(400, 'INVALID_INPUT', 'This request does not accept a body');
    }
    const identity = await getRequestIdentity();
    if (!identity.user) {
      return jsonError(401, 'UNAUTHENTICATED', 'Sign in to save this run');
    }
    if (!identity.guestSessionId) {
      return jsonError(403, 'FORBIDDEN', 'This device has no guest session for that run');
    }
    const summary = await getRunService().claimCompletedGuestRun({
      userId: identity.user.userId,
      guestSessionId: identity.guestSessionId,
      runId: runId.data,
    });
    return NextResponse.json({ summary, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
