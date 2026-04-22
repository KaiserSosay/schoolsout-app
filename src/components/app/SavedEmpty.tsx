'use client';

import Link from 'next/link';
import { useMode } from './ModeProvider';

export function SavedEmpty({
  emptyText,
  browseText,
  browseHref,
}: {
  emptyText: string;
  browseText: string;
  browseHref: string;
}) {
  const { mode } = useMode();
  const isParents = mode === 'parents';
  return (
    <div
      className={
        'rounded-2xl p-8 text-center ' +
        (isParents
          ? 'border border-dashed border-cream-border bg-white/60'
          : 'border border-dashed border-white/20 bg-white/5 backdrop-blur')
      }
    >
      <p className={'text-sm ' + (isParents ? 'text-muted' : 'text-white/70')}>
        {emptyText}
      </p>
      <Link
        href={browseHref}
        className={
          'mt-4 inline-flex items-center gap-1 text-sm font-bold hover:underline ' +
          (isParents ? 'text-brand-purple' : 'text-cta-yellow')
        }
      >
        {browseText} →
      </Link>
    </div>
  );
}
