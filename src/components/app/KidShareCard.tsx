'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

// DECISION: The card shows up next to the (empty) activity feed as an explicit
// onboarding nudge: "here's how to hand Kid Mode to your kid." On first load we
// GET /api/kid-access-tokens — if the user already has a non-revoked token, we
// re-use it. Otherwise we show a "Generate link" button that POSTs and fills
// shareUrl in place.
type TokenRow = {
  id: string;
  token: string;
  label: string | null;
  expires_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

export function KidShareCard() {
  const t = useTranslations('app.kidShare');
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/kid-access-tokens', { cache: 'no-store' });
        if (!res.ok) return;
        const json = (await res.json()) as { tokens?: TokenRow[] };
        if (cancelled) return;
        const first = json.tokens?.[0];
        if (first) {
          setShareUrl(`${window.location.origin}/k/${first.token}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/kid-access-tokens', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      const json = (await res.json()) as { url: string };
      setShareUrl(json.url);
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard permission denied — silent */
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-cream-border p-6 space-y-3">
      <p className="font-bold text-ink">👦 {t('title')}</p>
      <p className="text-sm text-muted">{t('option1')}</p>
      <p className="text-sm text-muted">{t('option2')}</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          readOnly
          value={loading ? '' : shareUrl}
          placeholder={loading ? '…' : ''}
          className="flex-1 min-w-0 px-3 py-2 rounded-xl border border-cream-border font-mono text-xs text-ink"
        />
        {shareUrl ? (
          <button
            type="button"
            onClick={copy}
            className="rounded-full bg-ink px-4 py-2 text-xs font-black text-cream hover:opacity-90"
          >
            {copied ? t('copied') : t('copy')}
          </button>
        ) : (
          <button
            type="button"
            onClick={generate}
            disabled={loading || generating}
            className="rounded-full bg-brand-purple px-4 py-2 text-xs font-black text-white hover:brightness-110 disabled:opacity-60"
          >
            {generating ? t('generating') : t('generateLink')}
          </button>
        )}
      </div>
    </div>
  );
}
