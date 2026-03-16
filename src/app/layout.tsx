import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kaya — Hiring Intelligence by Virtualahan',
  description: 'Show what you can do. Your stories become evidence.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-stone-50 font-sans">{children}</body>
    </html>
  );
}
