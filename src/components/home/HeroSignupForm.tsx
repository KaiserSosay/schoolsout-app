'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeContext';

// DECISION: mask the local-part down to first-char + stars, keep the domain.
// Matches the GDPR-friendly pattern most email UIs already use in confirm flows.
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const first = local.charAt(0);
  return `${first}***@${domain}`;
}

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
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>(
    'idle',
  );

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

  async function resend() {
    if (!email || resendStatus === 'sending') return;
    setResendStatus('sending');
    try {
      await fetch('/api/reminders/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, school_id: schoolId, age_range: 'all', locale }),
      });
      setResendStatus('sent');
      // DECISION: revert button text after 3s so a user can resend again if the
      // second email also gets filtered.
      window.setTimeout(() => setResendStatus('idle'), 3000);
    } catch {
      setResendStatus('idle');
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

  if (status === 'success') {
    return (
      <div
        id="signup"
        className="mt-8 max-w-xl mx-auto animate-fade-up [animation-delay:250ms]"
      >
        <div className="rounded-2xl bg-success/10 border border-success/30 p-5 space-y-3 text-left">
          <p className="font-bold text-ink">
            ✅{' '}
            {t('successCheckEmail', {
              email: maskEmail(email),
            })}
          </p>
          <div className="text-sm text-muted space-y-1">
            <p>
              <span className="font-semibold">Subject:</span> {t('successSubject')}
            </p>
            <p>
              <span className="font-semibold">From:</span> {t('successFrom')}
            </p>
          </div>
          <p className="text-xs text-muted">
            {t('successHint')}{' '}
            <button
              type="button"
              onClick={resend}
              className="text-brand-purple underline disabled:opacity-60"
              disabled={resendStatus === 'sending'}
            >
              {resendStatus === 'sending'
                ? t('resending')
                : resendStatus === 'sent'
                  ? t('resent')
                  : t('resendLink')}
            </button>
          </p>
        </div>
      </div>
    );
  }

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

      <p
        className={
          'text-xs text-center editorial-body ' +
          (mode === 'parents' ? 'text-muted' : 'text-white/60')
        }
      >
        🔒 {t('privacyNote')}{' '}
        <Link
          href={`/${locale}/privacy`}
          className={
            'font-bold hover:underline ' +
            (mode === 'parents' ? 'text-brand-purple' : 'text-cta-yellow')
          }
        >
          {t('privacyNoteLink')}
        </Link>
      </p>

      {status === 'error' && (
        <p className="rounded-2xl bg-red-500/15 text-red-600 border border-red-500/30 px-4 py-2 text-sm font-semibold text-center">
          {t('error')}
        </p>
      )}
    </form>
  );
}
