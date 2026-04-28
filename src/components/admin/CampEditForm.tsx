'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateCampSimpleFields } from '@/app/[locale]/admin/camps/[slug]/edit/actions';

// Phase B Step 2 — admin camp edit form.
//
// The form is now MIXED-MODE:
//   1. A small "Quick edit" form on top wires 5 fields (tagline,
//      phone, email, registration_url, is_featured) to a real server
//      action with inline validation + success feedback.
//   2. The remaining columns stay as the scaffold from the overnight
//      commit (87ba11e) — placeholders with a disabled submit. The
//      morning's next steps wire those, one section at a time.
//
// We keep both surfaces in this single component so the page route
// doesn't need to change and so it's obvious to a reviewer where the
// "wired" boundary lives.

type Camp = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tagline?: string | null;
  phone: string | null;
  email?: string | null;
  website_url: string | null;
  registration_url?: string | null;
  address: string | null;
  neighborhood: string | null;
  city?: string | null;
  ages_min: number;
  ages_max: number;
  price_tier: '$' | '$$' | '$$$';
  categories: string[];
  verified: boolean;
  is_featured: boolean;
  is_launch_partner: boolean;
  featured_until: string | null;
  launch_partner_until: string | null;
  logo_url?: string | null;
  hero_url?: string | null;
  sessions?: unknown[];
  pricing_tiers?: unknown[];
  fees?: unknown[];
  enrollment_window?: unknown | null;
  activities?: string[];
  what_to_bring?: string[];
  lunch_policy?: string | null;
  extended_care_policy?: string | null;
};

const inputCls =
  'w-full rounded-xl border border-cream-border bg-white px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none disabled:bg-cream/60 disabled:text-muted';

const labelCls =
  'block text-[11px] font-black uppercase tracking-wider text-muted mb-1';

const sectionLabelCls =
  'mt-6 mb-2 text-xs font-black uppercase tracking-wider text-brand-purple';

const TAGLINE_MAX = 200;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label className={labelCls}>{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

function PlaceholderJsonField({ label, hint }: { label: string; hint: string }) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        disabled
        rows={2}
        placeholder="JSON editor coming in morning"
        className={inputCls}
      />
    </Field>
  );
}

function PlaceholderArrayField({ label, hint }: { label: string; hint: string }) {
  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        disabled
        placeholder="comma-separated for now; multi-input UI coming in morning"
        className={inputCls}
      />
    </Field>
  );
}

function QuickEditForm({ camp }: { camp: Camp }) {
  const t = useTranslations('admin.camps.edit');

  const [tagline, setTagline] = useState(camp.tagline ?? '');
  const [phone, setPhone] = useState(camp.phone ?? '');
  const [email, setEmail] = useState(camp.email ?? '');
  const [registrationUrl, setRegistrationUrl] = useState(
    camp.registration_url ?? '',
  );
  const [isFeatured, setIsFeatured] = useState(camp.is_featured ?? false);

  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSavedAt(null);

    startTransition(async () => {
      const result = await updateCampSimpleFields({
        slug: camp.slug,
        tagline: tagline.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        registration_url: registrationUrl.trim() || null,
        is_featured: isFeatured,
      });

      if (result.ok) {
        setSavedAt(new Date());
      } else {
        setErrors(result.errors);
      }
    });
  }

  return (
    <form
      data-testid="camp-quick-edit-form"
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-cream-border bg-white p-5"
    >
      <div>
        <h3 className="text-base font-black text-ink">{t('quickEditTitle')}</h3>
        <p className="text-sm text-muted">{t('quickEditBody')}</p>
      </div>

      <Field
        label={t('fields.tagline')}
        hint={`${tagline.length}/${TAGLINE_MAX}`}
      >
        <input
          data-testid="quick-edit-tagline"
          type="text"
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          maxLength={TAGLINE_MAX}
          placeholder={t('fields.taglinePlaceholder')}
          className={inputCls}
        />
        {errors.tagline ? (
          <p className="mt-1 text-sm font-semibold text-red-700">
            {errors.tagline}
          </p>
        ) : null}
      </Field>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label={t('fields.phone')}>
          <input
            data-testid="quick-edit-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(305) 446-0846"
            className={inputCls}
          />
        </Field>
        <Field label={t('fields.email')}>
          <input
            data-testid="quick-edit-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="info@example.com"
            className={inputCls}
          />
          {errors.email ? (
            <p className="mt-1 text-sm font-semibold text-red-700">
              {errors.email}
            </p>
          ) : null}
        </Field>
      </div>

      <Field label={t('fields.registrationUrl')}>
        <input
          data-testid="quick-edit-registration-url"
          type="url"
          value={registrationUrl}
          onChange={(e) => setRegistrationUrl(e.target.value)}
          placeholder="https://…"
          className={inputCls}
        />
        {errors.registration_url ? (
          <p className="mt-1 text-sm font-semibold text-red-700">
            {errors.registration_url}
          </p>
        ) : null}
      </Field>

      <div className="flex items-center gap-3 rounded-xl border border-cream-border bg-cream/40 p-3">
        <input
          data-testid="quick-edit-is-featured"
          id="quick-edit-is-featured"
          type="checkbox"
          checked={isFeatured}
          onChange={(e) => setIsFeatured(e.target.checked)}
          className="h-5 w-5"
        />
        <label
          htmlFor="quick-edit-is-featured"
          className="flex-1 cursor-pointer text-sm font-bold text-ink"
        >
          {t('fields.isFeatured')}
        </label>
        <p className="text-xs text-muted">{t('fields.isFeaturedHelp')}</p>
      </div>

      {errors._form ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {errors._form}
        </p>
      ) : null}

      {savedAt && Object.keys(errors).length === 0 ? (
        <p
          data-testid="quick-edit-saved"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
        >
          {t('saved', { time: savedAt.toLocaleTimeString() })}
        </p>
      ) : null}

      <div className="flex justify-end pt-1">
        <button
          type="submit"
          data-testid="quick-edit-submit"
          disabled={isPending}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2 text-sm font-black text-cream disabled:opacity-60"
        >
          {isPending ? t('actions.saving') : t('actions.save')}
        </button>
      </div>
    </form>
  );
}

