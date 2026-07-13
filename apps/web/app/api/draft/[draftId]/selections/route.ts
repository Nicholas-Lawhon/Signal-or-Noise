import { NextResponse } from 'next/server';
import { getDraftService } from '@/lib/server/database';
import { apiContext, candidateOwners, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse, withOwnerFallback } from '@/lib/server/apiErrors';
import { draftSelectionRequestSchema, runIdSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Locks one immutable weighted portfolio; the server computes results. */
export async function POST(
  request: Request,
  { params }: { params: { draftId: string } },
): Promise<NextResponse> {
  try {
    const draftId = runIdSchema.safeParse(params.draftId);
    if (!draftId.success) return jsonError(400, 'INVALID_INPUT', 'Invalid draft id');
    const body = await request.json().catch(() => null);
    const parsed = draftSelectionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(400, 'INVALID_INPUT', 'Choose valid distinct companies and allocate exactly 100%');
    }
    const identity = await getRequestIdentity();
    const draft = await withOwnerFallback(candidateOwners(identity), (owner) =>
      getDraftService().submitSelections({
        owner,
        draftId: draftId.data,
        slots: parsed.data.slots,
        allocations: parsed.data.allocations,
      }));
    return NextResponse.json({ draft, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
