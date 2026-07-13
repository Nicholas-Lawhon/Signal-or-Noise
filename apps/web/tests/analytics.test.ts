import { describe, expect, it, vi } from 'vitest';
import { createAnalyticsAdapter } from '../lib/analytics';

describe('privacy-bounded analytics adapter', () => {
  it('is a clean no-op without configuration', () => { const send = vi.fn(); createAnalyticsAdapter({ enabled: true, configured: false, send }).capture({ name: 'mode_selected', properties: { mode: 'classic' } }); expect(send).not.toHaveBeenCalled(); });
  it('honors the analytics preference', () => { const send = vi.fn(); createAnalyticsAdapter({ enabled: false, configured: true, send }).capture({ name: 'page_viewed', properties: { area: 'play' } }); expect(send).not.toHaveBeenCalled(); });
  it('sends only the explicit typed event payload', () => { const send = vi.fn(); createAnalyticsAdapter({ enabled: true, configured: true, send }).capture({ name: 'round_submitted', properties: { mode: 'daily', action: 'pass' } }); expect(send).toHaveBeenCalledWith('round_submitted', { mode: 'daily', action: 'pass' }); });
  it('keeps competitive lifecycle events limited to format and outcome', () => { const send = vi.fn(); const adapter = createAnalyticsAdapter({ enabled: true, configured: true, send }); adapter.capture({ name: 'draft_completed', properties: { format: 'era' } }); adapter.capture({ name: 'draft_battle_submitted', properties: { format: 'quick' } }); adapter.capture({ name: 'battle_completed', properties: { outcome: 'draw' } }); expect(send.mock.calls).toEqual([['draft_completed', { format: 'era' }], ['draft_battle_submitted', { format: 'quick' }], ['battle_completed', { outcome: 'draw' }]]); });
});
