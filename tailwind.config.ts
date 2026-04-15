import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ═══════════════════════════════════════════════
        // KAYA BRAND PALETTE — from Kaya_Brand_Guidelines_v1.0
        // These are the ONLY colors to use in the UI.
        // ═══════════════════════════════════════════════
        kaya: {
          // Navy — authority, trust, depth
          'navy-900': '#042C53',
          'navy-600': '#185FA5',
          'navy-100': '#B8D4ED',
          'navy-50':  '#E6F1FB',

          // Green — proof, success, progress
          // RULE: EXCLUSIVELY for verified/gate-cleared/success. Never decorative.
          'green-400': '#1D9E75',
          'green-50':  '#E1F5EE',

          // Stone — warm neutral
          'stone-50':  '#F1EFE8',
          'stone-200': '#B4B2A9',
          'stone-600': '#5F5E5A',

          // Functional
          'error':     '#C0392B',
          'error-bg':  '#FDEDEC',
          'warning':   '#D4880F',
          'warning-bg':'#FEF5E7',
        },
      },
      fontFamily: {
        'display': ['Georgia', 'serif'],
        'sans': ['Inter', 'Arial', 'Helvetica Neue', 'sans-serif'],
        'mono': ['Courier New', 'monospace'],
      },
      fontSize: {
        'display':    ['3rem',      { lineHeight: '1.1', fontWeight: '700' }],
        'display-sm': ['2.25rem',   { lineHeight: '1.15', fontWeight: '700' }],
        'h1':         ['1.125rem',  { lineHeight: '1.4', fontWeight: '700' }],
        'h2':         ['0.875rem',  { lineHeight: '1.4', fontWeight: '700' }],
        'h3':         ['0.6875rem', { lineHeight: '1.4', fontWeight: '700' }],
        'body':       ['0.6875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption':    ['0.5625rem', { lineHeight: '1.4', fontWeight: '400' }],
      },
      borderRadius: {
        'kaya':    '0.5rem',
        'kaya-lg': '0.75rem',
        'kaya-sm': '0.25rem',
      },
      boxShadow: {
        'kaya':    '0 1px 3px rgba(4,44,83,0.06), 0 1px 2px rgba(4,44,83,0.04)',
        'kaya-md': '0 4px 12px rgba(4,44,83,0.08), 0 2px 4px rgba(4,44,83,0.04)',
        'kaya-lg': '0 8px 24px rgba(4,44,83,0.10), 0 4px 8px rgba(4,44,83,0.06)',
      },
    },
  },
  plugins: [],
};
export default config;