function ScaffoldForm({ camp }: { camp: Camp }) {
  // Form state lives in useState so admins can tweak placeholders
  // visually before each section is wired. Nothing here persists.
  const [name, setName] = useState(camp.name ?? '');
  const [description, setDescription] = useState(camp.description ?? '');
  const [websiteUrl, setWebsiteUrl] = useState(camp.website_url ?? '');
  const [address, setAddress] = useState(camp.address ?? '');
  const [neighborhood, setNeighborhood] = useState(camp.neighborhood ?? '');
  const [city, setCity] = useState(camp.city ?? '');
  const [agesMin, setAgesMin] = useState(String(camp.ages_min));
  const [agesMax, setAgesMax] = useState(String(camp.ages_max));
  const [priceTier, setPriceTier] = useState<'$' | '$$' | '$$$'>(camp.price_tier);
  const [categoriesText, setCategoriesText] = useState(
    (camp.categories ?? []).join(', '),
  );
  const [verified, setVerified] = useState(camp.verified);
  const [isLaunchPartner, setIsLaunchPartner] = useState(camp.is_launch_partner);
  const [featuredUntil, setFeaturedUntil] = useState(camp.featured_until ?? '');
  const [launchPartnerUntil, setLaunchPartnerUntil] = useState(
    camp.launch_partner_until ?? '',
  );
  const [logoUrl, setLogoUrl] = useState(camp.logo_url ?? '');
  const [heroUrl, setHeroUrl] = useState(camp.hero_url ?? '');
  const [lunchPolicy, setLunchPolicy] = useState(camp.lunch_policy ?? '');
  const [extendedCarePolicy, setExtendedCarePolicy] = useState(
    camp.extended_care_policy ?? '',
  );

  return (
    <form
      data-testid="camp-edit-form"
      className="space-y-5 rounded-2xl border border-cream-border bg-white p-5"
      onSubmit={(e) => {
        // Belt-and-suspenders: the submit button is disabled, but if a
        // patch enables it before wiring a real handler, this
        // preventDefault keeps the form from POSTing to nowhere.
        e.preventDefault();
      }}
    >
      <div
        role="status"
        className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900"
        data-testid="scaffold-banner"
      >
        ⚠ Scaffold mode — fields below not yet wired. Submit is disabled.
        Sections wire one at a time. Spec:{' '}
        <code className="font-mono">
          docs/plans/camp-data-surfaces-audit-2026-04-27.md
        </code>
      </div>

      <p className={sectionLabelCls}>Identity</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Name">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field
          label="Slug (read-only)"
          hint="Slugs are immutable per R4 — never rewrite a live URL."
        >
          <input value={camp.slug} readOnly disabled className={inputCls} />
        </Field>
      </div>

      <Field label="Description (markdown)" hint="Long-form description. Markdown supported.">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={6}
          className={inputCls}
        />
      </Field>

      <p className={sectionLabelCls}>Contact</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Website URL">
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <p className={sectionLabelCls}>Location</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Address">
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Neighborhood">
          <input
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="City">
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <p className={sectionLabelCls}>Audience + Pricing</p>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Ages min">
          <input
            type="number"
            value={agesMin}
            onChange={(e) => setAgesMin(e.target.value)}
            className={inputCls}
            min={0}
          />
        </Field>
        <Field label="Ages max">
          <input
            type="number"
            value={agesMax}
            onChange={(e) => setAgesMax(e.target.value)}
            className={inputCls}
            min={0}
          />
        </Field>
        <Field label="Price tier">
          <select
            value={priceTier}
            onChange={(e) => setPriceTier(e.target.value as '$' | '$$' | '$$$')}
            className={inputCls}
          >
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
          </select>
        </Field>
      </div>

      <Field
        label="Categories (comma-separated)"
        hint="Canonical lowercase tags. Enforced by migration 052 normalization."
      >
        <input
          value={categoriesText}
          onChange={(e) => setCategoriesText(e.target.value)}
          className={inputCls}
          placeholder="e.g. arts, stem, religious, preschool"
        />
      </Field>

      <p className={sectionLabelCls}>Trust + Visibility flags</p>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="flex items-center gap-2 text-sm font-bold text-ink">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
          />
          verified
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-ink">
          <input
            type="checkbox"
            checked={isLaunchPartner}
            onChange={(e) => setIsLaunchPartner(e.target.checked)}
          />
          is_launch_partner
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Featured until" hint="When the Featured badge expires.">
          <input
            type="datetime-local"
            value={featuredUntil ? featuredUntil.slice(0, 16) : ''}
            onChange={(e) => setFeaturedUntil(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Launch partner until">
          <input
            type="datetime-local"
            value={launchPartnerUntil ? launchPartnerUntil.slice(0, 16) : ''}
            onChange={(e) => setLaunchPartnerUntil(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>

      <p className={sectionLabelCls}>Images (Phase B)</p>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Logo URL" hint="Square (~256x256). Storage bucket: camp-logos.">
          <div className="flex gap-2">
            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className={inputCls}
              placeholder="https://… or upload"
            />
            <button
              type="button"
              disabled
              className="shrink-0 rounded-full bg-ink/30 px-4 py-2 text-xs font-black text-cream"
              title="Upload UI coming in morning"
            >
              Upload
            </button>
          </div>
        </Field>
        <Field label="Hero URL" hint="16:9 (~1200x675). Storage bucket: camp-heroes.">
          <div className="flex gap-2">
            <input
              type="url"
              value={heroUrl}
              onChange={(e) => setHeroUrl(e.target.value)}
              className={inputCls}
              placeholder="https://… or upload"
            />
            <button
              type="button"
              disabled
              className="shrink-0 rounded-full bg-ink/30 px-4 py-2 text-xs font-black text-cream"
              title="Upload UI coming in morning"
            >
              Upload
            </button>
          </div>
        </Field>
      </div>

      <p className={sectionLabelCls}>Structured fields (Phase B — JSON editors coming)</p>
      <PlaceholderJsonField
        label="Sessions"
        hint="Array of {label, start_date, end_date, weekly_themes[], notes}."
      />
      <PlaceholderJsonField
        label="Pricing tiers"
        hint="Array of {label, hours, session/both/weekly price cents, notes}."
      />
      <PlaceholderJsonField
        label="Fees"
        hint="Array of {label, amount_cents, refundable, notes}."
      />
      <PlaceholderJsonField
        label="Enrollment window"
        hint="{opens_at, closes_at, status}."
      />
      <PlaceholderArrayField
        label="Activities"
        hint="Activity list — Arts, STEM, Cooking, etc."
      />
      <PlaceholderArrayField
        label="What to bring"
        hint="Items parents send — sunscreen, water bottle, lunch, etc."
      />
      <Field
        label="Lunch policy"
        hint="Plain-text — from home, provided, optional via Our Lunches, etc."
      >
        <textarea
          value={lunchPolicy}
          onChange={(e) => setLunchPolicy(e.target.value)}
          rows={2}
          className={inputCls}
        />
      </Field>
      <Field
        label="Extended care policy"
        hint="Plain-text — before-care + after-care availability and pricing."
      >
        <textarea
          value={extendedCarePolicy}
          onChange={(e) => setExtendedCarePolicy(e.target.value)}
          rows={2}
          className={inputCls}
        />
      </Field>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled
          title="Form not yet wired"
          data-testid="camp-edit-submit"
          className="rounded-full bg-ink/30 px-6 py-3 text-sm font-black text-cream"
        >
          Save (disabled — scaffold)
        </button>
      </div>
    </form>
  );
}

export function CampEditForm({ camp }: { camp: Camp }) {
  const t = useTranslations('admin.camps.edit');

  return (
    <div className="space-y-6">
      <div
        role="status"
        data-testid="mixed-mode-banner"
        className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900"
      >
        {t('bannerMixed')}
      </div>

      <QuickEditForm camp={camp} />

      <ScaffoldForm camp={camp} />
    </div>
  );
}
