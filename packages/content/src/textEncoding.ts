const WINDOWS_1252_BYTES: Readonly<Record<string, number>> = {
  '\u20ac': 0x80,
  '\u201a': 0x82,
  '\u0192': 0x83,
  '\u201e': 0x84,
  '\u2026': 0x85,
  '\u2020': 0x86,
  '\u2021': 0x87,
  '\u02c6': 0x88,
  '\u2030': 0x89,
  '\u0160': 0x8a,
  '\u2039': 0x8b,
  '\u0152': 0x8c,
  '\u017d': 0x8e,
  '\u2018': 0x91,
  '\u2019': 0x92,
  '\u201c': 0x93,
  '\u201d': 0x94,
  '\u2022': 0x95,
  '\u2013': 0x96,
  '\u2014': 0x97,
  '\u02dc': 0x98,
  '\u2122': 0x99,
  '\u0161': 0x9a,
  '\u203a': 0x9b,
  '\u0153': 0x9c,
  '\u017e': 0x9e,
  '\u0178': 0x9f,
};

const MOJIBAKE_MARKERS = /[\u00c2\u00c3\u00e2\u00f0\ufffd]/g;

function mojibakeScore(value: string): number {
  return (value.match(MOJIBAKE_MARKERS) ?? []).length;
}

function decodeOnePass(value: string): string | null {
  const bytes: number[] = [];
  for (const character of value) {
    const mapped = WINDOWS_1252_BYTES[character];
    const codePoint = mapped ?? character.codePointAt(0);
    if (codePoint === undefined || codePoint > 0xff) return null;
    bytes.push(codePoint);
  }

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return null;
  }
}

/**
 * Repairs UTF-8 text that was accidentally decoded as Windows-1252 once or
 * twice. It is intentionally conservative and leaves ordinary text untouched.
 */
export function normalizeMojibake(value: string): string {
  let current = value;
  for (let pass = 0; pass < 3; pass += 1) {
    if (mojibakeScore(current) === 0) break;
    const candidate = decodeOnePass(current);
    if (candidate === null || mojibakeScore(candidate) >= mojibakeScore(current)) break;
    current = candidate;
  }
  return current;
}

/** Normalizes text in an API/content object without changing its shape. */
export function normalizeMojibakeDeep<T>(value: T): T {
  if (typeof value === 'string') return normalizeMojibake(value) as T;
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeMojibakeDeep(entry)) as T;
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      result[key] = normalizeMojibakeDeep(entry);
    }
    return result as T;
  }
  return value;
}
