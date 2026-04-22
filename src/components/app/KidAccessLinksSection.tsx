'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

// DECISION: Lives in settings as a full management panel — list, label,
// generate, revoke. The parent dashboard's KidShareCard is a lighter-weight
// onboarding surface; this is where a parent manages multiple devices.
type TokenRow = {
  id: string;
  token: string;
  label: string | null;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

export function KidAccessLinksSection({ locale }: { locale: string }) {
  const t = useTranslations('app.settings.kidAccess');
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [label, setLabel] = useState('');
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const load = async () => {
    try {
      const res = await fetch('/api/kid-access-tokens', { cache: 'no-store' });
      if (!res.ok) return;
      const json = (await res.json()) as { tokens: TokenRow[] };
      setTokens(json.tokens);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      await fetch('/api/kid-access-tokens', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || undefined }),
      });
      setLabel('');
      await load();
    } finally {
      setGenerating(false);
    }
  };

  const revoke = async (id: string) => {
    await fetch(`/api/kid-access-tokens/${id}/revoke`, { method: 'POST' });
    setTokens((prev) => prev.filter((x) => x.id !== id));
  };

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const dtf = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' });
  const relative = (iso: string | null) => {
    if (!iso) return t('neverUsed');
    const diffMs = new Date(iso).getTime() - Date.now();
    const diffMin = Math.round(diffMs / 60_000);
    if (Math.abs(diffMin) < 60) return rtf.format(diffMin, 'minute');
    const diffHr = Math.round(diffMin / 60);
    if (Math.abs(diffHr) < 24) return rtf.format(diffHr, 'hour');
    const diffDay = Math.round(diffHr / 24);
    return rtf.format(diffDay, 'day');
  };

  return (
    <section
      className="rounded-3xl border border-cream-border bg-white p-5"
      aria-labelledby="settings-kidaccess-title"
    >
      <h2
        id="settings-kidaccess-title"
        className="text-xs font-black uppercase tracking-wider text-muted"
      >
        {t('title')}
      </h2>
      <p className="mt-1 text-sm text-muted">{t('help')}</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t('labelPlaceholder')}
          className="flex-1 rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
        />
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="rounded-full bg-brand-purple px-4 py-2 text-xs font-black text-white hover:brightness-110 disabled:opacity-60"
        >
          {generating ? t('generating') : t('generate')}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {loading ? (
          <p className="text-sm text-muted">…</p>
        ) : tokens.length === 0 ? (
          <p className="text-sm text-muted">{t('noTokens')}</p>
        ) : (
          tokens.map((tk) => (
            <div
              key={tk.id}
              className="rounded-2xl border border-cream-border bg-cream px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">
                    {tk.label || t('labelPlaceholder')}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-muted">
                    {origin ? `${origin}/k/${tk.token}` : `/k/${tk.token}`}
                  </p>
                  <p className="mt-1 text-[11px] text-muted">
                    {t('createdOn', { when: dtf.format(new Date(tk.created_at)) })}{' '}
                    · {t('lastUsed', { when: relative(tk.last_used_at) })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(tk.id)}
                  className="shrink-0 rounded-full border border-red-500/40 px-3 py-1 text-xs font-black text-red-600 hover:bg-red-50"
                >
                  {t('revoke')}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
