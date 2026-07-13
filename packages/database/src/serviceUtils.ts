import type { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import type { RunOwner } from './contracts';
import { DatabaseDomainError } from './errors';

export type TransactionClient = Prisma.TransactionClient;

export function parseInput<T>(parse: () => T): T {
  try {
    return parse();
  } catch (error) {
    if (error instanceof ZodError) {
      throw new DatabaseDomainError(
        'INVALID_INPUT',
        error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; '),
      );
    }
    throw error;
  }
}

export function decimalToNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

export function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function ownerWhere(owner: RunOwner): { userId: string } | {
  guestSession: { clientSessionId: string };
} {
  return owner.kind === 'user'
    ? { userId: owner.userId }
    : { guestSession: { clientSessionId: owner.guestSessionId } };
}

export async function resolveOwner(
  tx: TransactionClient,
  owner: RunOwner,
): Promise<{ userId: string | null; guestSessionId: string | null; isOfficial: boolean }> {
  if (owner.kind === 'user') {
    const user = await tx.user.findUnique({ where: { id: owner.userId }, select: { id: true } });
    if (!user) throw new DatabaseDomainError('NOT_FOUND', 'User not found');
    return { userId: user.id, guestSessionId: null, isOfficial: true };
  }

  const guest = await tx.guestSession.upsert({
    where: { clientSessionId: owner.guestSessionId },
    create: { clientSessionId: owner.guestSessionId },
    update: {},
    select: { id: true },
  });
  return { userId: null, guestSessionId: guest.id, isOfficial: false };
}

export function prismaErrorCode(error: unknown): string | null {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : null;
}

/**
 * Retries a Serializable transaction that aborted on a write conflict (P2034)
 * or lost a unique-constraint race (P2002), then surfaces a clean CONFLICT.
 */
export async function withSerializableRetry<T>(
  operation: () => Promise<T>,
  conflictMessage: string,
  attempts = 3,
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      const code = prismaErrorCode(error);
      if (code !== 'P2034' && code !== 'P2002') throw error;
      if (attempt >= attempts) {
        throw new DatabaseDomainError('CONFLICT', conflictMessage);
      }
    }
  }
}
