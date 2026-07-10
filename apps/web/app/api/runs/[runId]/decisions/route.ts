import { NextResponse } from 'next/server';
import { getRunService } from '@/lib/server/database';
import { candidateOwners, getRequestIdentity } from '@/lib/server/identity';
import { jsonError, toErrorResponse, withOwnerFallback } from '@/lib/server/apiErrors';
import { runIdSchema, submitDecisionRequestSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { runId: string } },
): Promise<NextResponse> {
  try {
    const runId = runIdSchema.safeParse(params.runId);
    const body = await request.json().catch(() => null);
    const parsed = submitDecisionRequestSchema.safeParse(body);
    if (!runId.success || !parsed.success) {
      return jsonError(400, 'INVALID_INPUT', 'Invalid decision payload');
    }
    const identity = await getRequestIdentity();
    const owners = candidateOwners(identity);
    if (owners.length === 0) {
      return jsonError(403, 'FORBIDDEN', 'No player identity on this request');
    }
    const result = await withOwnerFallback(owners, (owner) =>
      getRunService().submitRoundDecision({
        owner,
        runId: runId.data,
        roundIndex: parsed.data.roundIndex,
        action: parsed.data.action,
        confidence: parsed.data.confidence,
        companyGuess: parsed.data.companyGuess,
      }),
    );
    return NextResponse.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
