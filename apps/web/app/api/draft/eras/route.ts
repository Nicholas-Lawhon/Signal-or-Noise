import { NextResponse } from 'next/server';
import { getDraftService } from '@/lib/server/database';
import { toErrorResponse } from '@/lib/server/apiErrors';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  try {
    return NextResponse.json({ eras: await getDraftService().listEras() });
  } catch (error) {
    return toErrorResponse(error);
  }
}
