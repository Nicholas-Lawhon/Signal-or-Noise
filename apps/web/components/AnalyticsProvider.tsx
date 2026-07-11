'use client';
import { useEffect } from 'react';
import { ANALYTICS_KEY, readPreference } from '@/lib/preferences';

export default function AnalyticsProvider() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key || !readPreference(ANALYTICS_KEY, true)) return;
    void import('posthog-js').then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true,
        person_profiles: 'never',
        persistence: 'memory',
        advanced_disable_decide: true,
        loaded: (client) => { window.posthog = { capture: (name, properties) => client.capture(name, properties) }; },
      });
    });
  }, []);
  return null;
}

declare global { interface Window { posthog?: { capture: (name: string, properties: object) => void } } }
