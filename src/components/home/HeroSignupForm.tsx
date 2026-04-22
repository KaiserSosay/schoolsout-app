'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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

// CSS-only confetti — rendered on first successful signup of the session.
// Skipped entirely when prefers-reduced-motion is set.
function Confetti() {
  const colors = ['#F5C842', '#6B4FBB', '#FBF8F1', '#1A1A1A'];
  const pieces = Array.from({ length: 14 });
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-visible"
    >
      {pieces.map((_, i) => {
        const dx = (i - pieces.length / 2) * 14 + (i % 3) * 6;
        const color = colors[i % colors.length];
        const delay = (i % 5) * 30;
        return (
          <span
            key={i}
            className="confetti-piece absolute left-1/2 top-0 h-2 w-2"
            style={
              {
                background: color,
                transform: `translateX(${dx}px)`,
                '--dx': `${dx * 2}px`,
                animationDelay: `${delay}ms`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </span>
  );
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
  const [inlineError, setInlineError] = useState<'enterEmail' | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status !== 'success') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    setShowConfetti(true);
    const to = window.setTimeout(() => setShowConfetti(false), 1000);
    return () => window.clearTimeout(to);
  }, [status]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setInlineError('enterEmail');
      inputRef.current?.focus();
      return;
    }
    if (!consent) return;
    setInlineError(null);
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
    'rounded-full px-6 py-3 text-base font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg whitespace-nowrap inline-flex items-center justify-center gap-2';
  // DECISION: Button is ALWAYS bg-ink (parents) or bg-cta-yellow (kids). Empty
  // email + submit triggers an inline error, not a disabled state. The only
  // time disabled is true is while a submit is actually in-flight.
  const btnParents = 'bg-ink text-white disabled:opacity-80 disabled:cursor-progress';
  const btnKids = 'bg-cta-yellow text-purple-deep disabled:opacity-80 disabled:cursor-progress';

  if (status === 'success') {
    return (
      <div
        id="signup"
        data-signup-anchor
        className="relative mt-8 max-w-xl mx-auto animate-fade-up [animation-delay:250ms]"
      >
        {showConfetti && <Confetti />}
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
      data-signup-anchor
      onSubmit={submit}
      className="mt-8 max-w-xl mx-auto flex flex-col gap-3 animate-fade-up [animation-delay:250ms]"
      noValidate
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="hero-email" className="sr-only">
          Email
        </label>
        <input
          id="hero-email"
          ref={inputRef}
          data-signup-email
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (inlineError) setInlineError(null);
          }}
          placeholder={t('emailPlaceholder')}
          aria-invalid={inlineError ? 'true' : undefined}
          aria-describedby={inlineError ? 'hero-email-error' : undefined}
          className={inputBase + ' ' + (mode === 'parents' ? inputParents : inputKids)}
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className={btnBase + ' ' + (mode === 'parents' ? btnParents : btnKids)}
        >
          {status === 'submitting' ? (
            <>
              <span
                aria-hidden
                className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
              />
              <span>{t('submitting')}</span>
            </>
          ) : (
            t('submit')
          )}
        </button>
      </div>

      {inlineError ? (
        <p
          id="hero-email-error"
          role="alert"
          className={
            'text-xs font-semibold rounded-2xl px-3 py-2 text-center ' +
            (mode === 'parents'
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-red-500/15 border border-red-500/30 text-red-200')
          }
        >
          {t('enterEmail')}
        </p>
      ) : null}

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
          {t('errorFriendly')}
        </p>
      )}
    </form>
  );
}
