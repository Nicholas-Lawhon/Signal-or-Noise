'use client';

import { SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';

/**
 * Daily Challenge start flow. Entry is login-gated (D048); gameplay itself
 * ships in a later phase, so signed-in players see the start flow shell.
 */
export default function DailyChallengePage() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-son-text">Daily Challenge</h1>
        <p className="mb-8 text-sm text-son-textSecondary">
          10 rounds &middot; Same scenarios for everyone &middot; Replay freely, your
          best completed attempt counts.
        </p>

        <SignedOut>
          <div className="rounded-2xl border border-son-border bg-son-card p-5">
            <h2 className="text-base font-semibold text-son-text">
              Sign in to play the Daily
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-son-textSecondary">
              The Daily Challenge is head-to-head with everyone playing the same
              scenarios, so it needs an account. Classic Run stays open to
              everyone &mdash; no login needed.
            </p>
            <SignInButton mode="modal">
              <button
                type="button"
                className="mt-4 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110"
              >
                Sign in
              </button>
            </SignInButton>
            <a
              href="/play/classic"
              className="mt-3 block rounded-lg border border-son-border bg-son-card px-4 py-3 text-center text-sm font-semibold text-son-textSecondary transition-colors hover:border-son-borderStrong"
            >
              Play Classic as a guest instead
            </a>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="rounded-2xl border border-son-border bg-son-card p-5">
            <h2 className="text-base font-semibold text-son-text">You&apos;re in.</h2>
            <p className="mt-1 text-sm leading-relaxed text-son-textSecondary">
              Your account is ready for the Daily Challenge. Daily gameplay
              arrives in an upcoming update &mdash; until then, sharpen your read
              with a Classic Run.
            </p>
            <a
              href="/play/classic"
              className="mt-4 block rounded-lg bg-son-signalBlue px-6 py-3 text-center text-base font-semibold text-son-textInverse transition-colors hover:brightness-110"
            >
              Play Classic Run
            </a>
          </div>
        </SignedIn>
      </div>
    </main>
  );
}
