'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { obfuscateEmail } from '@/lib/email/obfuscate';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function SignInForm({
  locale,
  next,
}: {
  locale: string;
  next: string;
}) {
  const t = useTranslations('signIn');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [isReturning, setIsReturning] = useState(false);
  const [inlineError, setInlineError] = useState<'enterEmail' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // DECISION: autofocus on mount so a tired parent can start typing
  // immediately. preventScroll=true so we don't yank the page down on iOS.
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setInlineError('enterEmail');
      inputRef.current?.focus();
      return;
    }
    setInlineError(null);
    setStatus('submitting');
    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, locale, next }),
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

  if (status === 'success') {
    return (
      <div
        role="status"
        className="rounded-2xl border border-success/30 bg-success/10 p-5 space-y-2 text-left"
      >
        <p className="font-bold text-ink">{t('successTitle')}</p>
        <p className="text-sm text-ink">
          {t('successSubtitle', { email: obfuscateEmail(email) })}
        </p>
        <p className="text-xs text-muted">
          {isReturning ? t('successHintReturning') : t('successHintNew')}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="sign-in-email"
          className="block text-sm font-bold text-ink"
        >
          {t('emailLabel')}
        </label>
        <input
          id="sign-in-email"
          ref={inputRef}
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          tabIndex={1}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (inlineError) setInlineError(null);
          }}
          placeholder={t('emailPlaceholder')}
          aria-invalid={inlineError ? 'true' : undefined}
          aria-describedby={inlineError ? 'sign-in-email-error' : undefined}
          className="block w-full min-h-12 rounded-2xl border border-cream-border bg-white px-4 py-3 text-base text-ink placeholder:text-muted outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/20"
        />
        {inlineError ? (
          <p
            id="sign-in-email-error"
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
          >
            {t('enterEmail')}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex w-full min-h-12 items-center justify-center rounded-full bg-gold px-6 py-3 text-base font-black text-ink transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-80 disabled:cursor-progress"
      >
        {status === 'submitting' ? (
          <>
            <span
              aria-hidden
              className="mr-2 inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin"
            />
            {t('submitting')}
          </>
        ) : (
          t('submit')
        )}
      </button>

      {status === 'error' ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
          {t('errorFriendly')}
        </p>
      ) : null}

      <p className="text-center text-xs text-muted">
        {t('newHere')}{' '}
        <Link
          href={`/${locale}#signup`}
          className="font-bold text-brand-purple hover:underline"
        >
          {t('newHereCta')}
        </Link>
      </p>
    </form>
  );
}
