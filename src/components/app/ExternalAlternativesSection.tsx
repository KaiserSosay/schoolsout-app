'use client';

import {
  renderDeepLink,
  type ExternalAlternative,
} from '@/lib/externalAlternatives';

// Rendered below the camps list on /app/closures/[id]. Split into two
// cards: sitters for 1-day closures, travel for 3+ day closures. Always
// carries the "not vetted by School's Out!" disclaimer per UX_PRINCIPLES
// rule #4 (honest disclosures).
export function ExternalAlternativesSection({
  alternatives,
  closure,
  parentZip,
  isKids,
}: {
  alternatives: ExternalAlternative[];
  closure: { start_date: string; end_date: string };
  parentZip: string | null;
  isKids: boolean;
}) {
  if (alternatives.length === 0) return null;

  const sitters = alternatives.filter((a) => a.type === 'sitter_service');
  const travel = alternatives.filter(
    (a) => a.type === 'cruise' || a.type === 'resort' || a.type === 'travel',
  );

  const cardCls = isKids
    ? 'rounded-2xl border border-white/10 bg-white/10 backdrop-blur p-5 space-y-3'
    : 'rounded-2xl border border-cream-border bg-white p-5 space-y-3';
  const headingCls = isKids ? 'text-white' : 'text-ink';
  const mutedCls = isKids ? 'text-white/70' : 'text-muted';

  return (
    <div className="space-y-4">
      {sitters.length > 0 ? (
        <section className={cardCls} aria-label="Sitter alternative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
                CONSIDER A SITTER
              </p>
              <h3 className={'text-lg font-black ' + headingCls}>
                Hire a vetted sitter for this day
              </h3>
            </div>
            <span
              className={
                'text-[10px] font-semibold ' +
                (isKids ? 'text-white/60' : 'text-muted')
              }
            >
              External · not vetted by School&apos;s Out!
            </span>
          </div>
          {sitters.map((s) => {
            const href = renderDeepLink(s.deep_link_template, {
              zip: parentZip,
              start: closure.start_date,
              end: closure.end_date,
            });
            return (
              <a
                key={s.id}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-1 rounded-full bg-brand-purple px-4 py-2 text-sm font-black text-white hover:brightness-110"
              >
                Open {s.provider} →
              </a>
            );
          })}
          <p className={'text-xs ' + mutedCls}>
            Care.com does their own background checks. We just save you a step.
          </p>
        </section>
      ) : null}

      {travel.length > 0 ? (
        <section className={cardCls} aria-label="Travel alternative">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-brand-purple">
                TURN IT INTO A TRIP
              </p>
              <h3 className={'text-lg font-black ' + headingCls}>
                Cruise or resort during the break
              </h3>
            </div>
            <span
              className={
                'text-[10px] font-semibold ' +
                (isKids ? 'text-white/60' : 'text-muted')
              }
            >
              External · not vetted by School&apos;s Out!
            </span>
          </div>
          <ul className="flex flex-col gap-2">
            {travel.map((t) => {
              const href = renderDeepLink(t.deep_link_template, {
                zip: parentZip,
                start: closure.start_date,
                end: closure.end_date,
              });
              const priceLabel = t.price_from_cents
                ? `from $${Math.round(t.price_from_cents / 100).toLocaleString()}`
                : null;
              return (
                <li key={t.id}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className={
                      'block rounded-xl border p-3 transition-colors ' +
                      (isKids
                        ? 'border-white/10 bg-white/5 hover:bg-white/10'
                        : 'border-cream-border bg-cream/50 hover:border-brand-purple/40')
                    }
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <strong className={'text-sm ' + headingCls}>
                        {t.name}
                      </strong>
                      {priceLabel ? (
                        <span className={'text-xs font-semibold ' + mutedCls}>
                          {priceLabel}
                        </span>
                      ) : null}
                    </div>
                    {t.description ? (
                      <p className={'mt-1 text-xs ' + mutedCls}>{t.description}</p>
                    ) : null}
                  </a>
                </li>
              );
            })}
          </ul>
          <p className={'text-xs ' + mutedCls}>
            We don&apos;t book cruises. We just point you at ones that fit your
            school calendar.
          </p>
        </section>
      ) : null}
    </div>
  );
}
