'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { computeCompleteness, bandFor } from '@/lib/camps/completeness';

// Phase 2.7 Goal 5: rich camp application form with live completeness
// meter. Same endpoint (/api/camp-requests) — schema extended with the
// optional fields this form now collects. Photos + sessions + social
// handles are deferred (Supabase Storage + repeatable-field UX).

type Form = {
  submitted_by_email: string;
  submitted_by_name: string;
  business_name: string;
  camp_name: string;
  website: string;
  phone: string;
  address: string;
  neighborhood: string;
  age_min: string;
  age_max: string;
  description: string;
  categories: string;
  price_min_dollars: string;
  price_max_dollars: string;
  // Goal 5 extensions
  hours_start: string;
  hours_end: string;
  before_care_offered: boolean;
  before_care_start: string;
  after_care_offered: boolean;
  after_care_end: string;
  lunch_included: boolean | null;
  scholarships_available: boolean | null;
  scholarships_notes: string;
  accommodations: string;
  registration_url: string;
  registration_deadline: string;
};

const EMPTY: Form = {
  submitted_by_email: '',
  submitted_by_name: '',
  business_name: '',
  camp_name: '',
  website: '',
  phone: '',
  address: '',
  neighborhood: '',
  age_min: '',
  age_max: '',
  description: '',
  categories: '',
  price_min_dollars: '',
  price_max_dollars: '',
  hours_start: '',
  hours_end: '',
  before_care_offered: false,
  before_care_start: '',
  after_care_offered: false,
  after_care_end: '',
  lunch_included: null,
  scholarships_available: null,
  scholarships_notes: '',
  accommodations: '',
  registration_url: '',
  registration_deadline: '',
};

