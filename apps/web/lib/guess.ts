export function normalizeGuess(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}
