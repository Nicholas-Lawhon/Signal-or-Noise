const DEFAULT_SIGN_IN_REDIRECT = '/play';
const LOCAL_ORIGIN = 'https://signal-or-noise.invalid';

/**
 * Returns a router-safe local path or the app fallback. Query values have
 * already been decoded once by URLSearchParams, so reject slash/backslash
 * encodings in the path as well as literal protocol-relative forms.
 */
export function safeLocalRedirect(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return DEFAULT_SIGN_IN_REDIRECT;
  }
  const path = value.split(/[?#]/, 1)[0];
  if (/%(?:2f|5c|25)/i.test(path) || /[\u0000-\u001f\u007f]/.test(value)) {
    return DEFAULT_SIGN_IN_REDIRECT;
  }
  try {
    const target = new URL(value, LOCAL_ORIGIN);
    if (target.origin !== LOCAL_ORIGIN || !target.pathname.startsWith('/')) {
      return DEFAULT_SIGN_IN_REDIRECT;
    }
    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return DEFAULT_SIGN_IN_REDIRECT;
  }
}
