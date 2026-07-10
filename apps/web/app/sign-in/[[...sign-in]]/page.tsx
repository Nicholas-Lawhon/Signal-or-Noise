import EmailCodeSignIn from '@/components/EmailCodeSignIn';

/** Dedicated code-only sign-in route. Magic-link verification is never requested here. */
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-12">
      <EmailCodeSignIn />
    </main>
  );
}
