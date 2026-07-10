import { SignIn } from '@clerk/nextjs';

/** Dedicated sign-in route used when a flow needs a full page instead of the modal. */
export default function SignInPage() {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-12">
      <SignIn />
    </main>
  );
}
