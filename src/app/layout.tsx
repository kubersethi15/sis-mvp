import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kaya — Hiring Intelligence by Virtualahan',
  description: 'Show what you can do. Your stories become evidence.',
  manifest: undefined,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Kaya',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#102A43',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans" style={{ background: '#FAFAF9' }}>{children}</body>
    </html>
  );
}
