import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Signal or Noise?',
  description: 'Can you find the signal through the noise?',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-son-bg text-son-text antialiased">{children}</body>
    </html>
  );
}
