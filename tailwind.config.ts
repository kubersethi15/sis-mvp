import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Kaya Brand Palette (from Kaya_Brand_Guidelines_v1.0)
        navy: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          200: '#BCCCDC',
          300: '#9FB3C8',
          400: '#829AB1',
          500: '#627D98',
          600: '#486581',
          700: '#334E68',
          800: '#243B53',
          900: '#102A43',
        },
        proof: {
          400: '#48BB78',  // Green 400 — success, gate-cleared, verified states ONLY
          500: '#38A169',
        },
        stone: {
          50: '#FAFAF9',   // Warm default page background (replaces pure white)
        },
      },
      fontFamily: {
        'georgia': ['Georgia', 'serif'],   // Wordmark only
        'sans': ['Arial', 'Helvetica Neue', 'sans-serif'],  // Everything else
      },
    },
  },
  plugins: [],
};
export default config;
