// Kaya Design System — Shared UI Components
// Based on Kaya Brand Guidelines v1.0
// Colors: Navy 900/600/50, Green 400/50, Stone 50/200/600
// Typography: Inter (system), Georgia (wordmark/display only)
// Rules: Stone 50 bg (never white). Green ONLY for verified/success. Sentence case headings.

import React from 'react';
import Link from 'next/link';

// ============================================================
// PAGE SHELL — consistent layout wrapper for all dashboards
// ============================================================

interface PageShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  nav?: { label: string; href: string; active?: boolean }[];
}

export function PageShell({ children, title, subtitle, backHref, backLabel, actions, nav }: PageShellProps) {
  return (
    <div className="min-h-screen bg-kaya-stone-50">
      {/* Top bar */}
      <header className="bg-kaya-navy-900 px-6 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {backHref && (
              <Link href={backHref} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </Link>
            )}
            <Link href="/" className="flex items-center gap-2.5">
              <BloomMini />
              <span className="text-lg tracking-tight font-display text-kaya-navy-50">kaya</span>
            </Link>
          </div>
          {nav && (
            <nav className="hidden sm:flex items-center gap-1">
              {nav.map(item => (
                <Link key={item.href} href={item.href}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    item.active ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'
                  }`}>
                  {item.label}
                </Link>
              ))}
            </nav>
          )}
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </header>

      {/* Page title */}
      <div className="border-b border-kaya-stone-200/60 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              {backLabel && backHref && (
                <Link href={backHref} className="text-caption text-kaya-navy-600 hover:underline mb-1 inline-block">← {backLabel}</Link>
              )}
              <h1 className="text-h1 text-kaya-navy-900">{title}</h1>
              {subtitle && <p className="text-body text-kaya-stone-600 mt-0.5">{subtitle}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {children}
      </main>
    </div>
  );
}

// ============================================================
// BLOOM MARK — mini version for nav
// ============================================================

function BloomMini() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="2.5" fill="#E6F1FB" />
      {[0, 51, 103, 154, 206, 257, 309].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x2 = 12 + 8 * Math.cos(rad);
        const y2 = 12 + 8 * Math.sin(rad);
        const isGreen = i >= 5;
        return (
          <g key={i}>
            <line x1="12" y1="12" x2={x2} y2={y2} stroke={isGreen ? '#1D9E75' : '#185FA5'} strokeWidth="1.5" opacity="0.7" />
            <circle cx={x2} cy={y2} r="2" fill={isGreen ? '#1D9E75' : '#185FA5'} />
          </g>
        );
      })}
    </svg>
  );
}

// ============================================================
// CARD — content container
// ============================================================

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const pad = padding === 'sm' ? 'p-4' : padding === 'lg' ? 'p-8' : 'p-6';
  return (
    <div className={`bg-white rounded-kaya-lg border border-kaya-stone-200/60 shadow-kaya ${pad} ${className}`}>
      {children}
    </div>
  );
}

// ============================================================
// SECTION — titled content section within a card or page
// ============================================================

interface SectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export function Section({ title, subtitle, children, action }: SectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-h2 text-kaya-navy-900">{title}</h2>
          {subtitle && <p className="text-caption text-kaya-stone-600 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ============================================================
// BUTTON — primary / secondary / ghost
// ============================================================

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ variant = 'primary', size = 'md', className = '', children, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold transition-all rounded-kaya disabled:opacity-40 disabled:cursor-not-allowed';
  const sizes = {
    sm: 'text-caption px-3 py-1.5',
    md: 'text-body px-4 py-2.5',
    lg: 'text-h3 px-6 py-3',
  };
  const variants = {
    primary: 'bg-kaya-navy-900 text-white hover:bg-kaya-navy-900/90 active:bg-kaya-navy-900/80',
    secondary: 'bg-kaya-navy-50 text-kaya-navy-900 hover:bg-kaya-navy-100 border border-kaya-stone-200/60',
    ghost: 'text-kaya-navy-600 hover:bg-kaya-navy-50',
    success: 'bg-kaya-green-400 text-white hover:bg-kaya-green-400/90',
    danger: 'bg-kaya-error text-white hover:bg-kaya-error/90',
  };

  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

// ============================================================
// BADGE — status indicators
// ============================================================

type BadgeVariant = 'navy' | 'green' | 'warning' | 'error' | 'stone' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'stone', size = 'sm' }: BadgeProps) {
  const variants: Record<BadgeVariant, string> = {
    navy: 'bg-kaya-navy-900 text-white',
    green: 'bg-kaya-green-50 text-kaya-green-400',
    warning: 'bg-kaya-warning-bg text-kaya-warning',
    error: 'bg-kaya-error-bg text-kaya-error',
    stone: 'bg-kaya-stone-50 text-kaya-stone-600',
    info: 'bg-kaya-navy-50 text-kaya-navy-600',
  };
  const sizes = { sm: 'text-caption px-2 py-0.5', md: 'text-body px-2.5 py-1' };

  return (
    <span className={`inline-flex items-center font-medium rounded-kaya-sm ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

// ============================================================
// GATE BADGE — specifically for gate status
// ============================================================

export function GateBadge({ gate, status }: { gate: 1 | 2 | 3; status: string }) {
  const gateLabels = { 1: 'Alignment', 2: 'Evidence', 3: 'Predictability' };
  const statusVariant: Record<string, BadgeVariant> = {
    passed: 'green', pending: 'warning', held: 'warning',
    stopped: 'error', declined: 'error', selected: 'green',
  };
  const variant = statusVariant[status] || 'stone';

  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 rounded-full flex items-center justify-center text-caption font-bold bg-kaya-navy-900 text-white">
        {gate}
      </div>
      <div>
        <span className="text-caption font-semibold text-kaya-navy-900">Gate {gate}: {gateLabels[gate]}</span>
        <Badge variant={variant} size="sm">{status}</Badge>
      </div>
    </div>
  );
}

// ============================================================
// STAT CARD — metric display
// ============================================================

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: 'default' | 'success' | 'warning';
}

export function StatCard({ label, value, sublabel, variant = 'default' }: StatCardProps) {
  const colors = {
    default: 'text-kaya-navy-900',
    success: 'text-kaya-green-400',
    warning: 'text-kaya-warning',
  };
  return (
    <div className="p-4 rounded-kaya bg-white border border-kaya-stone-200/60">
      <div className={`text-display-sm font-bold ${colors[variant]}`}>{value}</div>
      <div className="text-caption text-kaya-stone-600 mt-0.5">{label}</div>
      {sublabel && <div className="text-caption text-kaya-stone-200 mt-0.5">{sublabel}</div>}
    </div>
  );
}

// ============================================================
// SKILL BAR — proficiency display
// ============================================================

export function SkillBar({ name, proficiency, confidence }: { name: string; proficiency: string; confidence: number }) {
  const profColors: Record<string, string> = {
    'Advanced': 'bg-kaya-green-400',
    'Intermediate': 'bg-kaya-navy-600',
    'Basic': 'bg-kaya-stone-200',
  };
  const profBadge: Record<string, BadgeVariant> = {
    'Advanced': 'green',
    'Intermediate': 'info',
    'Basic': 'stone',
  };

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-body font-medium text-kaya-navy-900 w-36 flex-none">{name}</span>
      <div className="flex-1 h-1.5 rounded-full bg-kaya-stone-50">
        <div className={`h-full rounded-full transition-all ${profColors[proficiency] || 'bg-kaya-stone-200'}`}
          style={{ width: `${Math.round(confidence * 100)}%` }} />
      </div>
      <Badge variant={profBadge[proficiency] || 'stone'} size="sm">{proficiency}</Badge>
      <span className="text-caption text-kaya-stone-200 w-10 text-right font-mono">{Math.round(confidence * 100)}%</span>
    </div>
  );
}

// ============================================================
// TAB BAR — horizontal tab navigation
// ============================================================

interface TabBarProps<T extends string> {
  tabs: { id: T; label: string; count?: number }[];
  active: T;
  onChange: (id: T) => void;
}

export function TabBar<T extends string>({ tabs, active, onChange }: TabBarProps<T>) {
  return (
    <div className="flex gap-0.5 border-b border-kaya-stone-200/60 mb-6">
      {tabs.map(tab => (
        <button key={tab.id} onClick={() => onChange(tab.id)}
          className={`px-4 py-2.5 text-body font-medium transition-colors border-b-2 -mb-px ${
            active === tab.id
              ? 'border-kaya-navy-900 text-kaya-navy-900'
              : 'border-transparent text-kaya-stone-600 hover:text-kaya-navy-600'
          }`}>
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-1.5 text-caption px-1.5 py-0.5 rounded-full ${
              active === tab.id ? 'bg-kaya-navy-900 text-white' : 'bg-kaya-stone-50 text-kaya-stone-600'
            }`}>{tab.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ============================================================
// DATA TABLE — clean enterprise table
// ============================================================

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
}

export function DataTable({ headers, children }: DataTableProps) {
  return (
    <div className="overflow-x-auto rounded-kaya border border-kaya-stone-200/60">
      <table className="w-full">
        <thead>
          <tr className="bg-kaya-navy-900">
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-2.5 text-caption font-semibold text-kaya-navy-50">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-kaya-stone-200/40">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function TableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <tr className={`hover:bg-kaya-stone-50/50 transition-colors ${className}`}>{children}</tr>;
}

export function TableCell({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 text-body text-kaya-stone-600 ${className}`}>{children}</td>;
}

// ============================================================
// FORM FIELD — labeled input
// ============================================================

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}

export function FormField({ label, required, children, hint }: FormFieldProps) {
  return (
    <div>
      <label className="block text-h3 text-kaya-navy-900 mb-1.5">
        {label}{required && <span className="text-kaya-error ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-caption text-kaya-stone-200 mt-1">{hint}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`w-full px-3 py-2.5 rounded-kaya border border-kaya-stone-200 text-body text-kaya-navy-900 bg-white
      placeholder:text-kaya-stone-200 focus:outline-none focus:ring-2 focus:ring-kaya-navy-600/20 focus:border-kaya-navy-600 transition-colors
      disabled:bg-kaya-stone-50 disabled:text-kaya-stone-200 ${props.className || ''}`} />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`w-full px-3 py-2.5 rounded-kaya border border-kaya-stone-200 text-body text-kaya-navy-900 bg-white
      placeholder:text-kaya-stone-200 focus:outline-none focus:ring-2 focus:ring-kaya-navy-600/20 focus:border-kaya-navy-600 transition-colors resize-none
      disabled:bg-kaya-stone-50 disabled:text-kaya-stone-200 ${props.className || ''}`} />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select {...props} className={`w-full px-3 py-2.5 rounded-kaya border border-kaya-stone-200 text-body text-kaya-navy-900 bg-white
      focus:outline-none focus:ring-2 focus:ring-kaya-navy-600/20 focus:border-kaya-navy-600 transition-colors ${props.className || ''}`} />
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="py-12 text-center">
      <p className="text-h2 text-kaya-navy-900 mb-1">{title}</p>
      <p className="text-body text-kaya-stone-600 mb-4 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  );
}

// ============================================================
// LOADING STATE — Navy 600 at reduced opacity (per brand guide, NOT a spinner)
// ============================================================

export function Loading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="py-12 text-center">
      <div className="inline-flex items-center gap-2">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-kaya-navy-600"
              style={{ opacity: 0.3, animation: `kayaPulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <span className="text-body text-kaya-stone-600">{text}</span>
      </div>
    </div>
  );
}

// ============================================================
// DIVIDER — 1pt Navy 600 rule (per brand guide section dividers)
// ============================================================

export function Divider() {
  return <hr className="border-t border-kaya-stone-200/60 my-6" />;
}
