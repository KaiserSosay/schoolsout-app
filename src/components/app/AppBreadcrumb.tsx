'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';

// Single ← {parent} link at the top of a detail page. Always routes to a
// predictable parent (not history.back), per UX spec.
export function AppBreadcrumb({
  href,
  where,
}: {
  href: string;
  where: string;
}) {
  const t = useTranslations('app.nav');
  const { mode } = useMode();
  const isParents = mode === 'parents';
  return (
    <Link
      href={href}
      className={
        'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ' +
        (isParents
          ? 'text-muted hover:text-ink'
          : 'text-white/70 hover:text-white')
      }
    >
      ← {t('backTo', { where })}
    </Link>
  );
}
