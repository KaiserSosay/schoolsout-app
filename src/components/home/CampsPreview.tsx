'use client';

import { useTranslations } from 'next-intl';
import type { Mode } from './ModeToggle';

function scrollToOperator() {
  const el = document.getElementById('operator-cta');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function CampsPreview({ mode }: { mode: Mode }) {
  const t = useTranslations('home.campsPreview');

  const kidsClass =
    'bg-white/10 backdrop-blur text-white border border-white/10';
  const parentsClass = 'bg-white border border-slate-200 text-slate-900';
  const cardBase =
    'rounded-2xl p-6 flex flex-col gap-3 transition-all hover:-translate-y-1 text-left';

  return (
    <section className="mt-10">
      <h2
        className={
          'text-2xl font-bold mb-4 ' +
          (mode === 'kids' ? 'text-white' : 'text-slate-900')
        }
      >
        {t('title')}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={scrollToOperator}
          className={
            cardBase +
            ' w-full ' +
            (mode === 'kids' ? kidsClass : parentsClass)
          }
        >
          <span className="text-5xl" aria-hidden="true">
            🎪
          </span>
          <h3 className="text-xl font-bold">{t('empty')}</h3>
          <p
            className={
              'text-sm ' +
              (mode === 'kids' ? 'text-white/80' : 'text-slate-600')
            }
          >
            {t('emptyBody')}
          </p>
          <span
            className={
              'mt-auto text-sm font-semibold ' +
              (mode === 'kids' ? 'text-cta-yellow' : 'text-purple-700')
            }
          >
            {t('cta')}
          </span>
        </button>
        <div
          className={
            cardBase +
            ' ' +
            (mode === 'kids' ? kidsClass : parentsClass) +
            ' justify-center items-start opacity-80'
          }
        >
          <span className="text-5xl" aria-hidden="true">
            🏕️
          </span>
          <div
            className={
              'w-full h-4 rounded-full ' +
              (mode === 'kids' ? 'bg-white/10' : 'bg-slate-100')
            }
          />
          <div
            className={
              'w-3/4 h-4 rounded-full ' +
              (mode === 'kids' ? 'bg-white/10' : 'bg-slate-100')
            }
          />
          <div
            className={
              'w-2/3 h-4 rounded-full ' +
              (mode === 'kids' ? 'bg-white/10' : 'bg-slate-100')
            }
          />
        </div>
      </div>
    </section>
  );
}
