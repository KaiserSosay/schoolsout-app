'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Mode } from './ModeToggle';
import { NextClosureHighlight } from './NextClosureHighlight';
import type { Closure } from '@/lib/closures';

export function Hero({
  mode,
  schoolId,
  locale,
  nextClosure,
}: {
  mode: Mode;
  schoolId: string;
  locale: string;
  nextClosure: Closure | null;
}) {
  const t = useTranslations('home.hero');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true); // DECISION: default to consent checked; the label makes it clear, reduces friction and matches spec "above-the-fold signup."
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent || !email) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/reminders/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, school_id: schoolId, age_range: 'all', locale }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const titleGradient =
    'bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-red-500 to-blue-500 animate-gradient-pan';

  return (
    <section className="pt-6 pb-10 md:pt-10 md:pb-14 text-center">
      <h1
        className={
          'font-display font-extrabold tracking-tight text-6xl sm:text-7xl md:text-8xl leading-[0.95] animate-fade-up ' +
          titleGradient
        }
      >
        {t('title')}
      </h1>

      <p
        className={
          'mt-4 text-lg md:text-xl max-w-xl mx-auto animate-fade-up [animation-delay:100ms] ' +
          (mode === 'kids' ? 'text-white/90' : 'text-slate-700')
        }
      >
        {t('subtitle')}
      </p>

      {nextClosure && (
        <div className="mt-5 flex justify-center animate-fade-up [animation-delay:200ms]">
          <NextClosureHighlight closure={nextClosure} mode={mode} />
        </div>
      )}

      <form
        onSubmit={submit}
        className="mt-6 max-w-xl mx-auto flex flex-col gap-2 animate-fade-up [animation-delay:300ms]"
      >
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="sr-only" htmlFor="hero-email">
            Email
          </label>
          <input
            id="hero-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('signupPlaceholder')}
            className={
              'flex-1 rounded-2xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-cta-yellow ' +
              (mode === 'kids'
                ? 'bg-white text-slate-900 placeholder:text-slate-400'
                : 'bg-white text-slate-900 border border-slate-300 placeholder:text-slate-400')
            }
          />
          <button
            type="submit"
            disabled={!consent || !email || status === 'submitting'}
            className="rounded-2xl bg-cta-yellow text-purple-deep font-bold px-5 py-3 text-base transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? t('submitting') : t('signupCTA')}
          </button>
        </div>

        <label
          className={
            'flex items-start gap-2 text-xs justify-center text-center ' +
            (mode === 'kids' ? 'text-white/70' : 'text-slate-600')
          }
        >
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>{t('consentLabel')}</span>
        </label>

        {status === 'success' && (
          <p className="mt-2 rounded-xl bg-success/20 text-success px-4 py-2 text-sm font-semibold">
            {t('success')}
          </p>
        )}
        {status === 'error' && (
          <p className="mt-2 rounded-xl bg-red-500/20 text-red-200 px-4 py-2 text-sm font-semibold">
            {t('error')}
          </p>
        )}
      </form>

      <p
        className={
          'mt-5 text-sm animate-fade-up [animation-delay:400ms] ' +
          (mode === 'kids' ? 'text-white/70' : 'text-slate-500')
        }
      >
        {t('socialProof')}
      </p>
    </section>
  );
}
