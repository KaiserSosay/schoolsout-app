'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { z } from 'zod';

const schema = z.object({
  camp_name: z.string().min(2).max(200),
  website: z.string().url().max(500),
  ages: z.string().min(1).max(50),
  neighborhood: z.string().min(2).max(100),
  email: z.string().email().max(320),
});

export function CampApplicationForm() {
  const t = useTranslations('landing.camps.form');

  const [fields, setFields] = useState({
    camp_name: '',
    website: '',
    ages: '',
    neighborhood: '',
    email: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const parsed = schema.safeParse(fields);
  const isValid = parsed.success;

  function update(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setFields((f) => ({ ...f, [key]: e.target.value }));
  }

  function markTouched(key: keyof typeof fields) {
    return () => setTouched((t) => ({ ...t, [key]: true }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setStatus('submitting');
    try {
      const res = await fetch('/api/camps/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  }

  const fieldError = (key: keyof typeof fields): string | null => {
    if (!touched[key] || parsed.success) return null;
    const issue = parsed.error.issues.find((i) => i.path[0] === key);
    if (!issue) return null;
    try {
      return t(`validation.${key === 'camp_name' ? 'name' : key}`);
    } catch {
      return issue.message;
    }
  };

  const input =
    'w-full rounded-2xl px-4 py-3 text-base editorial-body bg-white/10 text-white border border-white/20 placeholder:text-white/50 outline-none focus:ring-2 focus:ring-cta-yellow/50';

  if (status === 'success') {
    return (
      <div
        id="camp-apply"
        className="rounded-3xl bg-success/15 border border-success/40 text-white p-6 md:p-8 flex items-start gap-4"
      >
        <span className="text-3xl" aria-hidden="true">✅</span>
        <div>
          <h3 className="editorial-h1 text-xl md:text-2xl">{t('success')}</h3>
        </div>
      </div>
    );
  }

  return (
    <form id="camp-apply" onSubmit={submit} className="flex flex-col gap-3">
      {(['camp_name', 'website', 'ages', 'neighborhood', 'email'] as const).map((key) => {
        const labelKey = key === 'camp_name' ? 'name' : key;
        const err = fieldError(key);
        return (
          <div key={key} className="flex flex-col gap-1">
            <label
              htmlFor={`camp-${key}`}
              className="text-xs font-bold uppercase tracking-wider text-white/60"
            >
              {t(`${labelKey}.label`)}
            </label>
            <input
              id={`camp-${key}`}
              type={key === 'email' ? 'email' : key === 'website' ? 'url' : 'text'}
              required
              value={fields[key]}
              onChange={update(key)}
              onBlur={markTouched(key)}
              placeholder={t(`${labelKey}.placeholder`)}
              className={input}
              aria-invalid={!!err}
              aria-describedby={err ? `camp-${key}-err` : undefined}
            />
            {err && (
              <p id={`camp-${key}-err`} className="text-xs text-red-300">
                {err}
              </p>
            )}
          </div>
        );
      })}
      <button
        type="submit"
        disabled={!isValid || status === 'submitting'}
        className="mt-2 rounded-full px-6 py-3 bg-cta-yellow text-purple-deep font-bold transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === 'submitting' ? t('submitting') : t('submit')}
      </button>
      {status === 'error' && (
        <p className="rounded-2xl bg-red-500/15 text-red-200 border border-red-500/30 px-4 py-2 text-sm font-semibold">
          {t('error')}
        </p>
      )}
    </form>
  );
}
