import TrackedLink from '@/components/TrackedLink';
export default function PlayPage() {
  return (
    <main className="page-shell">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="mb-1 text-2xl font-bold text-son-text">Choose a Mode</h1>
        <p className="mb-8 text-sm text-son-textSecondary">
          Pick your challenge and make the call.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <TrackedLink event={{ name: 'mode_selected', properties: { mode: 'classic' } }}
            href="/play/classic"
            className="panel block min-h-44 p-6 transition hover:-translate-y-1 hover:border-son-signalBlue/60"
          >
            <h2 className="text-lg font-semibold text-son-text">Classic Run</h2>
            <p className="mt-1 text-sm text-son-textSecondary">
              10–20 rounds &middot; Choose difficulty &middot; Build your bankroll
            </p>
          </TrackedLink>

          <TrackedLink event={{ name: 'mode_selected', properties: { mode: 'daily' } }}
            href="/play/daily"
            className="panel block min-h-44 p-6 transition hover:-translate-y-1 hover:border-son-signalBlue/60"
          >
            <h2 className="text-lg font-semibold text-son-text">Daily Challenge</h2>
            <p className="mt-1 text-sm text-son-textSecondary">
              10 rounds &middot; Same challenge for everyone &middot; Climb today&apos;s
              leaderboard
            </p>
            <span className="mt-2 inline-block rounded-full border border-son-borderSubtle px-3 py-0.5 text-xs text-son-textMuted">
              Login required &middot; Replay freely
            </span>
          </TrackedLink>

          <div className="panel min-h-44 p-6 opacity-70">
            <h2 className="text-lg font-semibold text-son-textMuted">Portfolio Draft</h2>
            <p className="mt-1 text-sm text-son-textMuted">Draft your portfolio of picks.</p>
            <span className="mt-2 inline-block rounded-full border border-son-borderSubtle px-3 py-0.5 text-xs text-son-textMuted">
              Coming soon
            </span>
          </div>
          <div className="panel min-h-44 p-6 opacity-70"><h2 className="text-lg font-semibold">Friend Battle</h2><p className="mt-1 text-sm text-son-textMuted">Face a friend on the same historical signals.</p><span className="mt-2 inline-block rounded-full border border-son-borderSubtle px-3 py-0.5 text-xs text-son-textMuted">Coming soon</span></div>
        </div>
      </div>
    </main>
  );
}
