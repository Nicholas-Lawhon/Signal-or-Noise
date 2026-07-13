'use client';

import { useEffect, useState } from 'react';
import type { CurrentRunPayload } from '@signal-or-noise/shared-types';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/format';

/**
 * Offers to resume the active Classic Run (guest cookie or account). Renders
 * nothing while loading or when there is no run — setup is never blocked on it.
 */
export default function ResumeRunCard() {
  const [run, setRun] = useState<CurrentRunPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    void api
      .currentRun()
      .then((result) => {
        if (!cancelled && result.run?.mode === 'classic_run') setRun(result.run);
      })
      .catch(() => {
        // No resume offer on failure; starting a new run still works.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!run) return null;

  return (
    <a
      href="/play/classic/run"
      className="mb-6 block rounded-2xl border border-son-signalBlue/60 bg-son-card p-4 transition-colors hover:border-son-signalBlue"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-son-text">Resume your run</h2>
          <p className="mt-1 text-sm text-son-textSecondary">
            Round {run.currentRoundIndex + 1}/{run.totalRounds} &middot; Bankroll{' '}
            {formatMoney(run.currentBankroll)}
          </p>
        </div>
        <span className="text-sm font-semibold text-son-signalBlue">Continue &rarr;</span>
      </div>
      <p className="mt-2 text-xs text-son-textMuted">
        Starting a new run below abandons this one.
      </p>
    </a>
  );
}
