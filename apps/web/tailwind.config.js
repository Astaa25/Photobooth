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
        // Palet Gradien Pengguna
        night: {
          deep: '#010030',
          indigo: '#160078',
          violet: '#7226FF',
        },
        cyber: {
          dark: '#050C38',
          purple: '#6700A3',
          magenta: '#E02F75',
          coral: '#FF5A57',
        },
      },
      backgroundImage: {
        'gradient-night': 'linear-gradient(135deg, #010030 0%, #160078 50%, #7226FF 100%)',
        'gradient-cyber': 'linear-gradient(135deg, #050C38 0%, #6700A3 35%, #E02F75 70%, #FF5A57 100%)',
        'gradient-glow': 'radial-gradient(circle at 50% 0%, rgba(114, 38, 255, 0.25) 0%, rgba(1, 0, 48, 0) 70%)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        'pixel-display': ['var(--font-pixel-display)', 'ui-monospace', 'monospace'],
        'pixel-body': ['var(--font-pixel-body)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'raise-1': '0 1px 2px rgb(18 21 26 / 0.06), 0 1px 1px rgb(18 21 26 / 0.04)',
        'raise-2': '0 4px 12px rgb(18 21 26 / 0.08), 0 1px 3px rgb(18 21 26 / 0.05)',
        'raise-3': '0 16px 40px rgb(18 21 26 / 0.14), 0 4px 12px rgb(18 21 26 / 0.06)',
        'cyber-glow': '0 8px 32px rgba(224, 47, 117, 0.25)',
        'violet-glow': '0 8px 32px rgba(114, 38, 255, 0.25)',
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
