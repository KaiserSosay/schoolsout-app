'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeContext';

export function HeroSignupForm({
  schoolId,
  locale,
}: {
  schoolId: string;
  locale: string;
}) {
  const t = useTranslations('landing.hero');
  const { mode } = useMode();

  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
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

  const inputBase =
    'flex-1 min-w-0 rounded-full px-5 py-3 text-base editorial-body outline-none focus:ring-2 transition-colors';
  const inputParents =
    'bg-white text-ink border border-cream-border placeholder:text-muted focus:ring-ink/20 focus:border-ink/40';
  const inputKids =
    'bg-white/10 text-white border border-white/20 placeholder:text-white/50 focus:ring-cta-yellow/50';

  const btnBase =
    'rounded-full px-6 py-3 text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap';
  const btnParents = 'bg-ink text-white';
  const btnKids = 'bg-cta-yellow text-purple-deep';

  return (
    <form
      id="signup"
      onSubmit={submit}
      className="mt-8 max-w-xl mx-auto flex flex-col gap-3 animate-fade-up [animation-delay:250ms]"
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="hero-email" className="sr-only">
          Email
        </label>
        <input
          id="hero-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className={inputBase + ' ' + (mode === 'parents' ? inputParents : inputKids)}
        />
        <button
          type="submit"
          disabled={!consent || !email || status === 'submitting'}
          className={btnBase + ' ' + (mode === 'parents' ? btnParents : btnKids)}
        >
          {status === 'submitting' ? t('submitting') : t('submit')}
        </button>
      </div>

      <label
        className={
          'flex items-start gap-2 text-xs justify-center text-center editorial-body ' +
          (mode === 'parents' ? 'text-muted' : 'text-white/70')
        }
      >
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
        />
        <span>{t('consent')}</span>
      </label>

      <p
        className={
          'text-xs text-center editorial-body ' +
          (mode === 'parents' ? 'text-muted' : 'text-white/60')
        }
      >
        {t('trust')}
      </p>

      {status === 'success' && (
        <p className="rounded-2xl bg-success/15 text-success border border-success/30 px-4 py-2 text-sm font-semibold text-center">
          {t('success')}
        </p>
      )}
      {status === 'error' && (
        <p className="rounded-2xl bg-red-500/15 text-red-600 border border-red-500/30 px-4 py-2 text-sm font-semibold text-center">
          {t('error')}
        </p>
      )}
    </form>
  );
}
