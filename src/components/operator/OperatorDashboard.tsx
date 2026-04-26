'use client';

import { useState } from 'react';
import { operatorCopy, type OperatorLocale } from '@/lib/operator/copy';

// The shape of the camps row the dashboard renders. Only includes the
// editable fields plus data_completeness for the meter; not a full mirror
// of the camps table.
export type OperatorCamp = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  categories: string[] | null;
  ages_min: number | null;
  ages_max: number | null;
  phone: string | null;
  email: string | null;
  website_url: string | null;
  registration_url: string | null;
  registration_deadline: string | null;
  price_tier: '$' | '$$' | '$$$' | null;
  price_min_cents: number | null;
  price_max_cents: number | null;
  price_notes: string | null;
  hours_start: string | null;
  hours_end: string | null;
  before_care_offered: boolean | null;
  before_care_start: string | null;
  before_care_price_cents: number | null;
  after_care_offered: boolean | null;
  after_care_end: string | null;
  after_care_price_cents: number | null;
  lunch_included: boolean | null;
  special_needs_friendly: boolean | null;
  scholarships_available: boolean | null;
  scholarships_notes: string | null;
  accommodations: string | null;
  photo_urls: string[] | null;
  data_completeness: number | null;
};

type Props = {
  locale: OperatorLocale;
  camp: OperatorCamp;
  campSlug: string;
  operatorEmail: string | null;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const CATEGORY_OPTIONS = [
  'sports',
  'arts',
  'STEM',
  'music',
  'theater',
  'language',
  'outdoors',
  'academic',
  'general',
];

export function OperatorDashboard({
  locale,
  camp: initialCamp,
  campSlug,
  operatorEmail,
}: Props) {
  const c = operatorCopy[locale];
  const [camp, setCamp] = useState<OperatorCamp>(initialCamp);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const completenessPct = Math.round((Number(camp.data_completeness) || 0) * 100);

  function patch<K extends keyof OperatorCamp>(key: K, value: OperatorCamp[K]) {
    setCamp((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveState('saving');
    // Build the payload — convert empty strings → null, dollar amounts to
    // cents (the form input is in dollars for usability).
    const payload = {
      description: trimOrNull(camp.description),
      categories: camp.categories ?? [],
      ages_min: camp.ages_min ?? undefined,
      ages_max: camp.ages_max ?? undefined,
      phone: trimOrNull(camp.phone),
      email: trimOrNull(camp.email),
      website_url: trimOrNull(camp.website_url),
      registration_url: trimOrNull(camp.registration_url),
      registration_deadline: trimOrNull(camp.registration_deadline),
      price_tier: camp.price_tier ?? undefined,
      price_min_cents: camp.price_min_cents ?? null,
      price_max_cents: camp.price_max_cents ?? null,
      price_notes: trimOrNull(camp.price_notes),
      hours_start: trimOrNull(camp.hours_start),
      hours_end: trimOrNull(camp.hours_end),
      before_care_offered: camp.before_care_offered ?? false,
      before_care_start: trimOrNull(camp.before_care_start),
      before_care_price_cents: camp.before_care_price_cents ?? null,
      after_care_offered: camp.after_care_offered ?? false,
      after_care_end: trimOrNull(camp.after_care_end),
      after_care_price_cents: camp.after_care_price_cents ?? null,
      lunch_included: camp.lunch_included,
      special_needs_friendly: camp.special_needs_friendly,
      scholarships_available: camp.scholarships_available,
      scholarships_notes: trimOrNull(camp.scholarships_notes),
      accommodations: trimOrNull(camp.accommodations),
      photo_urls: (camp.photo_urls ?? []).filter(Boolean).slice(0, 5),
    };
    const res = await fetch(`/api/operator/${encodeURIComponent(campSlug)}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setSaveState('saved');
      // Reset the indicator after a short delay so the user can see "Saved".
      setTimeout(() => setSaveState('idle'), 2000);
    } else {
      setSaveState('error');
    }
  }

  return (
    <main style={layout.page}>
      <header style={layout.header}>
        <p style={layout.eyebrow}>School&apos;s Out!</p>
        <h1 style={layout.h1}>{c.welcome(camp.name)}</h1>
        {operatorEmail && (
          <p style={layout.subhead}>{operatorEmail}</p>
        )}
      </header>

      <section style={layout.qualityCard} aria-labelledby="quality-heading">
        <h2 id="quality-heading" style={layout.h2}>
          {c.listingQuality}
        </h2>
        <div style={layout.meterTrack}>
          <div
            style={{
              ...layout.meterFill,
              width: `${completenessPct}%`,
              background: completenessPct >= 80 ? '#16A34A' : '#F5C842',
            }}
          />
        </div>
        <p style={layout.qualityValue}>
          {completenessPct}% — {c.listingQualityHelp}
        </p>
      </section>

      <form onSubmit={handleSubmit} style={layout.form}>
        <Section title={c.sectionBasics}>
          <Field label={c.fields.description} help={c.fields.descriptionHelp}>
            <textarea
              value={camp.description ?? ''}
              onChange={(e) => patch('description', e.target.value)}
              rows={4}
              style={layout.textarea}
              maxLength={4000}
            />
          </Field>
          <Field label={c.fields.categories}>
            <CategoryPicker
              value={camp.categories ?? []}
              onChange={(v) => patch('categories', v)}
            />
          </Field>
          <TwoCol>
            <Field label={c.fields.ages_min}>
              <NumberInput
                value={camp.ages_min}
                min={0}
                max={25}
                onChange={(n) => patch('ages_min', n)}
              />
            </Field>
            <Field label={c.fields.ages_max}>
              <NumberInput
                value={camp.ages_max}
                min={0}
                max={25}
                onChange={(n) => patch('ages_max', n)}
              />
            </Field>
          </TwoCol>
        </Section>

        <Section title={c.sectionContact}>
          <TwoCol>
            <Field label={c.fields.phone}>
              <input
                value={camp.phone ?? ''}
                onChange={(e) => patch('phone', e.target.value)}
                style={layout.input}
                maxLength={40}
              />
            </Field>
            <Field label={c.fields.email}>
              <input
                type="email"
                value={camp.email ?? ''}
                onChange={(e) => patch('email', e.target.value)}
                style={layout.input}
              />
            </Field>
          </TwoCol>
          <Field label={c.fields.website_url}>
            <input
              type="url"
              value={camp.website_url ?? ''}
              onChange={(e) => patch('website_url', e.target.value)}
              style={layout.input}
              placeholder="https://"
            />
          </Field>
          <Field label={c.fields.registration_url}>
            <input
              type="url"
              value={camp.registration_url ?? ''}
              onChange={(e) => patch('registration_url', e.target.value)}
              style={layout.input}
              placeholder="https://"
            />
          </Field>
          <Field label={c.fields.registration_deadline}>
            <input
              type="date"
              value={camp.registration_deadline ?? ''}
              onChange={(e) => patch('registration_deadline', e.target.value)}
              style={layout.input}
            />
          </Field>
        </Section>

        <Section title={c.sectionPricing}>
          <Field label={c.fields.price_tier}>
            <select
              value={camp.price_tier ?? '$$'}
              onChange={(e) =>
                patch('price_tier', e.target.value as OperatorCamp['price_tier'])
              }
              style={layout.input}
            >
              <option value="$">$</option>
              <option value="$$">$$</option>
              <option value="$$$">$$$</option>
            </select>
          </Field>
          <TwoCol>
            <Field label={c.fields.price_min_cents}>
              <DollarInput
                cents={camp.price_min_cents}
                onChange={(c) => patch('price_min_cents', c)}
              />
            </Field>
            <Field label={c.fields.price_max_cents}>
              <DollarInput
                cents={camp.price_max_cents}
                onChange={(c) => patch('price_max_cents', c)}
              />
            </Field>
          </TwoCol>
          <Field label={c.fields.price_notes}>
            <input
              value={camp.price_notes ?? ''}
              onChange={(e) => patch('price_notes', e.target.value)}
              style={layout.input}
              maxLength={500}
            />
          </Field>
        </Section>

        <Section title={c.sectionLogistics}>
          <TwoCol>
            <Field label={c.fields.hours_start}>
              <input
                type="time"
                value={camp.hours_start ?? ''}
                onChange={(e) => patch('hours_start', e.target.value)}
                style={layout.input}
              />
            </Field>
            <Field label={c.fields.hours_end}>
              <input
                type="time"
                value={camp.hours_end ?? ''}
                onChange={(e) => patch('hours_end', e.target.value)}
                style={layout.input}
              />
            </Field>
          </TwoCol>
          <CheckboxField
            label={c.fields.before_care_offered}
            checked={Boolean(camp.before_care_offered)}
            onChange={(v) => patch('before_care_offered', v)}
          />
          {camp.before_care_offered && (
            <TwoCol>
              <Field label={c.fields.before_care_start}>
                <input
                  type="time"
                  value={camp.before_care_start ?? ''}
                  onChange={(e) => patch('before_care_start', e.target.value)}
                  style={layout.input}
                />
              </Field>
              <Field label={c.fields.before_care_price_cents}>
                <DollarInput
                  cents={camp.before_care_price_cents}
                  onChange={(c) => patch('before_care_price_cents', c)}
                />
              </Field>
            </TwoCol>
          )}
          <CheckboxField
            label={c.fields.after_care_offered}
            checked={Boolean(camp.after_care_offered)}
            onChange={(v) => patch('after_care_offered', v)}
          />
          {camp.after_care_offered && (
            <TwoCol>
              <Field label={c.fields.after_care_end}>
                <input
                  type="time"
                  value={camp.after_care_end ?? ''}
                  onChange={(e) => patch('after_care_end', e.target.value)}
                  style={layout.input}
                />
              </Field>
              <Field label={c.fields.after_care_price_cents}>
                <DollarInput
                  cents={camp.after_care_price_cents}
                  onChange={(c) => patch('after_care_price_cents', c)}
                />
              </Field>
            </TwoCol>
          )}
          <CheckboxField
            label={c.fields.lunch_included}
            checked={Boolean(camp.lunch_included)}
            onChange={(v) => patch('lunch_included', v)}
          />
        </Section>

        <Section title={c.sectionExtras}>
          <CheckboxField
            label={c.fields.special_needs_friendly}
            checked={Boolean(camp.special_needs_friendly)}
            onChange={(v) => patch('special_needs_friendly', v)}
          />
          <Field label={c.fields.accommodations}>
            <textarea
              value={camp.accommodations ?? ''}
              onChange={(e) => patch('accommodations', e.target.value)}
              rows={3}
              style={layout.textarea}
              maxLength={1000}
            />
          </Field>
          <CheckboxField
            label={c.fields.scholarships_available}
            checked={Boolean(camp.scholarships_available)}
            onChange={(v) => patch('scholarships_available', v)}
          />
          {camp.scholarships_available && (
            <Field label={c.fields.scholarships_notes}>
              <textarea
                value={camp.scholarships_notes ?? ''}
                onChange={(e) => patch('scholarships_notes', e.target.value)}
                rows={2}
                style={layout.textarea}
                maxLength={1000}
              />
            </Field>
          )}
        </Section>

        <Section title={c.sectionPhotos}>
          <Field label={c.fields.photo_urls}>
            <textarea
              value={(camp.photo_urls ?? []).join('\n')}
              onChange={(e) =>
                patch(
                  'photo_urls',
                  e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .slice(0, 5),
                )
              }
              rows={5}
              style={layout.textarea}
              placeholder="https://..."
            />
          </Field>
        </Section>

        <div style={layout.actions}>
          <button type="submit" style={layout.saveButton} disabled={saveState === 'saving'}>
            {saveState === 'saving' ? c.saving : c.save}
          </button>
          {saveState === 'saved' && (
            <span style={{ ...layout.statusBadge, color: '#16A34A' }}>
              ✓ {c.saved}
            </span>
          )}
          {saveState === 'error' && (
            <span style={{ ...layout.statusBadge, color: '#DC2626' }}>
              {c.error}
            </span>
          )}
        </div>
      </form>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Small typed presentational helpers — keep the JSX above readable.
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={layout.sectionCard}>
      <h2 style={layout.h2}>{title}</h2>
      <div style={layout.sectionBody}>{children}</div>
    </section>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <label style={layout.field}>
      <span style={layout.label}>{label}</span>
      {children}
      {help && <span style={layout.fieldHelp}>{help}</span>}
    </label>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return <div style={layout.twoCol}>{children}</div>;
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={layout.checkboxField}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

function NumberInput({
  value,
  min,
  max,
  onChange,
}: {
  value: number | null;
  min?: number;
  max?: number;
  onChange: (n: number | null) => void;
}) {
  return (
    <input
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === '' ? null : Number(v));
      }}
      style={layout.input}
    />
  );
}

function DollarInput({
  cents,
  onChange,
}: {
  cents: number | null;
  onChange: (cents: number | null) => void;
}) {
  const dollars = cents == null ? '' : (cents / 100).toString();
  return (
    <input
      type="number"
      step="1"
      min={0}
      value={dollars}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '') return onChange(null);
        const n = Number(v);
        if (Number.isNaN(n)) return;
        onChange(Math.round(n * 100));
      }}
      style={layout.input}
      placeholder="0"
    />
  );
}

function CategoryPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (v: string[]) => void;
}) {
  function toggle(cat: string) {
    onChange(value.includes(cat) ? value.filter((v) => v !== cat) : [...value, cat]);
  }
  return (
    <div style={layout.chipRow}>
      {CATEGORY_OPTIONS.map((cat) => {
        const on = value.includes(cat);
        return (
          <button
            key={cat}
            type="button"
            onClick={() => toggle(cat)}
            style={{
              ...layout.chip,
              background: on ? '#6B4FBB' : '#F5F2E9',
              color: on ? '#FFFFFF' : '#1A1A1A',
              borderColor: on ? '#6B4FBB' : '#E8E4DA',
            }}
            aria-pressed={on}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}

function trimOrNull(s: string | null | undefined): string | null {
  if (s == null) return null;
  const trimmed = s.trim();
  return trimmed === '' ? null : trimmed;
}

// ---------------------------------------------------------------------------
// Inline styles. Kept local — Tailwind isn't wired into operator-only routes
// yet and the page is small enough that style objects beat a new CSS module.
// ---------------------------------------------------------------------------

const layout = {
  page: {
    maxWidth: 720,
    margin: '0 auto',
    padding: '32px 16px 80px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#1A1A1A',
  } as React.CSSProperties,
  header: { marginBottom: 24 } as React.CSSProperties,
  eyebrow: {
    fontSize: 13,
    fontWeight: 800,
    color: '#6B4FBB',
    letterSpacing: '0.02em',
    margin: 0,
  } as React.CSSProperties,
  h1: {
    fontSize: 28,
    fontWeight: 800,
    margin: '8px 0 4px',
  } as React.CSSProperties,
  subhead: { fontSize: 14, color: '#71717A', margin: 0 } as React.CSSProperties,
  qualityCard: {
    padding: 16,
    borderRadius: 16,
    border: '1px solid #E8E4DA',
    background: '#FBF8F1',
    marginBottom: 24,
  } as React.CSSProperties,
  meterTrack: {
    width: '100%',
    height: 12,
    borderRadius: 999,
    background: '#E8E4DA',
    overflow: 'hidden',
    margin: '12px 0 8px',
  } as React.CSSProperties,
  meterFill: {
    height: '100%',
    transition: 'width 200ms ease',
  } as React.CSSProperties,
  qualityValue: { fontSize: 13, color: '#71717A', margin: 0 } as React.CSSProperties,
  form: { display: 'flex', flexDirection: 'column', gap: 16 } as React.CSSProperties,
  sectionCard: {
    padding: 20,
    borderRadius: 16,
    border: '1px solid #E8E4DA',
    background: '#FFFFFF',
  } as React.CSSProperties,
  h2: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 12px',
  } as React.CSSProperties,
  sectionBody: { display: 'flex', flexDirection: 'column', gap: 12 } as React.CSSProperties,
  field: { display: 'flex', flexDirection: 'column', gap: 6 } as React.CSSProperties,
  label: { fontSize: 13, fontWeight: 600 } as React.CSSProperties,
  fieldHelp: { fontSize: 12, color: '#71717A' } as React.CSSProperties,
  input: {
    padding: '10px 12px',
    border: '1px solid #E8E4DA',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    background: '#FFFFFF',
  } as React.CSSProperties,
  textarea: {
    padding: '10px 12px',
    border: '1px solid #E8E4DA',
    borderRadius: 8,
    fontSize: 14,
    fontFamily: 'inherit',
    background: '#FFFFFF',
    resize: 'vertical' as const,
  } as React.CSSProperties,
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  } as React.CSSProperties,
  checkboxField: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 14,
    cursor: 'pointer',
  } as React.CSSProperties,
  chipRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,
  chip: {
    padding: '6px 12px',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    border: '1px solid',
    cursor: 'pointer',
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  } as React.CSSProperties,
  saveButton: {
    background: '#F5C842',
    color: '#1A1A1A',
    padding: '12px 24px',
    borderRadius: 12,
    fontWeight: 800,
    fontSize: 15,
    border: 'none',
    cursor: 'pointer',
    minHeight: 44,
  } as React.CSSProperties,
  statusBadge: {
    fontSize: 14,
    fontWeight: 600,
  } as React.CSSProperties,
};
