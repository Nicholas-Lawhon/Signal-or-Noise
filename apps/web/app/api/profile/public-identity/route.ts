import { NextResponse } from 'next/server';
import { getPublicIdentity, updatePublicIdentity } from '@signal-or-noise/database';
import { getDb } from '@/lib/server/database';
import { getVerifiedUser } from '@/lib/server/identity';
import { jsonError, toErrorResponse } from '@/lib/server/apiErrors';
import { publicDisplayNameRequestSchema } from '@/lib/server/requests';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    const user = await getVerifiedUser();
    if (!user) return jsonError(401, 'UNAUTHENTICATED', 'Sign in to manage your public name');
    const identity = await getPublicIdentity(getDb(), { userId: user.userId });
    return NextResponse.json({ identity }, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  try {
    const body = publicDisplayNameRequestSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return jsonError(400, 'INVALID_INPUT', 'Invalid public display name');
    const user = await getVerifiedUser();
    if (!user) return jsonError(401, 'UNAUTHENTICATED', 'Sign in to manage your public name');
    const identity = await updatePublicIdentity(getDb(), {
      userId: user.userId,
      displayName: body.data.displayName,
    });
    return NextResponse.json({ identity }, { headers: { 'cache-control': 'private, no-store' } });
  } catch (error) {
    return toErrorResponse(error);
  }
}
