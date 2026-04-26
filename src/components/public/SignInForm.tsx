'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { obfuscateEmail } from '@/lib/email/obfuscate';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type Tab = 'magic-link' | 'password';
const TAB_PREF_KEY = 'so-signin-tab';

export function SignInForm({
  locale,
  next,
}: {
  locale: string;
  next: string;
}) {
  const t = useTranslations('signIn');
  const tPw = useTranslations('signIn.password');
  const tTabs = useTranslations('signIn.tabs');
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('magic-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [isReturning, setIsReturning] = useState(false);
  const [inlineError, setInlineError] = useState<'enterEmail' | null>(null);
  const [pwError, setPwError] = useState<'wrong' | 'network' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pwRef = useRef<HTMLInputElement>(null);

  // Load + persist tab preference. Mom and Rasheid both said magic-link-
  // every-time is friction; remembering the last choice is the smallest
  // possible "we noticed."
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_PREF_KEY);
      if (saved === 'password') setTab('password');
    } catch {
      /* private mode — fine */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(TAB_PREF_KEY, tab);
    } catch {
      /* noop */
    }
  }, [tab]);

  // Autofocus the right field when the tab changes.
  useEffect(() => {
    if (tab === 'magic-link') inputRef.current?.focus({ preventScroll: true });
    else pwRef.current?.focus({ preventScroll: true });
  }, [tab]);

  async function submitMagic(e: React.FormEvent) {
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

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setInlineError(!email ? 'enterEmail' : null);
      (!email ? inputRef : pwRef).current?.focus();
      return;
    }
    setInlineError(null);
    setPwError(null);
    setStatus('submitting');
    try {
      const res = await fetch('/api/auth/sign-in-with-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.status === 401) {
        setPwError('wrong');
        setStatus('idle');
        return;
      }
      if (!res.ok) {
        setPwError('network');
        setStatus('idle');
        return;
      }
      router.push(next || `/${locale}/app`);
      router.refresh();
    } catch {
      setPwError('network');
      setStatus('idle');
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

  const tabBtnCls = (active: boolean) =>
    'flex-1 min-h-11 rounded-full px-4 py-2 text-sm font-bold transition-colors ' +
    (active
      ? 'bg-ink text-cream'
      : 'bg-white text-ink hover:bg-cream');

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label="Sign-in method"
        className="flex gap-2 rounded-full border border-cream-border bg-white p-1"
      >
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'magic-link'}
          onClick={() => setTab('magic-link')}
          className={tabBtnCls(tab === 'magic-link')}
        >
          📨 {tTabs('magicLink')}
        </button>
        <button
          role="tab"
          type="button"
          aria-selected={tab === 'password'}
          onClick={() => setTab('password')}
          className={tabBtnCls(tab === 'password')}
        >
          🔑 {tTabs('password')}
        </button>
      </div>

      <form onSubmit={tab === 'magic-link' ? submitMagic : submitPassword} noValidate className="space-y-4">
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

        {tab === 'password' ? (
          <div className="space-y-2">
            <label
              htmlFor="sign-in-password"
              className="block text-sm font-bold text-ink"
            >
              {tPw('passwordLabel')}
            </label>
            <input
              id="sign-in-password"
              ref={pwRef}
              type="password"
              required
              autoComplete="current-password"
              tabIndex={2}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (pwError) setPwError(null);
              }}
              placeholder={tPw('passwordPlaceholder')}
              className="block w-full min-h-12 rounded-2xl border border-cream-border bg-white px-4 py-3 text-base text-ink placeholder:text-muted outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/20"
            />
          </div>
        ) : null}

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
              {tab === 'password' ? tPw('submitting') : t('submitting')}
            </>
          ) : tab === 'password' ? (
            tPw('submit')
          ) : (
            t('submit')
          )}
        </button>

        {tab === 'password' && pwError === 'wrong' ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
            <p className="font-semibold text-red-700">
              {tPw('wrongPassword')}
            </p>
            <button
              type="button"
              onClick={() => {
                setTab('magic-link');
                setPwError(null);
              }}
              className="mt-2 text-xs font-bold text-brand-purple hover:underline"
            >
              {tPw('useMagicLinkInstead')}
            </button>
          </div>
        ) : null}

        {tab === 'password' && pwError === 'network' ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
            {t('errorFriendly')}
          </p>
        ) : null}

        {status === 'error' ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
            {t('errorFriendly')}
          </p>
        ) : null}

        {tab === 'password' ? (
          <p className="text-center text-xs text-muted">
            {tPw('noPasswordHint')}
          </p>
        ) : (
          <p className="text-center text-xs text-muted">
            {t('newHere')}{' '}
            <Link
              href={`/${locale}#signup`}
              className="font-bold text-brand-purple hover:underline"
            >
              {t('newHereCta')}
            </Link>
          </p>
        )}
      </form>
    </div>
  );
}
