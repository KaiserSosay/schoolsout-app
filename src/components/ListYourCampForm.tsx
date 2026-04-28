'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { computeCompleteness, bandFor } from '@/lib/camps/completeness';
import { UI_PILL_CATEGORIES } from '@/lib/camps/categories';
import { chipBase, chipActive, chipInactive } from '@/components/shared/chip-classes';
import { celebrate } from '@/lib/confetti';

// Phase 2.7 Goal 5: rich camp application form with live completeness
// meter. Same endpoint (/api/camp-requests) — schema extended with the
// optional fields this form now collects.
//
// Phase 3.0 Item 3.5: collapsed accordion for the long tail of optional
// fields (sessions, social handles, scholarships, accommodations,
// testimonials). Photos remain deferred until the Supabase Storage
// `camp-submissions` bucket exists — see docs/grind-2026-04-25-blockers.md.

const MAX_SESSIONS = 8;

// Operators commonly type bare domains ("mycamp.com/signup",
// "www.thegrowingplace.school") into the URL fields. With <input
// type="url"> the browser blocks submit with "Please enter a URL" and
// the form silently fails — there is no POST, so they see whatever
// generic error tooltip the browser renders.
//
// Two coordinated changes work around this without weakening the data:
//   1. The three URL inputs render as type="text" + inputMode="url" so
//      the browser doesn't reject the bare domain at submit time. The
//      mobile URL keyboard still shows because of inputMode.
//   2. normalizeUrl prepends https:// before we POST, so the server's
//      strict zod .url() check still passes when the input is just a
//      domain. Empty stays empty (becomes null on the server side).
function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

type SessionEntry = {
  name: string;
  start_date: string;
  end_date: string;
  age_min: string;
  age_max: string;
  capacity: string;
};

const EMPTY_SESSION: SessionEntry = {
  name: '',
  start_date: '',
  end_date: '',
  age_min: '',
  age_max: '',
  capacity: '',
};

type Form = {
  submitted_by_email: string;
  submitted_by_name: string;
  business_name: string;
  camp_name: string;
  tagline: string;
  website: string;
  phone: string;
  address: string;
  neighborhood: string;
  age_min: string;
  age_max: string;
  description: string;
  categories: string[];
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
  registration_url: string;
  registration_deadline: string;
  // Phase 3.0 Item 3.5 — accordion fields
  sessions: SessionEntry[];
  instagram_handle: string;
  facebook_url: string;
  tiktok_handle: string;
  scholarships_available: boolean | null;
  scholarships_notes: string;
  accommodations: string;
  testimonials: string;
};

const EMPTY: Form = {
  submitted_by_email: '',
  submitted_by_name: '',
  business_name: '',
  camp_name: '',
  tagline: '',
  website: '',
  phone: '',
  address: '',
  neighborhood: '',
  age_min: '',
  age_max: '',
  description: '',
  categories: [],
  price_min_dollars: '',
  price_max_dollars: '',
  hours_start: '',
  hours_end: '',
  before_care_offered: false,
  before_care_start: '',
  after_care_offered: false,
  after_care_end: '',
  lunch_included: null,
  registration_url: '',
  registration_deadline: '',
  sessions: [{ ...EMPTY_SESSION }],
  instagram_handle: '',
  facebook_url: '',
  tiktok_handle: '',
  scholarships_available: null,
  scholarships_notes: '',
  accommodations: '',
  testimonials: '',
};

