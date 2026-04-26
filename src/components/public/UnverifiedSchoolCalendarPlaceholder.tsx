'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

// Renders in place of the bare "We don't have verified dates yet" copy on
// unverified school pages with no closures. Mom-test 2026-04-26: a silent
// empty calendar on a parent's own school page reads as "we don't care
// about your school." This component owns the gap honestly and gives four
// escape hatches: cross-reference MDCPS, call the school, email us a PDF,
// or subscribe to be told when it lands.
//
// TGP-only: when slug === 'the-growing-place', a personal note from Noah
// + his dad sits above the body. Surfaces the school they actually go to
// and reframes the gap as their own work-in-progress.
const TGP_SLUG = 'the-growing-place';

export function UnverifiedSchoolCalendarPlaceholder({
  locale,
  schoolName,
  schoolSlug,
  schoolId,
  phone,
}: {
  locale: string;
  schoolName: string;
  schoolSlug: string;
  // Optional — passed through to the notify-me POST when the user opts in.
  // The placeholder still renders without it (notify button stays inert).
  schoolId?: string | null;
  phone: string | null;
}) {
  const t = useTranslations('public.school.unverifiedPlaceholder');
  const [notifyState, setNotifyState] = useState<
    'idle' | 'pending' | 'subscribed' | 'signed-out' | 'error'
  >('idle');

  const isTgp = schoolSlug === TGP_SLUG;
  const phoneTel = phone ? phone.replace(/[^\d+]/g, '') : null;

  function openEmailPdfModal() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('so-open-feature-request', {
        detail: {
          category: 'idea',
          pagePath: `/${locale}/schools/${schoolSlug}`,
          bodyDraft: `Calendar PDF for ${schoolName}: I have it / can share these dates / `,
        },
      }),
    );
  }

  async function notifyMe() {
    if (!schoolId) return;
    setNotifyState('pending');
    try {
      const res = await fetch('/api/schools/notify-me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_id: schoolId, slug: schoolSlug }),
      });
      if (res.status === 401) {
        setNotifyState('signed-out');
        return;
      }
      if (!res.ok) {
        setNotifyState('error');
        return;
      }
      setNotifyState('subscribed');
    } catch {
      setNotifyState('error');
    }
  }

  return (
    <section
      data-testid="unverified-school-placeholder"
      className="mb-6 rounded-3xl border-2 border-amber-300 bg-amber-50 p-5 md:p-6"
    >
      <h2 className="text-lg font-black text-amber-900 md:text-xl">
        🟡 {t('headline', { name: schoolName })}
      </h2>

      {isTgp ? (
        <p
          data-testid="tgp-noah-note"
          className="mt-3 rounded-2xl border border-amber-300 bg-white p-4 text-sm font-semibold text-ink"
        >
          {t('tgpNote')}
        </p>
      ) : null}

      <p className="mt-3 text-sm text-amber-900/90">
        {t('body', { name: schoolName })}
      </p>

      <p className="mt-4 text-sm font-bold text-amber-900">
        {t('intermeantime', { name: schoolName })}
      </p>

      <ul className="mt-3 space-y-3">
        <li>
          <Link
            href={`/${locale}/breaks`}
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-purple hover:underline"
          >
            📅 {t('mdcpsLinkLabel')}
          </Link>
          <p className="text-xs text-amber-900/80">{t('mdcpsLinkSub')}</p>
        </li>

        {phoneTel ? (
          <li>
            <a
              href={`tel:${phoneTel}`}
              className="inline-flex items-center gap-2 text-sm font-bold text-ink hover:underline"
              aria-label={`Call ${schoolName}`}
            >
              📞 {t('callSchool', { name: schoolName, phone: phone ?? '' })}
            </a>
          </li>
        ) : null}

        <li>
          <p className="text-sm font-bold text-ink">
            ✉️ {t('emailPdfTitle')}
          </p>
          <p className="text-xs text-amber-900/80">{t('emailPdfBody')}</p>
          <button
            type="button"
            onClick={openEmailPdfModal}
            className="mt-1 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-black text-cream hover:-translate-y-0.5 hover:shadow-lg"
          >
            {t('emailPdfButton')}
          </button>
        </li>

        <li>
          <p className="text-sm font-bold text-ink">
            🔔 {t('notifyTitle', { name: schoolName })}
          </p>
          <button
            type="button"
            onClick={notifyMe}
            disabled={notifyState === 'pending' || notifyState === 'subscribed'}
            className="mt-1 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-ink bg-white px-4 py-2 text-sm font-black text-ink hover:bg-cream disabled:opacity-60"
          >
            {notifyState === 'subscribed' ? '✓ ' : ''}
            {t('notifyButton')}
          </button>
          {notifyState === 'signed-out' ? (
            <p className="mt-1 text-xs text-amber-900/80">
              <Link
                href={`/${locale}/sign-in?next=${encodeURIComponent(
                  `/${locale}/schools/${schoolSlug}?action=notify`,
                )}`}
                className="font-bold text-brand-purple hover:underline"
              >
                {t('notifySignedOutHint')}
              </Link>
            </p>
          ) : null}
        </li>
      </ul>
    </section>
  );
}
