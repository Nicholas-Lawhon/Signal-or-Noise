import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

/**
 * Public-by-default: the middleware only makes the verified Clerk session
 * available to server code. No route is protected here — gameplay stays open
 * to guests, and login-gated behavior (saved stats, claiming, Daily entry) is
 * enforced by the server identity boundary and the database services.
 */
export default process.env.E2E_PUBLIC_MODE === 'true'
  ? () => NextResponse.next()
  : clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static assets.
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes.
    '/(api|trpc)(.*)',
  ],
};
