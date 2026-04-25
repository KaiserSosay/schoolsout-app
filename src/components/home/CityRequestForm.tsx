'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';
import { useMode } from './ModeContext';

const schema = z.object({
  email: z.string().email(),
  city: z.string().min(2),
  state: z.string().max(2).optional().or(z.literal('')),
  school: z.string().max(200).optional().or(z.literal('')),
});

export function CityRequestForm() {
  const t = useTranslations('landing.coverage.request');
  const { mode } = useMode();

  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  // Phase 3.0 / Item 3.6: optional school field. Free text. Stays empty
  // for parents who'd rather just signal the city — submitting still
  // succeeds.
  const [school, setSchool] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const parsed = schema.safeParse({ email, city, state: stateCode, school });
  const isValid = parsed.success;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/city-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          city,
          ...(stateCode ? { state: stateCode.toUpperCase() } : {}),
          ...(school.trim() ? { school: school.trim() } : {}),
        }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const inputBase =
    'w-full rounded-full px-5 py-3 text-base editorial-body outline-none focus:ring-2 transition-colors';
  const inputParents =
    'bg-white text-ink border border-cream-border placeholder:text-muted focus:ring-ink/20 focus:border-ink/40';
  const inputKids =
    'bg-white/10 text-white border border-white/20 placeholder:text-white/50 focus:ring-cta-yellow/50';
  const input = mode === 'parents' ? inputParents : inputKids;

  const btn =
    'rounded-full px-6 py-3 text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap ' +
    (mode === 'parents' ? 'bg-ink text-white' : 'bg-cta-yellow text-purple-deep');

  return (
    <form id="city-request" onSubmit={submit} className="flex flex-col gap-3">
      <div className="grid sm:grid-cols-[1fr_1fr_6rem] gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className={inputBase + ' ' + input}
          aria-label={t('emailPlaceholder')}
        />
        <input
          type="text"
          required
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t('cityPlaceholder')}
          className={inputBase + ' ' + input}
          aria-label={t('cityPlaceholder')}
        />
        <input
          type="text"
          maxLength={2}
          value={stateCode}
          onChange={(e) => setStateCode(e.target.value.slice(0, 2).toUpperCase())}
          placeholder={t('statePlaceholder')}
          className={inputBase + ' ' + input + ' text-center uppercase'}
          aria-label={t('statePlaceholder')}
        />
      </div>
      <input
        type="text"
        maxLength={200}
        value={school}
        onChange={(e) => setSchool(e.target.value)}
        placeholder={t('schoolPlaceholder')}
        className={inputBase + ' ' + input}
        aria-label={t('schoolLabel')}
      />
      <button type="submit" disabled={!isValid || status === 'submitting'} className={btn}>
        {status === 'submitting' ? t('submitting') : t('submit')}
      </button>

      {status === 'success' && (
        <p className="rounded-2xl bg-success/15 text-success border border-success/30 px-4 py-2 text-sm font-semibold">
          {t('success')}
        </p>
      )}
      {status === 'error' && (
        <p className="rounded-2xl bg-red-500/15 text-red-600 border border-red-500/30 px-4 py-2 text-sm font-semibold">
          {t('error')}
        </p>
      )}
    </form>
  );
}
