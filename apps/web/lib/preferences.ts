export const SOUND_KEY = 'son_sound_enabled';
export const ANALYTICS_KEY = 'son_analytics_enabled';

export type PreferenceKey = typeof SOUND_KEY | typeof ANALYTICS_KEY;

export function readPreference(key: PreferenceKey, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const value = window.localStorage.getItem(key);
  return value === null ? fallback : value === 'true';
}

export function writePreference(key: PreferenceKey, value: boolean): void {
  window.localStorage.setItem(key, String(value));
  window.dispatchEvent(new CustomEvent('son-preference-change', { detail: { key, value } }));
}
