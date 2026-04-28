'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { celebrate } from '@/lib/confetti';

type Mode = 'idle' | 'submitting' | 'success' | 'error';

export function SetPasswordForm({
  currentlyHasPassword,
}: {
  currentlyHasPassword: boolean;
}) {
  const t = useTranslations('app.settings.password');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [mode, setMode] = useState<Mode>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'success') celebrate();
  }, [mode]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError(t('errors.tooShort'));
      setMode('error');
      return;
    }
    if (password !== confirm) {
      setError(t('errors.mismatch'));
      setMode('error');
      return;
    }

    setMode('submitting');
    try {
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        // /api/auth/set-password returns 'too_short' | 'too_common' | 'invalid_body'
        // | 'unauthorized' | 'update_failed'. Map the user-recoverable cases.
        if (data.error === 'too_common') {
          setError(t('errors.commonPassword'));
        } else if (data.error === 'too_short') {
          setError(t('errors.tooShort'));
        } else {
          setError(t('errors.generic'));
        }
        setMode('error');
        return;
      }

      setMode('success');
      setPassword('');
      setConfirm('');
    } catch {
      setError(t('errors.network'));
      setMode('error');
    }
  }

  return (
    <section
      className="rounded-3xl border border-cream-border bg-white p-5"
      aria-labelledby="settings-password-title"
      data-testid="set-password-form"
    >
      <h2
        id="settings-password-title"
        className="text-xs font-black uppercase tracking-wider text-muted"
      >
        {currentlyHasPassword ? t('changeTitle') : t('setTitle')}
      </h2>
      <p className="mt-1 text-sm text-muted">
        {currentlyHasPassword ? t('changeBody') : t('setBody')}
      </p>

      <form onSubmit={submit} className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="settings-new-password"
            className="block text-xs font-black uppercase tracking-wider text-muted mb-1"
          >
            {t('newPasswordLabel')}
          </label>
          <input
            id="settings-new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            placeholder={t('newPasswordPlaceholder')}
            className="block w-full rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="settings-confirm-password"
            className="block text-xs font-black uppercase tracking-wider text-muted mb-1"
          >
            {t('confirmLabel')}
          </label>
          <input
            id="settings-confirm-password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            placeholder={t('confirmPlaceholder')}
            className="block w-full rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
          />
        </div>

        <p className="text-xs text-muted">{t('requirements')}</p>

        {error ? (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700"
          >
            {error}
          </p>
        ) : null}

        {mode === 'success' ? (
          <p
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700"
          >
            {currentlyHasPassword ? t('successChanged') : t('successSet')}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={mode === 'submitting'}
            className="rounded-full bg-ink px-5 py-2.5 text-xs font-black text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {mode === 'submitting'
              ? t('submitting')
              : currentlyHasPassword
                ? t('changeButton')
                : t('setButton')}
          </button>
        </div>
      </form>
    </section>
  );
}
