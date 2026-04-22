'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Mode } from './ModeToggle';

export function CoParentShare({ mode }: { mode: Mode }) {
  const t = useTranslations('home.coParent');
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const payload = {
      title: t('shareTitle'),
      text: t('shareText'),
      url,
    };
    // DECISION: Web Share API first (mobile), clipboard fallback (desktop).
    // navigator.share can also throw AbortError if user cancels — treat as no-op.
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await (navigator as Navigator & { share: (d: ShareData) => Promise<void> }).share(
          payload,
        );
        return;
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // last-ditch: do nothing (browser blocked clipboard). Silent is fine.
    }
  }

  return (
    <section className="mt-10">
      <div
        className={
          'rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 ' +
          (mode === 'kids'
            ? 'bg-white/10 backdrop-blur border border-white/10'
            : 'bg-white border border-slate-200')
        }
      >
        <div className="text-5xl" aria-hidden="true">
          👨‍👩‍👧
        </div>
        <div className="flex-1">
          <h3
            className={
              'text-xl md:text-2xl font-bold mb-1 ' +
              (mode === 'kids' ? 'text-white' : 'text-slate-900')
            }
          >
            {t('title')}
          </h3>
          <p
            className={
              'text-sm md:text-base ' +
              (mode === 'kids' ? 'text-white/80' : 'text-slate-700')
            }
          >
            {t('body')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {copied && (
            <span
              role="status"
              className={
                'text-sm font-semibold px-3 py-1 rounded-full ' +
                (mode === 'kids'
                  ? 'bg-success/20 text-success'
                  : 'bg-emerald-100 text-emerald-800')
              }
            >
              {t('copied')}
            </span>
          )}
          <button
            type="button"
            onClick={share}
            className={
              'inline-flex items-center whitespace-nowrap rounded-2xl font-bold px-5 py-3 transition-all hover:-translate-y-0.5 hover:shadow-lg ' +
              (mode === 'kids'
                ? 'bg-cta-yellow text-purple-deep'
                : 'bg-purple-deep text-white')
            }
          >
            {t('button')}
          </button>
        </div>
      </div>
    </section>
  );
}
