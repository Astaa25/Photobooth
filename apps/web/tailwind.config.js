/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
        },
        film: 'var(--film)',
        sheet: 'var(--sheet)',
        paper: {
          DEFAULT: 'var(--paper)',
          raised: 'var(--paper-raised)',
        },
        ultramarine: {
          DEFAULT: 'var(--ultramarine)',
          press: 'var(--ultramarine-press)',
          wash: 'var(--ultramarine-wash)',
        },
        flash: 'var(--flash)',
        signal: {
          ok: 'var(--signal-ok)',
          warn: 'var(--signal-warn)',
          bad: 'var(--signal-bad)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'raise-1': '0 1px 2px rgb(18 21 26 / 0.06), 0 1px 1px rgb(18 21 26 / 0.04)',
        'raise-2': '0 4px 12px rgb(18 21 26 / 0.08), 0 1px 3px rgb(18 21 26 / 0.05)',
        'raise-3': '0 16px 40px rgb(18 21 26 / 0.14), 0 4px 12px rgb(18 21 26 / 0.06)',
      },
      borderRadius: {
        chip: '6px',
        btn: '12px',
        panel: '20px',
        sheet: '32px',
      },
    },
  },
  plugins: [],
};
