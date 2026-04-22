'use client';

import { useTranslations } from 'next-intl';
import type { Mode } from './ModeToggle';

export function HowItWorks({ mode }: { mode: Mode }) {
  const t = useTranslations('home.howItWorks');
  const cardKids = 'bg-white/10 backdrop-blur text-white';
  const cardParents = 'bg-white border border-slate-200 text-slate-900';
  const cardBase =
    'rounded-2xl p-6 flex flex-col gap-2 transition-all hover:-translate-y-1';

  const steps = [
    { emoji: '1️⃣', title: t('step1.title'), desc: t('step1.desc') },
    { emoji: '2️⃣', title: t('step2.title'), desc: t('step2.desc') },
    {
      emoji: '3️⃣',
      title: t('step3.title'),
      desc: t('step3.desc'),
      badge: t('step3.badge'),
    },
  ];

  return (
    <section className="mt-10">
      <h2
        className={
          'text-2xl font-bold text-center mb-6 ' +
          (mode === 'kids' ? 'text-white' : 'text-slate-900')
        }
      >
        {t('title')}
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <article
            key={s.title}
            className={
              cardBase +
              ' ' +
              (mode === 'kids' ? cardKids : cardParents) +
              ' animate-fade-up'
            }
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <span className="text-4xl" aria-hidden="true">
              {s.emoji}
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold">{s.title}</h3>
              {s.badge && (
                <span
                  className={
                    'text-[10px] uppercase tracking-wide font-bold px-2 py-0.5 rounded-full ' +
                    (mode === 'kids'
                      ? 'bg-cta-yellow/20 text-cta-yellow'
                      : 'bg-amber-100 text-amber-900')
                  }
                >
                  {s.badge}
                </span>
              )}
            </div>
            <p
              className={
                'text-sm ' +
                (mode === 'kids' ? 'text-white/80' : 'text-slate-600')
              }
            >
              {s.desc}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
