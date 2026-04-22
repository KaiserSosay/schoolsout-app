'use client';

import { useMode } from './ModeProvider';

// DECISION: Shared mode-aware page header so server pages can render a
// consistent eyebrow + title + subtitle pair that auto-flips colors when the
// user toggles between Parent and Kid modes. Server pages pass plain strings
// (already translated server-side) so we don't need to re-run next-intl here.
export function AppPageHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  const { mode } = useMode();
  const isParents = mode === 'parents';
  return (
    <header className="mb-6">
      {eyebrow ? (
        <div
          className={
            'text-[11px] font-black uppercase tracking-wider ' +
            (isParents ? 'text-brand-purple' : 'text-cta-yellow')
          }
        >
          {eyebrow}
        </div>
      ) : null}
      <h1
        className={
          'mt-1 text-3xl font-black md:text-4xl ' +
          (isParents ? 'text-ink' : 'text-white')
        }
        style={{ letterSpacing: '-0.02em' }}
      >
        {title}
      </h1>
      {subtitle ? (
        <p
          className={
            'mt-1 text-sm ' + (isParents ? 'text-muted' : 'text-white/70')
          }
        >
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