export function ListYourCampForm() {
  const t = useTranslations('listYourCamp.form');
  const tCat = useTranslations('app.camps.categories');
  const locale = useLocale();
  const [form, setForm] = useState<Form>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (success) celebrate();
  }, [success]);

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
      categories: form.categories,
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
      // Drop blank session rows (operators commonly leave the default
      // empty entry untouched if they aren't ready to publish dates).
      const cleanSessions = form.sessions
        .map((s) => ({
          name: s.name.trim() || null,
          start_date: s.start_date || null,
          end_date: s.end_date || null,
          age_min: s.age_min ? Number(s.age_min) : null,
          age_max: s.age_max ? Number(s.age_max) : null,
          capacity: s.capacity ? Number(s.capacity) : null,
        }))
        .filter(
          (s) =>
            s.name ||
            s.start_date ||
            s.end_date ||
            s.age_min != null ||
            s.age_max != null ||
            s.capacity != null,
        );
      const payload = {
        submitted_by_email: form.submitted_by_email.trim(),
        submitted_by_name: form.submitted_by_name.trim() || null,
        business_name: form.business_name.trim(),
        camp_name: form.camp_name.trim(),
        tagline: form.tagline.trim() || null,
        website: normalizeUrl(form.website) || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        neighborhood: form.neighborhood.trim() || null,
        age_min: form.age_min ? Number(form.age_min) : null,
        age_max: form.age_max ? Number(form.age_max) : null,
        description: form.description.trim() || null,
        categories: form.categories,
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
        registration_url: normalizeUrl(form.registration_url) || null,
        registration_deadline: form.registration_deadline || null,
        instagram_handle: form.instagram_handle.trim() || null,
        facebook_url: normalizeUrl(form.facebook_url) || null,
        tiktok_handle: form.tiktok_handle.trim() || null,
        testimonials: form.testimonials.trim() || null,
        sessions: cleanSessions,
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
                  fields: completeness.missing
                    .slice(0, 3)
                    .map((k) => t(`meter.fieldNames.${k}` as Parameters<typeof t>[0]))
                    .join(', '),
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
          <label className={labelCls} htmlFor="tagline">
            {t('tagline')}
          </label>
          <input
            id="tagline"
            maxLength={200}
            placeholder={t('taglinePlaceholder')}
            value={form.tagline}
            onChange={(e) => update('tagline', e.target.value)}
            className={inputCls + ' mt-1'}
          />
          <p className={helpCls}>{t('why.tagline')}</p>
        </div>
        <div>
          <label className={labelCls} htmlFor="website">
            {t('website')}
          </label>
          <input
            id="website"
            type="text"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
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
      </Section>

      <Section title={t('sections.registration')}>
        <div>
          <label className={labelCls} htmlFor="registration_url">
            {t('registrationUrl')}
          </label>
          <input
            id="registration_url"
            type="text"
            inputMode="url"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
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
          <p className={labelCls}>{t('categories')}</p>
          <p className={helpCls}>{t('categoriesHelp')}</p>
          <div
            role="group"
            aria-label={t('categories')}
            className="mt-2 flex flex-wrap gap-2"
            data-testid="categories-chips"
          >
            {UI_PILL_CATEGORIES.map((cat) => {
              const isActive = form.categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={isActive}
                  data-category={cat}
                  onClick={() =>
                    update(
                      'categories',
                      isActive
                        ? form.categories.filter((c) => c !== cat)
                        : [...form.categories, cat],
                    )
                  }
                  className={chipBase + ' ' + (isActive ? chipActive : chipInactive)}
                >
                  {tCat(cat)}
                </button>
              );
            })}
          </div>
        </div>
      </Section>

      <details
        className="rounded-2xl border border-cream-border bg-white p-4 md:p-5 [&_summary]:list-none"
        data-testid="quality-accordion"
      >
        <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-black text-ink">
          <span>
            {t('quality.title')}
            <span className="ml-2 text-[11px] font-normal text-muted">
              {t('quality.subhead')}
            </span>
          </span>
          <span aria-hidden="true" className="text-muted">▾</span>
        </summary>

        <div className="mt-4 flex flex-col gap-4">
          <p className="text-xs italic text-muted" data-testid="photos-deferred">
            {t('quality.photosDeferred')}
          </p>

          <div>
            <h4 className="text-sm font-bold text-ink">{t('quality.sessions.title')}</h4>
            <p className={helpCls}>{t('quality.sessions.help')}</p>
            <div className="mt-2 flex flex-col gap-3">
              {form.sessions.map((s, i) => (
                <SessionRow
                  key={i}
                  index={i}
                  session={s}
                  onChange={(next) =>
                    setForm((f) => ({
                      ...f,
                      sessions: f.sessions.map((row, j) => (j === i ? next : row)),
                    }))
                  }
                  onRemove={
                    form.sessions.length > 1
                      ? () =>
                          setForm((f) => ({
                            ...f,
                            sessions: f.sessions.filter((_, j) => j !== i),
                          }))
                      : null
                  }
                  t={t}
                  inputCls={inputCls}
                  labelCls={labelCls}
                />
              ))}
            </div>
            {form.sessions.length < MAX_SESSIONS ? (
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, sessions: [...f.sessions, { ...EMPTY_SESSION }] }))
                }
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-brand-purple hover:underline"
                data-testid="add-session"
              >
                + {t('quality.sessions.add')}
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls} htmlFor="instagram_handle">
                {t('quality.social.instagram')}
              </label>
              <input
                id="instagram_handle"
                placeholder="@yourcamp"
                value={form.instagram_handle}
                onChange={(e) => update('instagram_handle', e.target.value)}
                className={inputCls + ' mt-1'}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="facebook_url">
                {t('quality.social.facebook')}
              </label>
              <input
                id="facebook_url"
                type="text"
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                placeholder="https://facebook.com/…"
                value={form.facebook_url}
                onChange={(e) => update('facebook_url', e.target.value)}
                className={inputCls + ' mt-1'}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="tiktok_handle">
                {t('quality.social.tiktok')}
              </label>
              <input
                id="tiktok_handle"
                placeholder="@yourcamp"
                value={form.tiktok_handle}
                onChange={(e) => update('tiktok_handle', e.target.value)}
                className={inputCls + ' mt-1'}
              />
            </div>
          </div>

          <div>
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
              <div className="mt-2">
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

          <div>
            <label className={labelCls} htmlFor="testimonials">
              {t('quality.testimonials.label')}
            </label>
            <textarea
              id="testimonials"
              rows={4}
              maxLength={1000}
              value={form.testimonials}
              onChange={(e) => update('testimonials', e.target.value)}
              className={inputCls + ' mt-1 resize-none'}
              placeholder={t('quality.testimonials.placeholder')}
            />
            <p className={helpCls}>
              {t('quality.testimonials.counter', { used: form.testimonials.length, max: 1000 })}
            </p>
          </div>
        </div>
      </details>

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

