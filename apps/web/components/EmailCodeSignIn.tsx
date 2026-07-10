'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSignIn } from '@clerk/nextjs';
import { safeLocalRedirect } from '@/lib/safeLocalRedirect';

type Step = 'email' | 'code';

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'errors' in error) {
    const errors = error.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0];
      if (typeof first === 'object' && first !== null) {
        if ('longMessage' in first && typeof first.longMessage === 'string') {
          return first.longMessage;
        }
        if ('message' in first && typeof first.message === 'string') return first.message;
      }
    }
  }
  return fallback;
}

/**
 * A code-only sign-in surface. It deliberately uses Clerk's email_code factor
 * and never creates an email_link attempt, avoiding cross-device/expired-link
 * failures while retaining Clerk's server-verified session boundary.
 */
export default function EmailCodeSignIn() {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoaded || pending) return;
    setPending(true);
    setError(null);
    try {
      const attempt = await signIn.create({ identifier: email.trim() });
      const emailCodeFactor = attempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (!emailCodeFactor || emailCodeFactor.strategy !== 'email_code') {
        setError(
          'Email code sign-in is not enabled for this app. Enable it in Clerk, then try again.',
        );
        return;
      }
      await attempt.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: emailCodeFactor.emailAddressId,
      });
      setStep('code');
    } catch (cause) {
      setError(errorMessage(cause, 'We could not send a code. Check the email address and try again.'));
    } finally {
      setPending(false);
    }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoaded || pending) return;
    setPending(true);
    setError(null);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code: code.trim(),
      });
      if (attempt.status !== 'complete' || !attempt.createdSessionId) {
        setError('That code could not complete sign-in. Request a fresh code and try again.');
        return;
      }
      await setActive({ session: attempt.createdSessionId });
      router.replace(safeLocalRedirect(new URLSearchParams(window.location.search).get('redirect_url')));
      router.refresh();
    } catch (cause) {
      setError(errorMessage(cause, 'That code did not work. Check it and try again.'));
    } finally {
      setPending(false);
    }
  };

  const resendCode = async () => {
    if (!isLoaded || pending) return;
    setPending(true);
    setError(null);
    try {
      const factor = signIn.supportedFirstFactors?.find((item) => item.strategy === 'email_code');
      if (!factor || factor.strategy !== 'email_code') {
        setError('A new code is unavailable. Go back and enter your email again.');
        return;
      }
      await signIn.prepareFirstFactor({
        strategy: 'email_code',
        emailAddressId: factor.emailAddressId,
      });
      setCode('');
    } catch (cause) {
      setError(errorMessage(cause, 'We could not resend the code. Try again shortly.'));
    } finally {
      setPending(false);
    }
  };

  if (!isLoaded) {
    return <p className="text-sm text-son-textMuted">Loading sign-in…</p>;
  }

  if (step === 'code') {
    return (
      <div className="w-full max-w-md rounded-2xl border border-son-border bg-son-card p-5">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-son-signalCyan">
          One-time code
        </p>
        <h1 className="mt-1 text-2xl font-bold text-son-text">Check your email</h1>
        <p className="mt-2 text-sm leading-relaxed text-son-textSecondary">
          We sent a sign-in code to <span className="font-medium text-son-text">{email}</span>.
          Enter it here&mdash;no sign-in link required.
        </p>
        <form className="mt-5" onSubmit={(event) => void verifyCode(event)}>
          <label htmlFor="email-code" className="mb-2 block text-sm font-semibold text-son-text">
            Email code
          </label>
          <input
            id="email-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            required
            autoFocus
            className="w-full rounded-lg border border-son-border bg-son-surface px-4 py-3 text-center text-lg tracking-[0.35em] text-son-text outline-none transition-colors focus:border-son-signalBlue"
          />
          {error ? (
            <p className="mt-3 rounded-lg border border-son-red/40 bg-son-red/10 px-3 py-2 text-sm text-son-red" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending || code.trim().length === 0}
            className="mt-4 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Verifying…' : 'Verify code'}
          </button>
        </form>
        <button
          type="button"
          disabled={pending}
          onClick={() => void resendCode()}
          className="mt-3 w-full rounded-lg border border-son-border bg-son-card px-4 py-3 text-sm font-semibold text-son-textSecondary disabled:opacity-60"
        >
          Send a new code
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setStep('email');
            setCode('');
            setError(null);
          }}
          className="mt-2 w-full px-4 py-2 text-sm font-semibold text-son-textMuted"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-son-border bg-son-card p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-son-signalCyan">Sign in</p>
      <h1 className="mt-1 text-2xl font-bold text-son-text">Get a code</h1>
      <p className="mt-2 text-sm leading-relaxed text-son-textSecondary">
        We&apos;ll email a one-time code. You won&apos;t need to open a sign-in link.
      </p>
      <form className="mt-5" onSubmit={(event) => void sendCode(event)}>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-son-text">
          Email address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          autoFocus
          className="w-full rounded-lg border border-son-border bg-son-surface px-4 py-3 text-sm text-son-text outline-none transition-colors placeholder:text-son-textMuted focus:border-son-signalBlue"
          placeholder="you@example.com"
        />
        {error ? (
          <p className="mt-3 rounded-lg border border-son-red/40 bg-son-red/10 px-3 py-2 text-sm text-son-red" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending || email.trim().length === 0}
          className="mt-4 w-full rounded-lg bg-son-signalBlue px-6 py-3 text-base font-semibold text-son-textInverse transition-colors hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Sending…' : 'Email me a code'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-son-textSecondary">
        New here?{' '}
        <a href="/sign-up" className="font-semibold text-son-signalCyan hover:underline">
          Create an account
        </a>
      </p>
    </div>
  );
}
