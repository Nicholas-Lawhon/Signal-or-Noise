import Link from 'next/link';
export default function LandingPage() {
  return (
    <main id="main-content" tabIndex={-1} className="page-shell flex min-h-[calc(100vh-8rem)] items-center">
      <div className="mx-auto grid w-full items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
      <div className="max-w-2xl">
        <p className="eyebrow">Market history, disguised</p>
        <h1 className="mt-3 text-5xl font-black tracking-[-.045em] text-son-text sm:text-6xl lg:text-7xl">
          Signal or Noise<span className="text-son-signalCyan">?</span>
        </h1>

        <p className="mt-5 text-xl font-semibold text-son-textSecondary sm:text-2xl">
          Can you find the signal through the noise?
        </p>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-son-textSecondary">
          Read a disguised market scenario, make the call, and see if you could have
          spotted the winner before the reveal. Real historical companies. One
          question: can you find the signal through the noise?
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link
          href="/play"
          className="button-primary text-lg"
        >
          Play Now
        </Link><Link href="/rules" className="button-secondary">How it works</Link></div>
      </div>
      <section className="panel relative overflow-hidden p-6 sm:p-8" aria-label="How a round works"><div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-son-signalCyan to-transparent"/><p className="text-xs font-bold uppercase tracking-widest text-son-textMuted">Hidden company · 2007</p><h2 className="mt-3 text-2xl font-black">A category leader faces a new kind of pressure.</h2><div className="mt-6 h-28 rounded-xl border border-son-borderSubtle bg-son-surface p-4"><div className="h-full rounded-lg bg-[linear-gradient(135deg,transparent_44%,rgba(56,213,230,.55)_45%,transparent_47%)]"/></div><div className="mt-5 grid grid-cols-3 gap-2">{['Long','Short','Pass'].map(x => <span key={x} className="rounded-xl border border-son-border px-2 py-3 text-center text-sm font-bold">{x}</span>)}</div><p className="mt-5 text-center text-sm font-semibold text-son-signalCyan">Make the call. Beat the reveal.</p></section>
      </div>
    </main>
  );
}
