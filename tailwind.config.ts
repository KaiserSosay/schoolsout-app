import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'purple-deep': '#1a0b2e',
        'purple-mid':  '#2d1b4e',
        'blue-deep':   '#0b1d3a',
        'cta-yellow':  '#facc15',
        'success':     '#10b981',
      },
      fontFamily: {
        display: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
        body: ['system-ui', 'sans-serif'],
      },
      borderRadius: { '2xl': '1rem' },
    },
  },
  plugins: [],
};

export default config;
