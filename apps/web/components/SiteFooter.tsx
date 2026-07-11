import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-son-borderSubtle bg-son-bg/80 pb-24 pt-8 lg:pb-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 text-xs text-son-textMuted sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p className="max-w-2xl leading-relaxed">Signal or Noise? is a game using historical market scenarios for entertainment and trivia. It does not provide financial advice, investment recommendations, or real-money trading.</p>
        <nav aria-label="Legal and settings" className="flex flex-wrap gap-x-5 gap-y-3">
          <Link href="/rules">Rules</Link><Link href="/settings">Settings</Link><Link href="/disclaimer">Disclaimer</Link>
        </nav>
      </div>
    </footer>
  );
}
