import { SignUp } from '@clerk/nextjs';

/** Dedicated sign-up route used when a flow needs a full page instead of the modal. */
export default function SignUpPage() {
  return (
    <main className="flex min-h-screen items-start justify-center px-4 py-12">
      <SignUp />
    </main>
  );
}
