'use client';

import Link from 'next/link';
import { closureHref, focusRing } from '@/lib/links';
import { daysUntil } from '@/lib/countdown';
import { MarkRegisteredButton } from './MarkRegisteredButton';

export type PlanCard = {
  plan_id: string;
  closure: {
    id: string;
    name: string;
    start_date: string;
    emoji: string;
  };
  kid_name: string; // one card per (plan, kid) combo
  plan_type: 'coverage' | 'activities' | 'mix';
  camp_names: string[];        // linked camp names for copy
  registration_deadline: string | null; // earliest deadline across linked camps
  registration_url: string | null;
  registered: boolean;
};

export function PlansSummary({
  cards,
  locale,
  hasUpcomingClosures,
}: {
  cards: PlanCard[];
  locale: string;
  hasUpcomingClosures: boolean;
}) {
  if (cards.length === 0) {
    if (!hasUpcomingClosures) return null;
    return (
      <section className="rounded-2xl border border-dashed border-cream-border bg-white/70 p-5">
        <p className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
          YOUR PLANS
        </p>
        <p className="mt-2 text-sm text-ink">
          You haven&apos;t planned any days yet.
        </p>
        <Link
          href={`/${locale}/app/plan-ahead`}
          className={
            'mt-3 inline-flex min-h-11 items-center gap-1 rounded-full bg-brand-purple px-4 py-2 text-xs font-black text-white hover:brightness-110 ' +
            focusRing
          }
        >
          Plan ahead →
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-muted">
          Your plans
        </h3>
        <Link
          href={`/${locale}/app/plan-ahead`}
          className={
            'text-xs font-bold text-brand-purple hover:underline ' + focusRing
          }
        >
          Plan ahead →
        </Link>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {cards.map((c) => (
          <li key={c.plan_id + '-' + c.kid_name}>
            <PlanCardView card={c} locale={locale} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function PlanCardView({ card, locale }: { card: PlanCard; locale: string }) {
  const start = new Date(card.closure.start_date + 'T00:00:00');
  const dateLabel = start.toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const urgency = urgencyFromDeadline(card.registration_deadline);
  const deadlineLabel = card.registration_deadline
    ? new Date(card.registration_deadline + 'T00:00:00').toLocaleDateString(
        locale,
        { weekday: 'short', month: 'short', day: 'numeric' },
      )
    : null;

  const summary =
    card.plan_type === 'coverage'
      ? `Coverage at ${card.camp_names.join(', ') || '—'}`
      : card.plan_type === 'activities'
        ? 'Family activities planned'
        : `${card.camp_names.join(', ') || 'Coverage'} + activities`;

  return (
    <article className="rounded-2xl border border-cream-border bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={closureHref(locale, card.closure.id)}
          className={'text-base font-black text-ink hover:text-brand-purple ' + focusRing}
        >
          <span aria-hidden className="mr-1">
            {card.closure.emoji}
          </span>
          {card.kid_name} · {card.closure.name}
        </Link>
        {card.registered ? (
          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-900">
            Registered
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-muted">{dateLabel}</p>
      <p className="mt-2 text-sm text-ink">{summary}</p>
      {deadlineLabel && !card.registered ? (
        <p
          className={
            'mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ' +
            (urgency === 'red'
              ? 'bg-red-100 text-red-900'
              : urgency === 'amber'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-cream-border text-ink')
          }
        >
          ⏰ Register by {deadlineLabel}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={closureHref(locale, card.closure.id)}
          className={
            'min-h-10 rounded-full border border-cream-border bg-white px-3 py-1.5 text-xs font-bold text-ink hover:border-brand-purple/40 ' +
            focusRing
          }
        >
          Edit plan
        </Link>
        {!card.registered ? (
          <MarkRegisteredButton planId={card.plan_id} registrationUrl={card.registration_url} />
        ) : null}
      </div>
    </article>
  );
}

function urgencyFromDeadline(iso: string | null): 'red' | 'amber' | 'none' {
  if (!iso) return 'none';
  const days = daysUntil(iso);
  if (days <= 2) return 'red';
  if (days <= 7) return 'amber';
  return 'none';
}
