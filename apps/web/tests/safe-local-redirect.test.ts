import { describe, expect, it } from 'vitest';
import { safeLocalRedirect } from '../lib/safeLocalRedirect';

describe('safeLocalRedirect', () => {
  it('keeps ordinary app-local destinations and their query/hash', () => {
    expect(safeLocalRedirect('/play/daily?resume=1#round')).toBe('/play/daily?resume=1#round');
  });

  it('rejects external, protocol-relative, and encoded backslash redirect values', () => {
    for (const value of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      '/%2F%5Cevil.example',
      '/%252F%255Cevil.example',
      '/play\u0000/daily',
    ]) {
      expect(safeLocalRedirect(value)).toBe('/play');
    }
  });
});
