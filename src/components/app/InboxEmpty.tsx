'use client';

import { useTranslations } from 'next-intl';
import { useMode } from './ModeProvider';

export function InboxEmpty() {
  const t = useTranslations('app.inbox.empty');
  const { mode } = useMode();
  const isParents = mode === 'parents';

  return (
    <div
      className={
        'rounded-3xl p-8 text-center ' +
        (isParents
          ? 'border border-cream-border bg-white'
          : 'border border-white/10 bg-white/10 backdrop-blur')
      }
    >
      <div className="animate-gentle-bounce text-5xl" aria-hidden>
        📥
      </div>
      <h2
        className={
          'mt-4 text-lg font-black ' + (isParents ? 'text-ink' : 'text-white')
        }
        style={{ letterSpacing: '-0.01em' }}
      >
        {t('title')}
      </h2>
      <p
        className={
          'mt-1 text-sm ' + (isParents ? 'text-muted' : 'text-white/70')
        }
      >
        {t('body')}
      </p>
    </div>
  );
}
