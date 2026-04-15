// ═══════════════════════════════════════════════════════════════
// KAYA DESIGN SYSTEM
// Brand-compliant reusable components
// Source of truth: Kaya_Brand_Guidelines_v1.0
//
// Colors: Navy 900 (#042C53), Navy 600 (#185FA5), Navy 50 (#E6F1FB),
//         Green 400 (#1D9E75), Green 50 (#E1F5EE),
//         Stone 50 (#F1EFE8), Stone 200 (#B4B2A9), Stone 600 (#5F5E5A)
// Fonts: DM Serif Display (display/H1), DM Sans (system), JetBrains Mono (code/data)
// Rules: Stone 50 backgrounds. Green ONLY for verified/success. Sentence case.
// ═══════════════════════════════════════════════════════════════

import React from 'react';

// ────────────────────────────────────────
// PAGE SHELL — consistent layout wrapper
// ────────────────────────────────────────

export function PageShell({ children, title, subtitle, actions, backHref }: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  backHref?: string;
}) {
  return (
    <div className="min-h-screen bg-kaya-stone-50">
      {/* Top bar */}
      <header className="bg-kaya-navy-900 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {backHref && (
              <a href={backHref} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </a>
            )}
            <a href="/" className="flex items-center gap-2">
              <BloomMini />
              <span className="text-lg tracking-tight font-display text-white/90">kaya</span>
            </a>
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      </header>

      {/* Page header */}
      <div className="border-b border-kaya-stone-200 bg-white px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-h1 text-kaya-navy-900">{title}</h1>
          {subtitle && <p className="text-body text-kaya-stone-600 mt-1">{subtitle}</p>}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}

// ────────────────────────────────────────
// BLOOM MARK — mini version for nav
// ────────────────────────────────────────

function BloomMini() {
  return (
    <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="3" fill="#1D9E75"/>
      {[0, 51, 103, 154, 206, 257, 309].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x = 20 + 12 * Math.cos(rad);
        const y = 20 + 12 * Math.sin(rad);
        const color = i < 2 ? '#1D9E75' : '#185FA5';
        return <g key={i}>
          <line x1="20" y1="20" x2={x} y2={y} stroke={color} strokeWidth="1.5" opacity="0.6"/>
          <circle cx={x} cy={y} r="2" fill={color}/>
        </g>;
      })}
    </svg>
  );
}

// ────────────────────────────────────────
// TAB BAR — horizontal tab navigation
// ────────────────────────────────────────

export function TabBar({ tabs, active, onChange }: {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-0.5 border-b border-kaya-stone-200 mb-6 overflow-x-auto">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-h3 whitespace-nowrap transition-colors relative
            ${active === tab.id
              ? 'text-kaya-navy-900'
              : 'text-kaya-stone-600 hover:text-kaya-navy-600'}`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 text-caption px-1.5 py-0.5 rounded-full
              ${active === tab.id ? 'bg-kaya-navy-50 text-kaya-navy-600' : 'bg-kaya-stone-50 text-kaya-stone-600'}`}>
              {tab.count}
            </span>
          )}
          {active === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-kaya-navy-900"/>
          )}
        </button>
      ))}
    </div>
  );
}

// ────────────────────────────────────────
// CARD — content container
// ────────────────────────────────────────

export function Card({ children, className = '', padding = 'normal' }: {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'tight' | 'normal' | 'loose';
}) {
  const pad = { none: '', tight: 'p-4', normal: 'p-6', loose: 'p-8' }[padding];
  return (
    <div className={`bg-white rounded-kaya border border-kaya-stone-200 shadow-kaya ${pad} ${className}`}>
      {children}
    </div>
  );
}

// ────────────────────────────────────────
// SECTION HEADER — within cards
// ────────────────────────────────────────

