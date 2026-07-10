'use client';

import { useEffect, useState } from 'react';
import type { PublicIdentityPayload } from '@signal-or-noise/database';
import { ApiRequestError, api } from '@/lib/api';

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; identity: PublicIdentityPayload }
  | { kind: 'error' };

export default function PublicIdentityCard() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    kind: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api.publicIdentity()
      .then(({ identity }) => {
        if (cancelled) return;
        setState({ kind: 'ready', identity });
        setValue(identity.displayName ?? '');
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (displayName: string | null) => {
    setSaving(true);
    setMessage(null);
    try {
      const { identity } = await api.updatePublicDisplayName(displayName);
      setState({ kind: 'ready', identity });
      setValue(identity.displayName ?? '');
      setMessage({
        kind: 'success',
        text: displayName === null ? 'Using your generated alias.' : 'Leaderboard name saved.',
      });
    } catch (error) {
      setMessage({
        kind: 'error',
        text: error instanceof ApiRequestError ? error.message : 'Could not save that name.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mb-5 rounded-2xl border border-son-border bg-son-card p-5">
      <h2 className="text-base font-semibold text-son-text">Leaderboard name</h2>
      <p className="mt-1 text-xs leading-relaxed text-son-textSecondary">
        Your Clerk name and email stay private. Choose a unique public name or use your stable alias.
      </p>
      {state.kind === 'loading' ? (
        <p className="mt-4 text-sm text-son-textMuted">Loading public identity...</p>
      ) : state.kind === 'error' ? (
        <p className="mt-4 text-sm text-son-red">Could not load your public identity.</p>
      ) : (
        <>
          <p className="mt-4 text-xs text-son-textMuted">
            Generated alias: <span className="font-semibold text-son-textSecondary">{state.identity.alias}</span>
          </p>
          <label className="mt-3 block text-xs font-semibold text-son-textSecondary">
            Optional public display name
            <input
              type="text"
              value={value}
              maxLength={24}
              onChange={(event) => setValue(event.target.value)}
              placeholder={state.identity.alias}
              className="mt-1 w-full rounded-lg border border-son-border bg-son-surface px-3 py-2.5 text-sm text-son-text outline-none focus:border-son-signalBlue"
            />
          </label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={saving || value.trim().length < 3}
              onClick={() => void save(value.trim())}
              className="rounded-lg bg-son-signalBlue px-3 py-2.5 text-xs font-bold text-son-textInverse disabled:opacity-40"
            >
              {saving ? 'Saving...' : 'Save name'}
            </button>
            <button
              type="button"
              disabled={saving || state.identity.displayName === null}
              onClick={() => void save(null)}
              className="rounded-lg border border-son-border px-3 py-2.5 text-xs font-bold text-son-textSecondary disabled:opacity-40"
            >
              Use alias
            </button>
          </div>
          {message ? (
            <p className={`mt-3 text-xs ${message.kind === 'success' ? 'text-son-green' : 'text-son-red'}`}>
              {message.text}
            </p>
          ) : null}
        </>
      )}
    </section>
  );
}
