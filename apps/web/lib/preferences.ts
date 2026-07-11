export const SOUND_KEY = 'son_sound_enabled';
export const ANALYTICS_KEY = 'son_analytics_enabled';

export function readPreference(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  return value === null ? fallback : value === 'true';
}

export function writePreference(key: string, value: boolean): void {
  window.localStorage.setItem(key, String(value));
  window.dispatchEvent(new CustomEvent('son-preference-change', { detail: { key, value } }));
}
