'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

// Phase 4.7.1 — public submission form on every school detail page.
// Collapsed-by-default link "Update this school's calendar →"; tap to
// expand inline. Anyone (logged-in or not) can fill it out. Form state
// is local; success state replaces the form with a confirmation panel.

type Role = 'principal' | 'teacher' | 'office_manager' | 'parent' | 'other';
const ROLES: Role[] = ['principal', 'teacher', 'office_manager', 'parent', 'other'];

type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'success'; domainVerified: boolean }
  | { kind: 'error'; message: string };

export function SchoolCalendarSubmissionForm({
  schoolSlug,
  schoolName,
}: {
  schoolSlug: string;
  schoolName: string;
}) {
  const t = useTranslations('public.school.calendarSubmission');
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [updates, setUpdates] = useState('');
  const [notes, setNotes] = useState('');
  const [state, setState] = useState<SubmitState>({ kind: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !role || !updates.trim()) return;
    setState({ kind: 'submitting' });
    try {
      const res = await fetch(
        `/api/schools/${schoolSlug}/calendar-submissions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submitter_email: email.trim(),
            submitter_name: name.trim() || undefined,
            submitter_role: role,
            proposed_updates: updates.trim(),
            notes: notes.trim() || undefined,
          }),
        },
      );
      if (res.status === 429) {
        setState({ kind: 'error', message: t('rateLimited') });
        return;
      }
      if (!res.ok) {
        setState({ kind: 'error', message: t('error') });
        return;
      }
      const j = (await res.json()) as { domain_verified: boolean };
      setState({ kind: 'success', domainVerified: Boolean(j.domain_verified) });
    } catch {
      setState({ kind: 'error', message: t('error') });
    }
  }

  if (!open) {
    return (
      <section className="mt-6 rounded-3xl border border-cream-border bg-cream/60 p-5 md:p-6">
        <button
          type="button"
          data-testid="calendar-submission-cta"
          onClick={() => setOpen(true)}
          aria-label={t('cta.aria', { schoolName })}
          aria-expanded={false}
          aria-controls="calendar-submission-form"
          className="text-sm font-bold text-brand-purple hover:underline"
        >
          {t('cta')}
        </button>
      </section>
    );
  }

  if (state.kind === 'success') {
    return (
      <section
        data-testid="calendar-submission-success"
        className="mt-6 rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-5 md:p-6"
      >
        <p className="text-base font-black text-emerald-900">
          {t('success.title')}
        </p>
        <p className="mt-2 text-sm text-emerald-900/85">
          {t('success.body', { email })}
        </p>
        {state.domainVerified ? (
          <p className="mt-2 text-xs font-bold text-emerald-900/80">
            ✓ {t('success.domainVerified', { schoolName })}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section
      id="calendar-submission-form"
      className="mt-6 rounded-3xl border-2 border-brand-purple bg-purple-soft p-5 md:p-6"
    >
      <p className="text-sm text-ink/85">{t('intro', { schoolName })}</p>
      <form onSubmit={submit} className="mt-4 space-y-4">
        <label className="block">
          <span className="text-xs font-bold text-ink">{t('emailLabel')}</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('emailPlaceholder')}
            data-testid="submission-email"
            className="mt-1 w-full rounded-xl border border-cream-border bg-white px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-ink">
            {t('nameLabel')}{' '}
            <span className="text-muted">{t('nameOptional')}</span>
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="submission-name"
            className="mt-1 w-full rounded-xl border border-cream-border bg-white px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
          />
        </label>

        <fieldset>
          <legend className="text-xs font-bold text-ink">
            {t('roleLabel')}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <label
                key={r}
                className={
                  'cursor-pointer rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ' +
                  (role === r
                    ? 'border-brand-purple bg-brand-purple text-white'
                    : 'border-cream-border bg-white text-ink hover:border-brand-purple/40')
                }
              >
                <input
                  type="radio"
                  name="submitter_role"
                  value={r}
                  checked={role === r}
                  onChange={() => setRole(r)}
                  data-testid={`submission-role-${r}`}
                  className="sr-only"
                />
                {t(`role.${r}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-xs font-bold text-ink">
            {t('updatesLabel')}
          </span>
          <textarea
            required
            rows={8}
            value={updates}
            onChange={(e) => setUpdates(e.target.value)}
            placeholder={t('updatesPlaceholder')}
            data-testid="submission-updates"
            className="mt-1 w-full rounded-xl border border-cream-border bg-white px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-ink">
            {t('notesLabel')}{' '}
            <span className="text-muted">{t('notesOptional')}</span>
          </span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            data-testid="submission-notes"
            className="mt-1 w-full rounded-xl border border-cream-border bg-white px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={
            state.kind === 'submitting' || !email || !role || !updates.trim()
          }
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2 text-sm font-black text-cream hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50"
        >
          {state.kind === 'submitting' ? t('submitting') : t('submit')}
        </button>

        {state.kind === 'error' ? (
          <p
            role="alert"
            data-testid="submission-error"
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700"
          >
            {state.message}
          </p>
        ) : null}
      </form>
    </section>
  );
}
