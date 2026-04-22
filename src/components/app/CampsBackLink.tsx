'use client';

import Link from 'next/link';
import { useMode } from './ModeProvider';

export function CampsBackLink({ href, label }: { href: string; label: string }) {
  const { mode } = useMode();
  const isParents = mode === 'parents';
  return (
    <Link
      href={href}
      className={
        'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ' +
        (isParents
          ? 'border border-cream-border bg-white text-ink hover:border-brand-purple/40'
          : 'border border-white/20 bg-white/10 text-white hover:border-white/40')
      }
    >
      ← {label}
    </Link>
  );
}
