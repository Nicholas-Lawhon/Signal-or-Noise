'use client';
import { useEffect, useState } from 'react';
import type { PreferenceKey } from '@/lib/preferences';
import { readPreference, writePreference } from '@/lib/preferences';

export default function PreferenceToggle({ storageKey, label, description, fallback = true }: { storageKey: PreferenceKey; label: string; description: string; fallback?: boolean }) {
  const [enabled, setEnabled] = useState(fallback);
  useEffect(() => setEnabled(readPreference(storageKey, fallback)), [fallback, storageKey]);
  const labelId = `${storageKey}-label`;
  const descriptionId = `${storageKey}-description`;
  return <div className="flex items-start justify-between gap-5 border-b border-son-borderSubtle py-5 last:border-0"><div><h2 id={labelId} className="font-bold text-son-text">{label}</h2><p id={descriptionId} className="mt-1 max-w-xl text-sm leading-relaxed text-son-textSecondary">{description}</p></div><button type="button" role="switch" aria-checked={enabled} aria-labelledby={labelId} aria-describedby={descriptionId} onClick={() => { const next = !enabled; setEnabled(next); writePreference(storageKey, next); }} className={`relative h-7 w-12 shrink-0 rounded-full border transition ${enabled ? 'border-son-signalCyan bg-son-signalCyan' : 'border-son-borderStrong bg-son-surface'}`}><span aria-hidden="true" className={`absolute top-0.5 h-5 w-5 rounded-full bg-son-bg transition ${enabled ? 'left-6' : 'left-1'}`} /></button></div>;
}
