import { NextResponse } from 'next/server';
import { getRunService } from '@/lib/server/database';
import { apiContext, candidateOwners, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse, withOwnerFallback } from '@/lib/server/apiErrors';
import { runIdSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: { runId: string } },
): Promise<NextResponse> {
  try {
    const runId = runIdSchema.safeParse(params.runId);
    if (!runId.success) {
      return jsonError(400, 'INVALID_INPUT', 'Invalid run ID');
    }
    const identity = await getRequestIdentity();
    const owners = candidateOwners(identity);
    if (owners.length === 0) {
      return jsonError(403, 'FORBIDDEN', 'No player identity on this request');
    }
    const summary = await withOwnerFallback(owners, (owner) =>
      getRunService().getRunSummary({ owner, runId: runId.data }),
    );
    return NextResponse.json({ summary, context: apiContext(identity) });
  } catch (error) {
    return toErrorResponse(error);
  }
}
