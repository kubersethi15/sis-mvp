import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SIS - Skills Intelligence System',
  description: 'Discover your superpowers through storytelling',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
