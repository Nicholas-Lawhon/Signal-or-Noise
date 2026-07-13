import { smartPassReviewSchema } from '@signal-or-noise/content';
import type { SmartPassReview } from '@signal-or-noise/content';
import { DatabaseDomainError } from './errors';

/**
 * Reads curator metadata from the imported Scenario.factBank JSON. This is
 * deliberately server-only: callers supply only action/confidence, while the
 * server resolves eligibility from the immutable scenario row.
 */
export function parseSmartPassReview(value: unknown): SmartPassReview {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new DatabaseDomainError('INVALID_STATE', 'Scenario Smart Pass metadata is invalid');
  }
  const candidate = (value as Record<string, unknown>).smartPass;
  const parsed = smartPassReviewSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new DatabaseDomainError('INVALID_STATE', 'Scenario Smart Pass metadata is missing or invalid');
  }
  return parsed.data;
}
