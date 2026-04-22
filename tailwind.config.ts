import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Kids-mode tokens (retain existing dark gradient stops)
        'purple-deep': '#1a0b2e',
        'purple-mid':  '#2d1b4e',
        'blue-deep':   '#0b1d3a',
        'cta-yellow':  '#facc15',
        'success':     '#10b981',

        // Parents-mode editorial palette
        cream:          '#FBF8F1',
        ink:            '#1A1A1A',
        muted:          '#71717A',
        'cream-border': '#E8E4DA',
        gold:           '#F5C842',
        'brand-purple': '#6B4FBB',
        'purple-soft':  'rgba(107,79,187,0.08)',
      },
      fontFamily: {
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        body: ['system-ui', 'sans-serif'],
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
      letterSpacing: {
        'editorial': '-0.03em',
      },
    },
  },
  plugins: [],
};

export default config;
