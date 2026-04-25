'use client';

import { useTranslations } from 'next-intl';

// Help-us-verify CTA used on the unofficial school calendar template.
// Wires the existing FeatureRequestModal (mounted globally in the locale
// layout) by dispatching the so-open-feature-request CustomEvent — same
// pattern the Footer "Got an idea?" link and the camp-card correction
// pill use.
//
// Pre-fills:
//   category = 'idea'
//   pagePath = the current school URL
//   bodyDraft = "Calendar for {School Name}: I have the official PDF / can share these dates / "
export function HelpVerifyCalendarCta({
  schoolName,
  pagePath,
  emailSubjectName,
}: {
  schoolName: string;
  pagePath: string;
  // URL-encoded school name for the mailto fallback subject line.
  emailSubjectName: string;
}) {
  const t = useTranslations('public.school.helpVerify');

  function open() {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('so-open-feature-request', {
        detail: {
          category: 'idea',
          pagePath,
          bodyDraft: t('bodyDraftPrefix', { name: schoolName }),
        },
      }),
    );
  }

  const mailto = `mailto:hi@schoolsout.net?subject=Calendar%20for%20${emailSubjectName}`;

  return (
    <section
      data-testid="help-verify-cta"
      className="rounded-3xl border border-cream-border bg-cream p-5 md:p-6"
    >
      <h2 className="text-base font-black text-ink md:text-lg">
        {t('title', { name: schoolName })}
      </h2>
      <p className="mt-2 text-sm text-ink/80">
        {t('body', { name: schoolName })}
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={open}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-5 py-2 text-sm font-black text-ink hover:bg-gold/90"
        >
          {t('modalTrigger')}
        </button>
        <a
          href={mailto}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-ink/30 bg-white px-5 py-2 text-sm font-black text-ink hover:bg-ink hover:text-white"
        >
          {t('emailLink')}
        </a>
      </div>
    </section>
  );
}
