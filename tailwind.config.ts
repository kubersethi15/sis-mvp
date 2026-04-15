import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════
        // KAYA BRAND PALETTE v2.0 — April 2026
        // ═══════════════════════════════════════════════
        kaya: {
          // Navy — authority, trust, depth
          'navy-900': '#042C53',
          'navy-800': '#0A3D6E',
          'navy-600': '#185FA5',
          'navy-400': '#3D8BD4',
          'navy-100': '#C5DDEF',
          'navy-50':  '#E6F1FB',

          // Green — proof, success, progress
          // RULE: EXCLUSIVELY for verified/gate-cleared/success. Never decorative.
          'green-400': '#1D9E75',
          'green-300': '#2FBE8F',
          'green-100': '#B2E5D4',
          'green-50':  '#E1F5EE',

          // Stone — warm neutral
          'stone-600': '#5F5E5A',
          'stone-400': '#8A887F',
          'stone-200': '#B4B2A9',
          'stone-100': '#E3E1D8',
          'stone-50':  '#F1EFE8',

          // Red — errors, declined, destructive
          'red-400': '#D94F4F',
          'red-50':  '#FEF0F0',

          // Amber — warnings, pending, caution
          'amber-400': '#D4920A',
          'amber-50':  '#FFF8E6',
        },
      },
      fontFamily: {
        'display': ['"DM Serif Display"', 'Georgia', 'serif'],
        'sans':    ['"DM Sans"', 'Inter', 'Arial', 'sans-serif'],
        'mono':    ['"JetBrains Mono"', 'Courier New', 'monospace'],
      },
      fontSize: {
        // v2 type scale — DM Serif Display for display/H1, DM Sans for H2+
        'display':    ['3rem',     { lineHeight: '1.15', fontWeight: '400' }],  // 48pt
        'display-sm': ['2.25rem',  { lineHeight: '1.15', fontWeight: '400' }],  // 36pt
        'h1':         ['2rem',     { lineHeight: '1.25', fontWeight: '400' }],  // 32pt — DM Serif Display
        'h2':         ['1.125rem', { lineHeight: '1.4',  fontWeight: '700' }],  // 18pt — DM Sans Bold
        'h3':         ['0.9375rem',{ lineHeight: '1.4',  fontWeight: '600' }],  // 15pt — DM Sans Semibold
        'body':       ['0.9375rem',{ lineHeight: '1.65', fontWeight: '400' }],  // 15pt — DM Sans Regular
        'caption':    ['0.8125rem',{ lineHeight: '1.4',  fontWeight: '400' }],  // 13pt — DM Sans Regular
        'code':       ['0.875rem', { lineHeight: '1.5',  fontWeight: '400' }],  // 14pt — JetBrains Mono
      },
      borderRadius: {
        'kaya':    '0.75rem',   // 12px — cards, containers
        'kaya-lg': '1rem',      // 16px — large panels
        'kaya-sm': '0.5rem',    // 8px — buttons, inputs
        'kaya-pill': '6.25rem', // 100px — status pills
      },
      boxShadow: {
        'kaya':    '0 1px 3px rgba(4,44,83,0.08)',
        'kaya-md': '0 4px 16px rgba(4,44,83,0.10)',
        'kaya-lg': '0 8px 24px rgba(4,44,83,0.12)',
      },
    },
  },
  plugins: [],
};
export default config;
