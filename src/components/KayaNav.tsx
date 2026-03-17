'use client';

import Link from 'next/link';
import BloomMark from './BloomMark';

// ============================================================
// KAYA NAV — Shared navigation component
// Brand: Navy 900 background, Georgia wordmark, bloom mark
// Source: Kaya_Brand_Guidelines_v1.0 §2 + §6
// ============================================================

// Kaya colour palette (from brand guidelines)
export const KAYA = {
  navy900: '#102A43',
  navy800: '#243B53',
  navy600: '#486581',
  navy100: '#BCCCDC',
  navy50: '#F0F4F8',
  green400: '#48BB78',  // success / gate-cleared ONLY
  green50: '#F0FFF4',
  stone50: '#FAFAF9',   // default page background
  stone200: '#E2E8F0',
  text: {
    primary: '#102A43',    // headings, strong text
    secondary: '#334E68',  // body text
    muted: '#627D98',      // helper text
    light: '#829AB1',      // subtle text
  },
};

interface KayaNavProps {
  currentPage?: string;
}

export default function KayaNav({ currentPage }: KayaNavProps) {
  return (
    <nav className="px-6 py-3 flex items-center justify-between" style={{ background: KAYA.navy900 }}>
      <Link href="/" className="flex items-center gap-3">
        {/* Bloom mark placeholder — circle with node */}
        <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: KAYA.navy600 }}>
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: KAYA.green400 }} />
        </div>
        <span className="text-xl tracking-tight" style={{ fontFamily: 'Georgia, serif', color: KAYA.navy50 }}>kaya</span>
      </Link>
      <div className="flex items-center gap-4">
        {currentPage && (
          <span className="text-xs font-medium px-2 py-1 rounded" style={{ background: KAYA.navy800, color: KAYA.navy100 }}>
            {currentPage}
          </span>
        )}
        <span className="text-xs hidden sm:inline" style={{ color: KAYA.navy100 }}>kaya.work</span>
      </div>
    </nav>
  );
}

// Gate status badge — Green 400 for cleared, Navy for in-progress
export function GateStatusBadge({ status, label }: { status: 'cleared' | 'in_progress' | 'pending' | 'failed'; label: string }) {
  const styles: Record<string, { bg: string; text: string }> = {
    cleared: { bg: KAYA.green50, text: KAYA.green400 },
    in_progress: { bg: '#EBF5FF', text: '#3182CE' },
    pending: { bg: KAYA.navy50, text: KAYA.navy600 },
    failed: { bg: '#FFF5F5', text: '#E53E3E' },
  };
  const s = styles[status] || styles.pending;
  return (
    <span className="text-xs font-medium px-2 py-1 rounded" style={{ background: s.bg, color: s.text }}>
      {label}
    </span>
  );
}

// Section header with brand styling
export function KayaSection({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-lg font-semibold" style={{ color: KAYA.text.primary }}>{title}</h2>
      {subtitle && <p className="text-sm mt-1" style={{ color: KAYA.text.muted }}>{subtitle}</p>}
      <div className="mt-2 h-px" style={{ background: KAYA.stone200 }} />
    </div>
  );
}
