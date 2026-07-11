import { ANALYTICS_KEY, readPreference } from './preferences';

export type AnalyticsEvent =
  | { name: 'page_viewed'; properties: { area: 'landing' | 'play' | 'rules' | 'settings' | 'disclaimer' | 'leaderboards' | 'profile' } }
  | { name: 'mode_selected'; properties: { mode: 'classic' | 'daily' | 'portfolio_draft' | 'friend_battle' } }
  | { name: 'run_started'; properties: { mode: 'classic' | 'daily'; difficulty?: 'easy' | 'medium' | 'hard' } }
  | { name: 'round_submitted'; properties: { mode: 'classic' | 'daily'; action: 'long' | 'short' | 'pass'; confidence?: 'low' | 'medium' | 'high' | 'all_in' } }
  | { name: 'reveal_viewed'; properties: { mode: 'classic' | 'daily'; result: 'win' | 'loss' | 'pass' | 'flat' } }
  | { name: 'run_completed'; properties: { mode: 'classic' | 'daily'; status: 'completed' | 'bankrupt' } }
  | { name: 'draft_started'; properties: Record<string, never> }
  | { name: 'draft_completed'; properties: Record<string, never> }
  | { name: 'battle_invite_created'; properties: Record<string, never> }
  | { name: 'battle_joined'; properties: Record<string, never> }
  | { name: 'battle_completed'; properties: { outcome: 'win' | 'loss' | 'draw' } };

type PostHogWindow = Window & { posthog?: { capture: (name: string, properties: object) => void } };

export function createAnalyticsAdapter(config: { enabled: boolean; configured: boolean; send: (name: string, properties: object) => void }) {
  return { capture(event: AnalyticsEvent): void { if (!config.enabled || !config.configured) return; config.send(event.name, event.properties); } };
}

/** Explicit-event-only adapter. Provider bootstrap is intentionally absent unless public config exists. */
export function capture(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return;
  createAnalyticsAdapter({ enabled: readPreference(ANALYTICS_KEY, true), configured: Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY), send: (name, properties) => (window as PostHogWindow).posthog?.capture(name, properties) }).capture(event);
}
