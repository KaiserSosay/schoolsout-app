// Phase 5.0 Calendar View — kid color palette for /app/calendar dots.
//
// Each kid gets a stable color drawn from a small palette. We assign
// by ordinal so the same kid keeps the same color across page loads
// without writing anything to the server (COPPA: no kid PII server-side).

export type KidColor = {
  // Background classes for the avatar circle + dot.
  bg: string;
  // Foreground (initial) text class.
  text: string;
  // CSS color value for inline use (SVG dots, focus rings).
  hex: string;
  // Slug used for localStorage filter key.
  slug: string;
};

const PALETTE: KidColor[] = [
  { bg: 'bg-brand-purple', text: 'text-white', hex: '#6B4FBB', slug: 'purple' },
  { bg: 'bg-sky-500',     text: 'text-white', hex: '#0EA5E9', slug: 'blue' },
  { bg: 'bg-emerald-500', text: 'text-white', hex: '#10B981', slug: 'green' },
  { bg: 'bg-rose-500',    text: 'text-white', hex: '#F43F5E', slug: 'red' },
  { bg: 'bg-gold',        text: 'text-ink',   hex: '#F5C842', slug: 'amber' },
  { bg: 'bg-orange-500',  text: 'text-white', hex: '#F97316', slug: 'orange' },
  { bg: 'bg-teal-500',    text: 'text-white', hex: '#14B8A6', slug: 'teal' },
];

export function colorForKidOrdinal(ordinal: number): KidColor {
  // ordinal is 1-based per the kid_profiles schema.
  const index = Math.max(0, ordinal - 1) % PALETTE.length;
  return PALETTE[index];
}
