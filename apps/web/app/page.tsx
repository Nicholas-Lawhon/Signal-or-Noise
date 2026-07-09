export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold tracking-tight text-son-text">
          Signal or Noise<span className="text-son-signalCyan">?</span>
        </h1>

        <p className="mt-3 text-lg text-son-textSecondary">
          Can you find the signal through the noise?
        </p>

        <p className="mt-6 text-sm leading-relaxed text-son-textSecondary">
          Read a disguised market scenario, make the call, and see if you could have
          spotted the winner before the reveal. Real historical companies. One
          question: is it a signal worth betting on, or just noise?
        </p>

        <a
          href="/play"
          className="mt-8 inline-block rounded-lg bg-son-signalBlue px-8 py-3 text-lg font-semibold text-son-textInverse transition-colors hover:brightness-110"
        >
          Play Now
        </a>

        <footer className="mt-16 text-xs leading-relaxed text-son-textMuted">
          Signal or Noise? is a game using historical market scenarios for
          entertainment and trivia. It does not provide financial advice,
          investment recommendations, or real-money trading.
        </footer>
      </div>
    </main>
  );
}
