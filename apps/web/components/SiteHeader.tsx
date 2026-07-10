'use client';

import Link from 'next/link';
import {
  ClerkLoaded,
  SignInButton,
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
      <div className="mx-auto flex h-12 w-full max-w-md items-center justify-between px-4">
        <Link href="/" className="text-sm font-bold tracking-tight text-son-text">
          Signal or Noise<span className="text-son-signalCyan">?</span>
        </Link>
        <div className="flex min-h-8 items-center gap-3">
          <ClerkLoaded>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="rounded-lg border border-son-border bg-son-card px-3 py-1.5 text-xs font-semibold text-son-textSecondary transition-colors hover:border-son-borderStrong hover:text-son-text"
                >
                  Sign in
                </button>
              </SignInButton>
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
          </ClerkLoaded>
        </div>
      </div>
    </header>
  );
}
