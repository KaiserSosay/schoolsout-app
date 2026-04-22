'use client';

import { useMode } from './ModeContext';

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const { mode } = useMode();
  return (
    <span
      className={
        'text-xs font-bold uppercase tracking-[0.2em] ' +
        (mode === 'parents' ? 'text-brand-purple' : 'text-cta-yellow')
      }
    >
      {children}
    </span>
  );
}
