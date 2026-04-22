'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { createBrowserSupabase } from '@/lib/supabase/browser';
import { KidsManagementSection } from './KidsManagementSection';
import { blankKid, gradeToAge, type KidState, type School } from './KidForm';

// DECISION: Mirrors the onboarding form but lives post-onboarding. Kid name
// and grade are still client-only (localStorage under so-kids) while the
// server-bound {school_id, age_range, ordinal} triple is POSTed to
// /api/kid-profiles — which already does a replace-all. Sign-out uses the
// browser supabase client so Supabase clears both cookies and local session.

type ProfileRow = {
  id: string;
  school_id: string;
  age_range: '4-6' | '7-9' | '10-12' | '13+';
  ordinal: number;
};

const KIDS_LS_KEY = 'so-kids';

type LocalKid = { name: string; grade: string };

function loadLocalKids(): LocalKid[] {
  try {
    const raw = localStorage.getItem(KIDS_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((k) => {
        if (!k || typeof k !== 'object') return null;
        const obj = k as Partial<LocalKid>;
        return {
          name: typeof obj.name === 'string' ? obj.name : '',
          grade: typeof obj.grade === 'string' ? obj.grade : '',
        };
      })
      .filter((k): k is LocalKid => k !== null);
  } catch {
    return [];
  }
}

function saveLocalKids(kids: KidState[]) {
  try {
    const strip = kids.map((k) => ({ name: k.name, grade: k.grade }));
    localStorage.setItem(KIDS_LS_KEY, JSON.stringify(strip));
  } catch {
    /* ignore */
  }
}

export function SettingsClient({
  locale,
  displayName,
  schools,
  profiles,
}: {
  locale: string;
  displayName: string | null;
  schools: School[];
  profiles: ProfileRow[];
}) {
  const t = useTranslations('app.settings');
  const router = useRouter();

  const suggestedIds = useMemo(
    () => [
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      '00000000-0000-0000-0000-000000000003',
    ],
    [],
  );

  // Name card
  const [name, setName] = useState(displayName ?? '');
  const [nameStatus, setNameStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );

  // Kids card — server gives us school_id + age_range; localStorage gives us
  // the client-only name + grade. We merge on mount.
  const initialKids: KidState[] = useMemo(() => {
    if (profiles.length === 0) return [blankKid()];
    return profiles.map((p) => ({
      name: '',
      grade: '',
      school_id: p.school_id,
      school_other: !suggestedIds.includes(p.school_id),
    }));
  }, [profiles, suggestedIds]);

  const [kids, setKids] = useState<KidState[]>(initialKids);
  const [kidCount, setKidCount] = useState(Math.max(1, profiles.length));
  const [kidsStatus, setKidsStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error'
  >('idle');

  // Hydrate kid names/grades from localStorage on mount.
  useEffect(() => {
    const local = loadLocalKids();
    if (local.length === 0) return;
    setKids((prev) =>
      prev.map((k, i) => ({
        ...k,
        name: local[i]?.name ?? '',
        grade: local[i]?.grade ?? '',
      })),
    );
  }, []);

  const updateKid = (idx: number, patch: Partial<KidState>) => {
    setKids((prev) => {
      const out = [...prev];
      out[idx] = { ...out[idx]!, ...patch };
      return out;
    });
  };

  const addKid = () => {
    setKidCount((c) => Math.min(5, c + 1));
    setKids((prev) => (prev.length < 5 ? [...prev, blankKid()] : prev));
  };

  const deleteKid = (idx: number) => {
    const n = idx + 1;
    // DECISION: using window.confirm for simplicity — MVP scope. A nicer
    // modal can replace this after Phase 1. Maps message placeholder {n}.
    const ok = window.confirm(
      t('sections.kids.confirmDelete', { n }),
    );
    if (!ok) return;
    setKids((prev) => prev.filter((_, i) => i !== idx));
    setKidCount((c) => Math.max(1, c - 1));
  };

  const saveName = async () => {
    if (!name.trim() || nameStatus === 'saving') return;
    setNameStatus('saving');
    try {
      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ display_name: name.trim() }),
      });
      setNameStatus(res.ok ? 'saved' : 'error');
      if (res.ok) {
        // Fade the "saved" hint after a moment.
        window.setTimeout(() => setNameStatus('idle'), 2000);
        router.refresh();
      }
    } catch {
      setNameStatus('error');
    }
  };

  const saveKids = async () => {
    if (kidsStatus === 'saving') return;
    const visible = kids.slice(0, kidCount);
    if (visible.some((k) => !k.school_id)) {
      setKidsStatus('error');
      return;
    }
    setKidsStatus('saving');
    try {
      saveLocalKids(visible);
      const payload = visible.map((k, i) => ({
        school_id: k.school_id!,
        age_range: gradeToAge(k.grade),
        ordinal: i + 1,
      }));
      const res = await fetch('/api/kid-profiles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ profiles: payload }),
      });
      if (!res.ok) {
        setKidsStatus('error');
        return;
      }
      setKidsStatus('saved');
      window.setTimeout(() => setKidsStatus('idle'), 2000);
      router.refresh();
    } catch {
      setKidsStatus('error');
    }
  };

  const signOut = async () => {
    try {
      const sb = createBrowserSupabase();
      await sb.auth.signOut();
    } finally {
      router.push(`/${locale}`);
      router.refresh();
    }
  };

  const derivedSchools = useMemo(() => {
    const seen = new Map<string, string>();
    for (const k of kids.slice(0, kidCount)) {
      if (!k.school_id) continue;
      const s = schools.find((x) => x.id === k.school_id);
      if (s) seen.set(s.id, s.name);
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [kids, kidCount, schools]);

  const otherLocale = locale === 'en' ? 'es' : 'en';

  return (
    <div className="space-y-6">
      {/* Name section */}
      <section
        className="rounded-3xl border border-cream-border bg-white p-5"
        aria-labelledby="settings-name-title"
      >
        <h2
          id="settings-name-title"
          className="text-xs font-black uppercase tracking-wider text-muted"
        >
          {t('sections.name.title')}
        </h2>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm text-ink focus:border-brand-purple focus:outline-none"
          />
          <button
            type="button"
            onClick={saveName}
            disabled={!name.trim() || nameStatus === 'saving'}
            className="rounded-full bg-ink px-4 py-2 text-xs font-black text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {nameStatus === 'saving'
              ? t('sections.name.saving')
              : nameStatus === 'saved'
                ? t('sections.name.saved')
                : t('sections.name.save')}
          </button>
        </div>
        {nameStatus === 'error' ? (
          <p role="alert" className="mt-2 text-xs font-bold text-red-600">
            {t('sections.name.error')}
          </p>
        ) : null}
      </section>

      {/* Kids section */}
      <section
        className="rounded-3xl border border-cream-border bg-white p-5"
        aria-labelledby="settings-kids-title"
      >
        <h2
          id="settings-kids-title"
          className="mb-4 text-xs font-black uppercase tracking-wider text-muted"
        >
          {t('sections.kids.title')}
        </h2>
        <KidsManagementSection
          kids={kids}
          kidCount={kidCount}
          onCountChange={(n) => {
            setKidCount(n);
            setKids((prev) => {
              if (n > prev.length) {
                const out = prev.slice();
                while (out.length < n) out.push(blankKid());
                return out;
              }
              return prev;
            });
          }}
          onKidChange={updateKid}
          onAddKid={addKid}
          onDeleteKid={deleteKid}
          schools={schools}
          suggestedIds={suggestedIds}
          showCountPills={false}
          privacyNamespace="app.settings.privacy"
        />
        <div className="mt-5 flex items-center justify-end gap-3">
          {kidsStatus === 'error' ? (
            <p role="alert" className="text-xs font-bold text-red-600">
              {t('sections.kids.error')}
            </p>
          ) : null}
          <button
            type="button"
            onClick={saveKids}
            disabled={kidsStatus === 'saving'}
            className="rounded-full bg-ink px-5 py-2.5 text-xs font-black text-cream transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {kidsStatus === 'saving'
              ? t('sections.kids.saving')
              : kidsStatus === 'saved'
                ? t('sections.kids.saved')
                : t('sections.kids.saveAll')}
          </button>
        </div>
      </section>

      {/* Language section */}
      <section
        className="rounded-3xl border border-cream-border bg-white p-5"
        aria-labelledby="settings-lang-title"
      >
        <h2
          id="settings-lang-title"
          className="text-xs font-black uppercase tracking-wider text-muted"
        >
          {t('sections.language.title')}
        </h2>
        <p className="mt-1 text-sm text-muted">{t('sections.language.body')}</p>
        <div className="mt-3 flex gap-2">
          {(['en', 'es'] as const).map((loc) => {
            const active = loc === locale;
            return (
              <Link
                key={loc}
                href={`/${loc}/app/settings`}
                aria-current={active ? 'page' : undefined}
                className={
                  'rounded-full px-4 py-1.5 text-xs font-bold transition-colors ' +
                  (active
                    ? 'bg-brand-purple text-white'
                    : 'border border-cream-border bg-white text-ink hover:border-brand-purple/40')
                }
              >
                {t(`sections.language.${loc}` as const)}
              </Link>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted">
          <Link
            href={`/${otherLocale}/app/settings`}
            className="font-bold text-brand-purple hover:underline"
          >
            {otherLocale.toUpperCase()} →
          </Link>
        </p>
      </section>

      {/* Schools section (read-only) */}
      <section
        className="rounded-3xl border border-cream-border bg-white p-5"
        aria-labelledby="settings-schools-title"
      >
        <h2
          id="settings-schools-title"
          className="text-xs font-black uppercase tracking-wider text-muted"
        >
          {t('sections.schools.title')}
        </h2>
        <p className="mt-1 text-sm text-muted">{t('sections.schools.body')}</p>
        {derivedSchools.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t('sections.schools.empty')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {derivedSchools.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-2xl border border-cream-border bg-cream px-3 py-2"
              >
                <span className="text-sm font-bold text-ink">{s.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Sign out */}
      <section
        className="rounded-3xl border border-cream-border bg-white p-5"
        aria-labelledby="settings-signout-title"
      >
        <h2
          id="settings-signout-title"
          className="text-xs font-black uppercase tracking-wider text-muted"
        >
          {t('sections.signOut.title')}
        </h2>
        <p className="mt-1 text-sm text-muted">{t('sections.signOut.body')}</p>
        <button
          type="button"
          onClick={signOut}
          className="mt-3 rounded-full border border-cream-border bg-white px-5 py-2 text-sm font-black text-ink hover:border-red-500/40 hover:text-red-600"
        >
          {t('sections.signOut.button')}
        </button>
      </section>
    </div>
  );
}
