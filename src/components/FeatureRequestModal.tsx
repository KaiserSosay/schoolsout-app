'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

type Category = 'idea' | 'bug' | 'love' | 'question';

// Camp-correction taps from CampCompletenessBadge dispatch this shape as
// CustomEvent.detail. `category: 'correction'` is UI-only — it maps to the
// DB enum 'bug' on submit (we didn't want to add an enum value and deal with
// another cross-transaction migration for something cosmetic).
type PresetDetail = {
  category?: Category | 'correction';
  pagePath?: string;
  bodyDraft?: string;
};

// One modal, many triggers (user menu, sidebar button, footer link, camp
// card "help us verify" pill). All dispatch `so-open-feature-request` —
// we listen globally, open, and collect the response. Triggers that want
// to pre-fill context pass a CustomEvent detail; plain triggers pass none.
export function FeatureRequestModal({
  presetEmail,
  // When rendered inside /app, the user is logged in and the server route
  // will attach user_id. Logged-out callers (public footer) must supply an
  // email — the form requires it.
  isLoggedIn,
}: {
  presetEmail?: string | null;
  isLoggedIn: boolean;
}) {
  const t = useTranslations('feedback');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>('idea');
  const [body, setBody] = useState('');
  const [email, setEmail] = useState(presetEmail ?? '');
  const [presetPath, setPresetPath] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onOpen = (ev: Event) => {
      const detail = (ev as CustomEvent<PresetDetail>).detail;
      setOpen(true);
      setSuccess(false);
      setError(null);
      // Preset handling: CampCompletenessBadge passes category='correction',
      // a body draft, and a pagePath. 'correction' collapses to 'bug'; body
      // draft seeds the textarea; pagePath overrides window.location on submit.
      const presetCat = detail?.category;
      const mappedCat: Category =
        presetCat === 'correction' ? 'bug' : (presetCat ?? 'idea');
      setCategory(mappedCat);
      setBody(detail?.bodyDraft ?? '');
      setPresetPath(detail?.pagePath ?? null);
    };
    window.addEventListener('so-open-feature-request', onOpen as EventListener);
    return () =>
      window.removeEventListener(
        'so-open-feature-request',
        onOpen as EventListener,
      );
  }, []);

  // Auto-dismiss the thank-you state after 3s (per spec) — only clears if
  // the user hasn't closed the modal manually.
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      setOpen(false);
      setSuccess(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, [success]);

  // ESC closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!body.trim()) {
      setError(t('error.generic'));
      return;
    }
    if (!isLoggedIn && !email.trim()) {
      setError(t('error.email'));
      return;
    }
    setSubmitting(true);
    try {
      const page_path =
        presetPath ??
        (typeof window !== 'undefined' ? window.location.pathname : undefined);
      const res = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          body: body.trim(),
          email: !isLoggedIn ? email.trim() : undefined,
          locale,
          page_path,
        }),
      });
      if (!res.ok) {
        setError(t('error.generic'));
      } else {
        setSuccess(true);
      }
    } catch {
      setError(t('error.generic'));
    } finally {
      setSubmitting(false);
    }
  };

  const categories: { key: Category; label: string }[] = [
    { key: 'idea', label: t('categories.idea') },
    { key: 'bug', label: t('categories.bug') },
    { key: 'love', label: t('categories.love') },
    { key: 'question', label: t('categories.question') },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feature-request-heading"
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4"
    >
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={() => !submitting && setOpen(false)}
      />
      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {success ? (
          <div className="p-8 text-center">
            <div className="text-5xl" aria-hidden>
              🙌
            </div>
            <h2 className="mt-4 text-xl font-black text-ink">
              {t('success.title')}
            </h2>
            <p className="mt-2 text-sm text-muted">{t('success.subtitle')}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2
                  id="feature-request-heading"
                  className="text-xl font-black text-ink"
                >
                  {t('heading')}
                </h2>
                <p className="mt-1 text-sm text-muted">{t('subtitle')}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-cream hover:text-ink"
              >
                ✕
              </button>
            </div>

            {/* Category chips */}
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => setCategory(c.key)}
                    className={
                      'min-h-11 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ' +
                      (active
                        ? 'border-brand-purple bg-brand-purple text-white'
                        : 'border-cream-border bg-white text-ink hover:border-brand-purple/40')
                    }
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>

            <div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 500))}
                placeholder={t('placeholder')}
                rows={5}
                className="w-full resize-none rounded-2xl border border-cream-border bg-white p-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand-purple focus:outline-none"
              />
              <div className="mt-1 text-right text-[11px] text-muted">
                {body.length} / 500
              </div>
            </div>

            {!isLoggedIn && (
              <div>
                <label
                  htmlFor="fr-email"
                  className="block text-xs font-bold text-ink"
                >
                  {t('emailLabel')}
                </label>
                <input
                  id="fr-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-cream-border bg-white p-3 text-sm text-ink focus:border-brand-purple focus:outline-none"
                />
              </div>
            )}

            {error ? (
              <p className="text-sm font-semibold text-red-600">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-11 items-center justify-center rounded-full bg-gold px-4 py-2 text-sm font-black text-ink transition-colors hover:bg-gold/90 disabled:opacity-60"
            >
              {submitting ? '…' : t('submit')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
