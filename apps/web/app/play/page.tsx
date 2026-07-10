export default function PlayPage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-son-text">Choose a Mode</h1>
        <p className="mb-8 text-sm text-son-textSecondary">
          Pick your challenge and make the call.
        </p>

        <div className="space-y-4">
          <a
            href="/play/classic"
            className="block rounded-2xl border border-son-border bg-son-card p-5 transition-colors hover:border-son-signalBlue/50"
          >
            <h2 className="text-lg font-semibold text-son-text">Classic Run</h2>
            <p className="mt-1 text-sm text-son-textSecondary">
              10–20 rounds &middot; Choose difficulty &middot; Build your bankroll
            </p>
          </a>

          <a
            href="/play/daily"
            className="block rounded-2xl border border-son-border bg-son-card p-5 transition-colors hover:border-son-signalBlue/50"
          >
            <h2 className="text-lg font-semibold text-son-text">Daily Challenge</h2>
            <p className="mt-1 text-sm text-son-textSecondary">
              10 rounds &middot; Same challenge for everyone &middot; Climb today&apos;s
              leaderboard
            </p>
            <span className="mt-2 inline-block rounded-full border border-son-borderSubtle px-3 py-0.5 text-xs text-son-textMuted">
              Login required &middot; Gameplay coming soon
            </span>
          </a>

          <div className="rounded-2xl border border-son-borderSubtle/50 bg-son-card/50 p-5 opacity-60">
            <h2 className="text-lg font-semibold text-son-textMuted">Portfolio Draft</h2>
            <p className="mt-1 text-sm text-son-textMuted">Draft your portfolio of picks.</p>
            <span className="mt-2 inline-block rounded-full border border-son-borderSubtle px-3 py-0.5 text-xs text-son-textMuted">
              Coming soon
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
