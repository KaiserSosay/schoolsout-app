'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

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
};

export function ListYourCampForm() {
  const t = useTranslations('listYourCamp.form');
  const locale = useLocale();
  const [form, setForm] = useState<Form>({
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
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof Form>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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
      </div>
    );
  }

  const inputCls =
    'w-full rounded-2xl border border-cream-border bg-white p-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand-purple focus:outline-none';
  const labelCls = 'block text-xs font-bold text-ink';

  return (
    <form onSubmit={submit} className="mx-auto flex max-w-xl flex-col gap-4">
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
      <div className="grid gap-4 sm:grid-cols-2">
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
      <div className="grid gap-4 sm:grid-cols-2">
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
      <div className="grid gap-4 sm:grid-cols-2">
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
      <div className="grid gap-4 sm:grid-cols-2">
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
        <label className={labelCls} htmlFor="description">
          {t('description')}
        </label>
        <textarea
          id="description"
          rows={5}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className={inputCls + ' mt-1 resize-none'}
        />
      </div>
      {error ? <p className="text-sm font-semibold text-red-600">{error}</p> : null}
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
