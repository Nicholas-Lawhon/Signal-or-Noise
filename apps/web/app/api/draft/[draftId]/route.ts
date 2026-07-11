import { NextResponse } from 'next/server';
import { getDraftService } from '@/lib/server/database';
import { apiContext, candidateOwners, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse, withOwnerFallback } from '@/lib/server/apiErrors';
import { runIdSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { draftId: string } },
): Promise<NextResponse> {
  try {
    const draftId = runIdSchema.safeParse(params.draftId);
    if (!draftId.success) return jsonError(400, 'INVALID_INPUT', 'Invalid draft id');
    const identity = await getRequestIdentity();
    const draft = await withOwnerFallback(candidateOwners(identity), (owner) =>
      getDraftService().getDraft({ owner, draftId: draftId.data }));
    return NextResponse.json({ draft, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
