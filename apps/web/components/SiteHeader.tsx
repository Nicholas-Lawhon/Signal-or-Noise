'use client';

import Link from 'next/link';
import {
  ClerkLoaded,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

/**
 * Optional-auth header. Gameplay never waits on this: while Clerk is loading
 * (or unavailable) the auth corner simply stays empty and the game links work.
 */
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-son-borderSubtle bg-son-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-base font-black tracking-tight text-son-text">
          Signal or Noise<span className="text-son-signalCyan">?</span>
        </Link>
        <nav aria-label="Primary navigation" className="hidden items-center gap-6 lg:flex">
          <Link href="/play" className="text-sm font-semibold text-son-textSecondary hover:text-son-text">Play</Link>
          <Link
            href="/leaderboards"
            className="text-sm font-semibold text-son-textSecondary transition-colors hover:text-son-text"
          >
            Leaderboards
          </Link>
          <Link href="/rules" className="text-sm font-semibold text-son-textSecondary hover:text-son-text">Rules</Link>
        </nav>
        <div className="flex min-h-8 items-center gap-3"><ClerkLoaded>
            <SignedOut>
              <Link
                href="/sign-in"
                className="rounded-lg border border-son-border bg-son-card px-3 py-1.5 text-xs font-semibold text-son-textSecondary transition-colors hover:border-son-borderStrong hover:text-son-text"
              >
                Sign in
              </Link>
            </SignedOut>
            <SignedIn>
              <Link
                href="/profile"
                className="text-xs font-semibold text-son-textSecondary transition-colors hover:text-son-text"
              >
                My stats
              </Link>
              <UserButton
                appearance={{
                  elements: { userButtonAvatarBox: 'h-7 w-7' },
                }}
              />
            </SignedIn>
          </ClerkLoaded></div>
      </div>
      <nav aria-label="Game help" className="mx-auto flex max-w-6xl items-center gap-5 border-t border-son-borderSubtle px-4 py-2 text-xs font-semibold text-son-textMuted sm:px-6 lg:hidden">
        <Link href="/rules" className="hover:text-son-text">Rules</Link>
        <Link href="/settings" className="hover:text-son-text">Settings</Link>
      </nav>
    </header>
  );
}
