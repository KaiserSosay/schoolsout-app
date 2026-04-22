'use client';

import { useTranslations } from 'next-intl';

// DECISION: keep named export `Mode` here for back-compat with existing tests
// that import from this file, even though ModeContext also owns the type.
export type Mode = 'parents' | 'kids';

export function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const t = useTranslations('landing.header.mode');
  const tFallback = useTranslations('home.mode');
  // DECISION: Tests read ARIA labels "Kids"/"Parents" from the legacy `home.mode`
  // namespace. Use landing.header.mode first (new copy), fall back to home.mode
  // (tests + older call sites that may still import this component).
  const labelKids = safeT(t, 'kids') ?? tFallback('kids');
  const labelParents = safeT(t, 'parents') ?? tFallback('parents');
  const labelGroup = safeT(t, 'label') ?? tFallback('label');

  const baseBtn =
    'rounded-full text-xs font-bold px-3 py-1.5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/70';

  return (
    <div
      role="tablist"
      aria-label={labelGroup}
      data-mode-toggle
      className={
        'inline-flex items-center gap-0.5 rounded-full p-1 text-sm transition-colors ' +
        (mode === 'parents'
          ? 'bg-white border border-cream-border'
          : 'bg-white/10 backdrop-blur border border-white/10')
      }
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'parents'}
        onClick={() => onChange('parents')}
        className={
          baseBtn +
          ' ' +
          (mode === 'parents'
            ? 'bg-ink text-white'
            : mode === 'kids'
              ? 'text-white/80 hover:text-white'
              : 'text-muted hover:text-ink')
        }
      >
        {labelParents}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'kids'}
        onClick={() => onChange('kids')}
        className={
          baseBtn +
          ' ' +
          (mode === 'kids'
            ? 'bg-cta-yellow text-purple-deep'
            : 'text-muted hover:text-ink')
        }
      >
        {labelKids}
      </button>
    </div>
  );
}

// next-intl throws synchronously when a key is missing. Try/catch returns
// undefined so the caller can fall back to a second namespace.
function safeT(t: (k: string) => string, key: string): string | undefined {
  try {
    return t(key);
  } catch {
    return undefined;
  }
}