function SessionRow({
  index,
  session,
  onChange,
  onRemove,
  t,
  inputCls,
  labelCls,
}: {
  index: number;
  session: SessionEntry;
  onChange: (next: SessionEntry) => void;
  onRemove: (() => void) | null;
  t: ReturnType<typeof useTranslations>;
  inputCls: string;
  labelCls: string;
}) {
  const set = <K extends keyof SessionEntry>(k: K, v: SessionEntry[K]) =>
    onChange({ ...session, [k]: v });
  return (
    <div
      className="rounded-xl border border-cream-border bg-cream/40 p-3"
      data-testid={`session-row-${index}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-ink">
          {t('quality.sessions.itemTitle', { n: index + 1 })}
        </span>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs text-muted hover:text-red-600"
            aria-label={t('quality.sessions.remove', { n: index + 1 })}
          >
            ×
          </button>
        ) : null}
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor={`session-${index}-name`}>
            {t('quality.sessions.name')}
          </label>
          <input
            id={`session-${index}-name`}
            value={session.name}
            onChange={(e) => set('name', e.target.value)}
            className={inputCls + ' mt-1'}
            placeholder={t('quality.sessions.namePlaceholder')}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor={`session-${index}-start`}>
            {t('quality.sessions.startDate')}
          </label>
          <input
            id={`session-${index}-start`}
            type="date"
            value={session.start_date}
            onChange={(e) => set('start_date', e.target.value)}
            className={inputCls + ' mt-1'}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor={`session-${index}-end`}>
            {t('quality.sessions.endDate')}
          </label>
          <input
            id={`session-${index}-end`}
            type="date"
            value={session.end_date}
            onChange={(e) => set('end_date', e.target.value)}
            className={inputCls + ' mt-1'}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor={`session-${index}-agemin`}>
            {t('quality.sessions.ageMin')}
          </label>
          <input
            id={`session-${index}-agemin`}
            type="number"
            min={0}
            max={25}
            value={session.age_min}
            onChange={(e) => set('age_min', e.target.value)}
            className={inputCls + ' mt-1'}
          />
        </div>
        <div>
          <label className={labelCls} htmlFor={`session-${index}-agemax`}>
            {t('quality.sessions.ageMax')}
          </label>
          <input
            id={`session-${index}-agemax`}
            type="number"
            min={0}
            max={25}
            value={session.age_max}
            onChange={(e) => set('age_max', e.target.value)}
            className={inputCls + ' mt-1'}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor={`session-${index}-capacity`}>
            {t('quality.sessions.capacity')}
          </label>
          <input
            id={`session-${index}-capacity`}
            type="number"
            min={0}
            value={session.capacity}
            onChange={(e) => set('capacity', e.target.value)}
            className={inputCls + ' mt-1'}
            placeholder="20"
          />
        </div>
      </div>
    </div>
  );
}
