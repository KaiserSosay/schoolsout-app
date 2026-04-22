'use client';

import { useTranslations } from 'next-intl';

export type Mode = 'kids' | 'parents';

export function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const t = useTranslations('home.mode');
  const base =
    'px-3 py-1 rounded-full text-xs font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cta-yellow';
  return (
    <div
      role="tablist"
      aria-label={t('label')}
      className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur p-1 text-sm"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'kids'}
        onClick={() => onChange('kids')}
        className={
          base +
          ' ' +
          (mode === 'kids'
            ? 'bg-cta-yellow text-purple-deep'
            : 'text-white/80 hover:text-white')
        }
      >
        {t('kids')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'parents'}
        onClick={() => onChange('parents')}
        className={
          base +
          ' ' +
          (mode === 'parents'
            ? 'bg-white text-slate-900'
            : 'text-white/80 hover:text-white')
        }
      >
        {t('parents')}
      </button>
    </div>
  );
}
