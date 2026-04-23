'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { obfuscateEmail } from '@/lib/email/obfuscate';

export function ReminderSignup({ schoolId, locale }: { schoolId: string; locale: string }) {
  const t = useTranslations('reminderSignup');
  const [email, setEmail] = useState('');
  const [ageRange, setAgeRange] = useState<'4-6' | '7-9' | 'all'>('all');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [isReturning, setIsReturning] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/reminders/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, school_id: schoolId, age_range: ageRange, locale }),
      });
      if (!res.ok) {
        setStatus('error');
        return;
      }
      const body = await res.json().catch(() => ({ isReturning: false }));
      setIsReturning(Boolean(body?.isReturning));
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  async function resend() {
    if (!email || resendStatus === 'sending') return;
    setResendStatus('sending');
    try {
      await fetch('/api/reminders/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, school_id: schoolId, age_range: ageRange, locale }),
      });
      setResendStatus('sent');
      window.setTimeout(() => setResendStatus('idle'), 3000);
    } catch {
      setResendStatus('idle');
    }
  }

  if (status === 'success') {
    // DECISION (Goal 1 warmth pass): Split the success pane into first-timer
    // vs returning copy. Same visual container — just a different heading +
    // body so the new user feels welcomed and the returning user feels known.
    const headingKey = isReturning
      ? 'success.returning.heading'
      : 'success.firstTimer.heading';
    const bodyKey = isReturning
      ? 'success.returning.body'
      : 'success.firstTimer.body';
    return (
      <div className="rounded-2xl bg-success/20 text-success p-6 text-left space-y-3">
        <p className="font-bold text-lg">{t(headingKey)}</p>
        <p className="text-sm">
          {t(bodyKey, { email: obfuscateEmail(email) })}
        </p>
        <p className="text-xs opacity-80">
          {t('success.resendHint')}{' '}
          <button
            type="button"
            onClick={resend}
            disabled={resendStatus === 'sending'}
            className="underline disabled:opacity-60"
          >
            {resendStatus === 'sending'
              ? t('success.resending')
              : resendStatus === 'sent'
                ? t('success.resent')
                : t('success.resendLink')}
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/10 p-6 flex flex-col gap-3">
      <h2 className="text-2xl font-bold">{t('headline')}</h2>
      <p className="text-sm text-white/80">{t('body')}</p>

      <label className="flex flex-col gap-1 text-sm">
        <span>{t('emailLabel')}</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder={t('emailPlaceholder')}
          className="rounded-xl px-3 py-2 text-black" />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span>{t('ageRangeLabel')}</span>
        <select value={ageRange} onChange={(e) => setAgeRange(e.target.value as 'all' | '4-6' | '7-9')}
          className="rounded-xl px-3 py-2 text-black">
          <option value="all">{t('ageRange.all')}</option>
          <option value="4-6">{t('ageRange.4-6')}</option>
          <option value="7-9">{t('ageRange.7-9')}</option>
        </select>
      </label>

      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{t('coppaConsent')}</span>
      </label>

      <button type="submit"
        disabled={!consent || status === 'submitting'}
        className="mt-2 bg-cta-yellow text-purple-deep font-bold rounded-xl px-4 py-3 disabled:opacity-50">
        {t('submit')}
      </button>

      {status === 'error' && (
        <p className="text-red-400 text-sm">{t('errorFriendly')}</p>
      )}
    </form>
  );
}
