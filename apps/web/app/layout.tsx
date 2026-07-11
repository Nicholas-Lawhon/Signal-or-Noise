import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import MobileNav from '@/components/MobileNav';
import AnalyticsProvider from '@/components/AnalyticsProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signal or Noise?',
  description: 'Can you find the signal through the noise?',
};

/** Clerk prebuilt UI themed to the dark game surface (tailwind `son` palette). */
const clerkAppearance = {
  variables: {
    colorPrimary: '#4DA3FF',
    colorBackground: '#111F35',
    colorText: '#F4F7FB',
    colorTextSecondary: '#A9B7CA',
    colorInputBackground: '#0E1A2D',
    colorInputText: '#F4F7FB',
    colorDanger: '#FF5C73',
    colorSuccess: '#35D07F',
    colorWarning: '#FFB84D',
    colorNeutral: '#A9B7CA',
    borderRadius: '0.75rem',
  },
  elements: {
    card: 'border border-son-border shadow-none',
    modalContent: 'items-center',
  },
} as const;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
    >
      <html lang="en">
        <body className="min-h-screen bg-son-bg text-son-text antialiased">
          <a
            href="#main-content"
            className="sr-only fixed left-4 top-4 z-[60] rounded-lg bg-son-signalCyan px-4 py-2 font-bold text-son-bg focus:not-sr-only"
          >
            Skip to content
          </a>
          <AnalyticsProvider />
          <SiteHeader />
          <div className="min-h-[calc(100vh-4rem)]">{children}</div>
          <SiteFooter />
          <MobileNav />
        </body>
      </html>
    </ClerkProvider>
  );
}
