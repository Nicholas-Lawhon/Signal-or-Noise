import { NextResponse } from 'next/server';
import { getLeaderboardService } from '@/lib/server/database';
import { getVerifiedUser } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import {
  leaderboardRequestInput,
  leaderboardRequestSchema,
} from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const query = leaderboardRequestSchema.safeParse(
      leaderboardRequestInput(new URL(request.url).searchParams),
    );
    if (!query.success) {
      return jsonError(400, 'INVALID_INPUT', 'Invalid leaderboard filters');
    }
    const user = await getVerifiedUser();
    const leaderboard = query.data.board === 'draft'
      ? await getLeaderboardService().listDraft({ format: query.data.format, page: query.data.page, pageSize: query.data.pageSize }, user?.userId)
      : await getLeaderboardService().list(query.data, user?.userId);
    return NextResponse.json(
      {
        ...leaderboard,
        viewer: { isAuthenticated: user !== null },
      },
      { headers: { 'cache-control': 'private, no-store' } },
    );
  } catch (error) {
    return toErrorResponse(error);
  }
}
