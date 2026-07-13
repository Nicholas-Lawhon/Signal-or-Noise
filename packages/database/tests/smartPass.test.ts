import { describe, expect, it } from 'vitest';
import { parseSmartPassReview } from '../src/smartPass';

describe('parseSmartPassReview', () => {
  it('accepts only the reviewed server-side metadata shape', () => {
    expect(parseSmartPassReview({
      smartPass: {
        eligible: true,
        explanation: 'Competing evidence leaves the pre-decision setup genuinely mixed.',
      },
    })).toEqual({
      eligible: true,
      explanation: 'Competing evidence leaves the pre-decision setup genuinely mixed.',
    });
  });

  it('rejects missing or malformed imported metadata', () => {
    expect(() => parseSmartPassReview({})).toThrow('missing or invalid');
    expect(() => parseSmartPassReview({ smartPass: { eligible: 'yes' } })).toThrow('missing or invalid');
  });
});