export function SectionHeader({ title, subtitle, action }: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-h2 text-kaya-navy-900">{title}</h2>
        {subtitle && <p className="text-caption text-kaya-stone-600 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ────────────────────────────────────────
// BUTTON — primary, secondary, ghost
// ────────────────────────────────────────

export function Button({ children, variant = 'primary', size = 'default', disabled, onClick, className = '', type = 'button' }: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'ghost' | 'danger';
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const base = 'font-medium transition-all rounded-kaya inline-flex items-center justify-center';
  const sizes = {
    sm: 'text-caption px-3 py-1.5',
    default: 'text-h3 px-4 py-2.5',
    lg: 'text-h2 px-6 py-3',
  };
  const variants = {
    primary: 'bg-kaya-navy-900 text-white hover:bg-kaya-navy-900/90 active:bg-kaya-navy-900/80',
    secondary: 'bg-white text-kaya-navy-900 border border-kaya-stone-200 hover:bg-kaya-stone-50 active:bg-kaya-navy-50',
    success: 'bg-kaya-green-400 text-white hover:bg-kaya-green-400/90 active:bg-kaya-green-400/80',
    ghost: 'text-kaya-navy-600 hover:bg-kaya-navy-50 active:bg-kaya-navy-50/80',
    danger: 'bg-kaya-red-400 text-white hover:bg-kaya-red-400/90',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

// ────────────────────────────────────────
// STATUS BADGE — for gate states
// ────────────────────────────────────────

export function StatusBadge({ status, size = 'default' }: {
  status: 'passed' | 'pending' | 'held' | 'stopped' | 'declined' | 'selected' | 'active' | 'draft';
  size?: 'sm' | 'default';
}) {
  const config = {
    passed:   { bg: 'bg-kaya-green-50', text: 'text-[#0D5C45]', dot: 'bg-kaya-green-400', label: 'Passed' },
    selected: { bg: 'bg-kaya-green-50', text: 'text-[#0D5C45]', dot: 'bg-kaya-green-400', label: 'Selected' },
    active:   { bg: 'bg-kaya-navy-50', text: 'text-kaya-navy-900', dot: 'bg-kaya-navy-600', label: 'Active' },
    pending:  { bg: 'bg-kaya-amber-50', text: 'text-[#8B6914]', dot: 'bg-kaya-amber-400', label: 'Pending' },
    held:     { bg: 'bg-kaya-amber-50', text: 'text-[#8B6914]', dot: 'bg-kaya-amber-400', label: 'Held' },
    stopped:  { bg: 'bg-kaya-red-50', text: 'text-[#A13333]', dot: 'bg-kaya-red-400', label: 'Stopped' },
    declined: { bg: 'bg-kaya-red-50', text: 'text-[#A13333]', dot: 'bg-kaya-red-400', label: 'Declined' },
    draft:    { bg: 'bg-kaya-stone-50 border border-kaya-stone-100', text: 'text-kaya-stone-600', dot: 'bg-kaya-stone-400', label: 'Draft' },
  }[status];

  const sizing = size === 'sm' ? 'text-caption px-2 py-0.5' : 'text-caption px-3.5 py-1';

  return (
    <span className={`${config.bg} ${config.text} ${sizing} rounded-kaya-pill font-semibold inline-flex items-center gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ────────────────────────────────────────
// PROFICIENCY BADGE — for skill levels
// ────────────────────────────────────────

export function ProficiencyBadge({ level, size = 'default' }: {
  level: string;
  size?: 'sm' | 'default';
}) {
  const l = level?.toLowerCase() || '';
  const config = l.includes('advanced')
    ? { bg: 'bg-kaya-green-50', text: 'text-kaya-green-400' }
    : l.includes('intermediate')
    ? { bg: 'bg-kaya-navy-50', text: 'text-kaya-navy-600' }
    : { bg: 'bg-kaya-stone-50', text: 'text-kaya-stone-600' };

  const sizing = size === 'sm' ? 'text-caption px-1.5 py-0.5' : 'text-h3 px-2 py-0.5';

  return (
    <span className={`${config.bg} ${config.text} ${sizing} rounded-kaya-sm font-medium`}>
      {level}
    </span>
  );
}

// ────────────────────────────────────────
// CONFIDENCE BAR — horizontal bar
// ────────────────────────────────────────

export function ConfidenceBar({ value, size = 'default' }: {
  value: number; // 0-1
  size?: 'sm' | 'default';
}) {
  const height = size === 'sm' ? 'h-1' : 'h-1.5';
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className={`w-full ${height} rounded-full bg-kaya-stone-200/50`}>
      <div
        className={`${height} rounded-full transition-all bg-kaya-navy-600`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ────────────────────────────────────────
// GATE INDICATOR — visual gate progress
// ────────────────────────────────────────

export function GateIndicator({ gate, status }: {
  gate: 1 | 2 | 3;
  status: 'passed' | 'pending' | 'active' | 'locked';
}) {
  const labels = { 1: 'Alignment', 2: 'Evidence', 3: 'Predictability' };
  const colors = {
    passed: 'bg-kaya-green-400 text-white',
    active: 'bg-kaya-navy-900 text-white',
    pending: 'bg-kaya-navy-50 text-kaya-navy-600',
    locked: 'bg-kaya-stone-50 text-kaya-stone-200',
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-caption font-bold ${colors[status]}`}>
        {status === 'passed' ? '✓' : gate}
      </div>
      <div>
        <div className="text-h3 text-kaya-navy-900">Gate {gate}</div>
        <div className="text-caption text-kaya-stone-600">{labels[gate]}</div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// DATA TABLE — branded table
// ────────────────────────────────────────

export function DataTable({ headers, children }: {
  headers: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-kaya-navy-900">
            {headers.map((h, i) => (
              <th key={i} className="text-left text-caption font-bold text-kaya-navy-50 px-4 py-2.5 first:rounded-tl-kaya-sm last:rounded-tr-kaya-sm">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-kaya-stone-200">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tr className={`even:bg-kaya-stone-50 hover:bg-kaya-navy-50/50 transition-colors ${className}`}>{children}</tr>;
}

export function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-body text-kaya-stone-600 ${className}`}>{children}</td>;
}

// ────────────────────────────────────────
// METRIC CARD — for dashboard KPIs
// ────────────────────────────────────────

export function MetricCard({ label, value, sublabel, variant = 'default' }: {
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: 'default' | 'success' | 'navy';
}) {
  const bg = variant === 'success' ? 'bg-kaya-green-50' : variant === 'navy' ? 'bg-kaya-navy-50' : 'bg-white';
  const valueColor = variant === 'success' ? 'text-kaya-green-400' : variant === 'navy' ? 'text-kaya-navy-900' : 'text-kaya-navy-900';

  return (
    <div className={`${bg} rounded-kaya border border-kaya-stone-200 p-4`}>
      <div className={`text-display-sm ${valueColor} font-bold`}>{value}</div>
      <div className="text-h3 text-kaya-stone-600 mt-1">{label}</div>
      {sublabel && <div className="text-caption text-kaya-stone-200 mt-0.5">{sublabel}</div>}
    </div>
  );
}

// ────────────────────────────────────────
// LOADING STATE — navy-600 opacity per brand guide
// ────────────────────────────────────────

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 rounded-full border-2 border-kaya-navy-600/20 border-t-kaya-navy-600 animate-spin" />
        <span className="text-body text-kaya-stone-600">{message}</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// EMPTY STATE — for sections with no data
// ────────────────────────────────────────

export function EmptyState({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12">
      <p className="text-h2 text-kaya-stone-600">{title}</p>
      {description && <p className="text-body text-kaya-stone-200 mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ────────────────────────────────────────
// INPUT — form input
// ────────────────────────────────────────

export function Input({ label, ...props }: {
  label?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      {label && <label className="block text-h3 text-kaya-navy-900 mb-1">{label}</label>}
      <input
        {...props}
        className={`w-full px-3 py-2.5 text-body text-kaya-navy-900 bg-white border border-kaya-stone-200 rounded-kaya outline-none 
          focus:border-kaya-navy-600 focus:ring-1 focus:ring-kaya-navy-600/20 transition-colors
          placeholder:text-kaya-stone-200 ${props.className || ''}`}
      />
    </div>
  );
}

export function TextArea({ label, ...props }: {
  label?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      {label && <label className="block text-h3 text-kaya-navy-900 mb-1">{label}</label>}
      <textarea
        {...props}
        className={`w-full px-3 py-2.5 text-body text-kaya-navy-900 bg-white border border-kaya-stone-200 rounded-kaya outline-none resize-none
          focus:border-kaya-navy-600 focus:ring-1 focus:ring-kaya-navy-600/20 transition-colors
          placeholder:text-kaya-stone-200 ${props.className || ''}`}
      />
    </div>
  );
}

// ────────────────────────────────────────
// DIVIDER — 1pt Navy 600 rule per brand guide
// ────────────────────────────────────────

export function Divider() {
  return <hr className="border-t border-kaya-stone-200 my-6" />;
}

// ────────────────────────────────────────
// ALERT — informational or warning
// ────────────────────────────────────────

export function Alert({ children, variant = 'info' }: {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
}) {
  const styles = {
    info: 'bg-kaya-navy-50 border-kaya-navy-600 text-kaya-navy-900',
    success: 'bg-kaya-green-50 border-kaya-green-400 text-kaya-navy-900',
    warning: 'bg-kaya-amber-50 border-kaya-amber-400 text-kaya-navy-900',
    error: 'bg-kaya-red-50 border-kaya-red-400 text-kaya-navy-900',
  };

  return (
    <div className={`${styles[variant]} border-l-2 rounded-kaya-sm px-4 py-3 text-body`}>
      {children}
    </div>
  );
}
