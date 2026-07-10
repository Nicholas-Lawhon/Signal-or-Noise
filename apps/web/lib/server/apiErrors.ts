import { NextResponse } from 'next/server';
import { DatabaseDomainError } from '@signal-or-noise/database';
import type { DatabaseErrorCode, RunOwner } from '@signal-or-noise/database';

const STATUS_BY_CODE: Record<DatabaseErrorCode, number> = {
  INVALID_INPUT: 400,
  NOT_FOUND: 404,
  FORBIDDEN: 403,
  CONFLICT: 409,
  INVALID_STATE: 422,
};

export function jsonError(status: number, code: string, message: string): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof DatabaseDomainError) {
    return jsonError(STATUS_BY_CODE[error.code], error.code, error.message);
  }
  console.error('Unhandled API error', error);
  return jsonError(500, 'INTERNAL', 'Something went wrong');
}

/**
 * Runs an owner-scoped operation, trying each candidate identity in order.
 * Only FORBIDDEN falls through to the next owner; every other failure is real.
 */
export async function withOwnerFallback<T>(
  owners: RunOwner[],
  operation: (owner: RunOwner) => Promise<T>,
): Promise<T> {
  let lastForbidden: DatabaseDomainError | null = null;
  for (const owner of owners) {
    try {
      return await operation(owner);
    } catch (error) {
      if (error instanceof DatabaseDomainError && error.code === 'FORBIDDEN') {
        lastForbidden = error;
        continue;
      }
      throw error;
    }
  }
  throw lastForbidden ?? new DatabaseDomainError('FORBIDDEN', 'No player identity on this request');
}
