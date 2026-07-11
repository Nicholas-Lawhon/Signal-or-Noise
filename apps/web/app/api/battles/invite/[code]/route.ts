import { NextResponse } from 'next/server';
import { getBattleService } from '@/lib/server/database';
import { apiContext, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { inviteCodeRequestSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Invite preview: safe metadata only, never scenario content. */
export async function GET(
  _request: Request,
  { params }: { params: { code: string } },
): Promise<NextResponse> {
  try {
    const code = inviteCodeRequestSchema.safeParse(params.code);
    if (!code.success) return jsonError(400, 'INVALID_INPUT', 'Invalid invite code');
    const identity = await getRequestIdentity();
    if (!identity.user) {
      return jsonError(401, 'UNAUTHENTICATED', 'Sign in to view this battle invite');
    }
    const invite = await getBattleService().getInvitePreview({
      userId: identity.user.userId,
      inviteCode: code.data,
    });
    return NextResponse.json({ invite, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