export function ListYourCampForm() {
  const t = useTranslations('listYourCamp.form');
  const locale = useLocale();
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const completeness = useMemo(() => {
    return computeCompleteness({
      phone: form.phone || null,
      address: form.address || null,
      website_url: form.website || null,
      ages_min: form.age_min ? Number(form.age_min) : null,
      ages_max: form.age_max ? Number(form.age_max) : null,
      hours_start: form.hours_start || null,
      hours_end: form.hours_end || null,
      price_min_cents: form.price_min_dollars
        ? Math.round(Number(form.price_min_dollars) * 100)
        : null,
      price_max_cents: form.price_max_dollars
        ? Math.round(Number(form.price_max_dollars) * 100)
        : null,
      description: form.description || null,
      categories: form.categories
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      registration_url: form.registration_url || null,
      registration_deadline: form.registration_deadline || null,
    });
  }, [form]);
  const band = bandFor(completeness.score);
  const pct = Math.round(completeness.score * 100);
  const meterCls =
    band === 'complete'
      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
      : band === 'partial'
        ? 'bg-amber-50 text-amber-900 border-amber-200'
        : 'bg-red-50 text-red-900 border-red-200';
  const barCls =
    band === 'complete'
      ? 'bg-emerald-500'
      : band === 'partial'
        ? 'bg-amber-500'
        : 'bg-red-500';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        submitted_by_email: form.submitted_by_email.trim(),
        submitted_by_name: form.submitted_by_name.trim() || null,
        business_name: form.business_name.trim(),
        camp_name: form.camp_name.trim(),
        website: form.website.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        neighborhood: form.neighborhood.trim() || null,
        age_min: form.age_min ? Number(form.age_min) : null,
        age_max: form.age_max ? Number(form.age_max) : null,
        description: form.description.trim() || null,
        categories: form.categories
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        price_min_cents: form.price_min_dollars
          ? Math.round(Number(form.price_min_dollars) * 100)
          : null,
        price_max_cents: form.price_max_dollars
          ? Math.round(Number(form.price_max_dollars) * 100)
          : null,
        hours_start: form.hours_start || null,
        hours_end: form.hours_end || null,
        before_care_offered: form.before_care_offered,
        before_care_start: form.before_care_start || null,
        after_care_offered: form.after_care_offered,
        after_care_end: form.after_care_end || null,
        lunch_included: form.lunch_included,
        scholarships_available: form.scholarships_available,
        scholarships_notes: form.scholarships_notes.trim() || null,
        accommodations: form.accommodations.trim() || null,
        registration_url: form.registration_url.trim() || null,
        registration_deadline: form.registration_deadline || null,
        applicant_completeness: completeness.score,
        locale,
      };
      const res = await fetch('/api/camp-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError(t('error'));
      } else {
        setSuccess(true);
      }
    } catch {
      setError(t('error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-cream-border bg-white p-8 text-center">
        <div className="text-5xl" aria-hidden>
          🎪
        </div>
        <h2 className="mt-4 text-2xl font-black text-ink">{t('success.title')}</h2>
        <p className="mt-2 text-sm text-muted">{t('success.subtitle')}</p>
        <p className="mt-3 text-xs text-muted">
          {t('success.quality', { pct })}
        </p>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-2xl border border-cream-border bg-white p-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand-purple focus:outline-none';
  const labelCls = 'block text-xs font-bold text-ink';
  const helpCls = 'mt-0.5 text-[11px] text-muted';

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-xl flex-col gap-4">
      {/* Completeness meter — sticky so operators see it climb as they type */}
      <div
        className={`sticky top-2 z-10 rounded-2xl border px-4 py-3 text-xs ${meterCls}`}
        data-testid="completeness-meter"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="font-bold">
            {t('meter.label', { pct })}
          </span>
          <span className="text-[11px] font-semibold opacity-80">
            {completeness.missing.length === 0
              ? t('meter.perfect')
              : t('meter.missing', {
                  fields: completeness.missing.slice(0, 3).join(', '),
                })}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-white/60">
          <div
            className={`h-full rounded-full transition-all ${barCls}`}
            style={{ width: `${pct}%` }}
            aria-hidden
          />
        </div>
      </div>

      <Section title={t('sections.contact')}>
        <div>
          <label className={labelCls} htmlFor="submitted_by_email">
            {t('email')}
          </label>
          <input
            id="submitted_by_email"
            type="email"
            required
            value={form.submitted_by_email}
            onChange={(e) => update('submitted_by_email', e.target.value)}
            className={inputCls + ' mt-1'}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="submitted_by_name">
            {t('yourName')}
          </label>
          <input
            id="submitted_by_name"
            value={form.submitted_by_name}
            onChange={(e) => update('submitted_by_name', e.target.value)}
            className={inputCls + ' mt-1'}
          />
        </div>
      </Section>

      <Section title={t('sections.basics')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="business_name">
              {t('businessName')}
            </label>
            <input
              id="business_name"
              required
              value={form.business_name}
              onChange={(e) => update('business_name', e.target.value)}
              className={inputCls + ' mt-1'}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="camp_name">
              {t('campName')}
            </label>
            <input
              id="camp_name"
              required
              value={form.camp_name}
              onChange={(e) => update('camp_name', e.target.value)}
              className={inputCls + ' mt-1'}
            />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="website">
            {t('website')}
          </label>
          <input
            id="website"
            type="url"
            placeholder="https://"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
            className={inputCls + ' mt-1'}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="description">
            {t('description')}
          </label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            className={inputCls + ' mt-1 resize-none'}
          />
          <p className={helpCls}>{t('why.description')}</p>
        </div>
      </Section>

      <Section title={t('sections.location')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="phone">
              {t('phone')}
            </label>
            <input
              id="phone"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              className={inputCls + ' mt-1'}
            />
            <p className={helpCls}>{t('why.phone')}</p>
          </div>
          <div>
            <label className={labelCls} htmlFor="neighborhood">
              {t('neighborhood')}
            </label>
            <input
              id="neighborhood"
              value={form.neighborhood}
              onChange={(e) => update('neighborhood', e.target.value)}
              className={inputCls + ' mt-1'}
            />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="address">
            {t('address')}
          </label>
          <input
            id="address"
            value={form.address}
            onChange={(e) => update('address', e.target.value)}
            className={inputCls + ' mt-1'}
          />
        </div>
      </Section>

      <Section title={t('sections.ages')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="age_min">
              {t('ageMin')}
            </label>
            <input
              id="age_min"
              type="number"
              min={0}
              max={25}
              value={form.age_min}
              onChange={(e) => update('age_min', e.target.value)}
              className={inputCls + ' mt-1'}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="age_max">
              {t('ageMax')}
            </label>
            <input
              id="age_max"
              type="number"
              min={0}
              max={25}
              value={form.age_max}
              onChange={(e) => update('age_max', e.target.value)}
              className={inputCls + ' mt-1'}
            />
          </div>
        </div>
        <p className={helpCls}>{t('why.ages')}</p>
      </Section>

      <Section title={t('sections.hours')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="hours_start">
              {t('hoursStart')}
            </label>
            <input
              id="hours_start"
              type="time"
              value={form.hours_start}
              onChange={(e) => update('hours_start', e.target.value)}
              className={inputCls + ' mt-1'}
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="hours_end">
              {t('hoursEnd')}
            </label>
            <input
              id="hours_end"
              type="time"
              value={form.hours_end}
              onChange={(e) => update('hours_end', e.target.value)}
              className={inputCls + ' mt-1'}
            />
          </div>
        </div>
        <p className={helpCls}>{t('why.hours')}</p>

        <label className="mt-3 flex items-center gap-2 text-sm font-bold text-ink">
          <input
            type="checkbox"
            checked={form.before_care_offered}
            onChange={(e) => update('before_care_offered', e.target.checked)}
          />
          {t('beforeCare')}
        </label>
        {form.before_care_offered ? (
          <div className="ml-6">
            <label className={labelCls} htmlFor="before_care_start">
              {t('beforeCareStart')}
            </label>
            <input
              id="before_care_start"
              type="time"
              value={form.before_care_start}
              onChange={(e) => update('before_care_start', e.target.value)}
              className={inputCls + ' mt-1'}
            />
            <p className={helpCls}>{t('why.beforeCare')}</p>
          </div>
        ) : null}

        <label className="mt-2 flex items-center gap-2 text-sm font-bold text-ink">
          <input
            type="checkbox"
            checked={form.after_care_offered}
            onChange={(e) => update('after_care_offered', e.target.checked)}
          />
          {t('afterCare')}
        </label>
        {form.after_care_offered ? (
          <div className="ml-6">
            <label className={labelCls} htmlFor="after_care_end">
              {t('afterCareEnd')}
            </label>
            <input
              id="after_care_end"
              type="time"
              value={form.after_care_end}
              onChange={(e) => update('after_care_end', e.target.value)}
              className={inputCls + ' mt-1'}
            />
          </div>
        ) : null}
      </Section>

      <Section title={t('sections.pricing')}>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor="price_min_dollars">
              {t('priceMin')}
            </label>
            <input
              id="price_min_dollars"
              type="number"
              min={0}
              value={form.price_min_dollars}
              onChange={(e) => update('price_min_dollars', e.target.value)}
              className={inputCls + ' mt-1'}
              placeholder="200"
            />
          </div>
          <div>
            <label className={labelCls} htmlFor="price_max_dollars">
              {t('priceMax')}
            </label>
            <input
              id="price_max_dollars"
              type="number"
              min={0}
              value={form.price_max_dollars}
              onChange={(e) => update('price_max_dollars', e.target.value)}
              className={inputCls + ' mt-1'}
              placeholder="450"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm font-bold text-ink">
          <input
            type="checkbox"
            checked={form.lunch_included === true}
            onChange={(e) => update('lunch_included', e.target.checked ? true : null)}
          />
          {t('lunchIncluded')}
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-ink">
          <input
            type="checkbox"
            checked={form.scholarships_available === true}
            onChange={(e) =>
              update('scholarships_available', e.target.checked ? true : null)
            }
          />
          {t('scholarshipsAvailable')}
        </label>
        {form.scholarships_available ? (
          <div>
            <label className={labelCls} htmlFor="scholarships_notes">
              {t('scholarshipsNotes')}
            </label>
            <textarea
              id="scholarships_notes"
              rows={2}
              value={form.scholarships_notes}
              onChange={(e) => update('scholarships_notes', e.target.value)}
              className={inputCls + ' mt-1 resize-none'}
            />
          </div>
        ) : null}
      </Section>

      <Section title={t('sections.registration')}>
        <div>
          <label className={labelCls} htmlFor="registration_url">
            {t('registrationUrl')}
          </label>
          <input
            id="registration_url"
            type="url"
            placeholder="https://"
            value={form.registration_url}
            onChange={(e) => update('registration_url', e.target.value)}
            className={inputCls + ' mt-1'}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="registration_deadline">
            {t('registrationDeadline')}
          </label>
          <input
            id="registration_deadline"
            type="date"
            value={form.registration_deadline}
            onChange={(e) => update('registration_deadline', e.target.value)}
            className={inputCls + ' mt-1'}
          />
          <p className={helpCls}>{t('why.registrationDeadline')}</p>
        </div>
      </Section>

      <Section title={t('sections.extras')}>
        <div>
          <label className={labelCls} htmlFor="categories">
            {t('categories')}
          </label>
          <input
            id="categories"
            value={form.categories}
            onChange={(e) => update('categories', e.target.value)}
            className={inputCls + ' mt-1'}
            placeholder="sports, arts, STEM"
          />
        </div>
        <div>
          <label className={labelCls} htmlFor="accommodations">
            {t('accommodations')}
          </label>
          <textarea
            id="accommodations"
            rows={3}
            value={form.accommodations}
            onChange={(e) => update('accommodations', e.target.value)}
            className={inputCls + ' mt-1 resize-none'}
          />
        </div>
      </Section>

      {error ? (
        <p className="text-sm font-semibold text-red-600">{error}</p>
      ) : null}
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 min-h-11 rounded-full bg-gold px-5 py-3 text-sm font-black text-ink transition-colors hover:bg-gold/90 disabled:opacity-60"
      >
        {submitting ? t('submitting') : t('submit')}
      </button>
      <p className="text-center text-xs text-muted">{t('responseTime')}</p>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-cream-border bg-white p-4 md:p-5">
      <h3 className="text-sm font-black text-ink">{title}</h3>
      {children}
    </section>
  );
}
