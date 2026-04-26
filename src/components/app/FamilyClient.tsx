'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from '@/components/app/ModeProvider';
import { statusBadge, type SchoolStatus } from '@/lib/school-status';
import { daysUntil } from '@/lib/countdown';
import { displayKidAge } from '@/lib/kids/age';
import { BirthDateSoftPrompt } from './BirthDateSoftPrompt';

export type FamilyKid = {
  id: string;
  ordinal: number;
  age_range: '4-6' | '7-9' | '10-12' | '13+';
  school_id: string;
  school_name: string;
  school_district: string;
  calendar_status: SchoolStatus;
  // Optional — populated when the parent has filled in the hybrid
  // model (migration 038). The soft-prompt banner asks for it when
  // null. Both columns come from kid_profiles.
  birth_month?: number | null;
  birth_year?: number | null;
};

export type FamilyClosure = {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  emoji: string;
};

type LocalKid = {
  ordinal: number;
  name?: string;
  grade?: string;
};

export function FamilyClient({
  locale,
  kids,
  closures,
}: {
  locale: string;
  kids: FamilyKid[];
  closures: FamilyClosure[];
}) {
  const { mode } = useMode();
  const isKids = mode === 'kids';
  const t = useTranslations();

  // Kid names + grades live in localStorage only per COPPA design.
  const [localKids, setLocalKids] = useState<LocalKid[]>([]);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('so-kids');
      if (raw) {
        const parsed = JSON.parse(raw) as LocalKid[];
        if (Array.isArray(parsed)) setLocalKids(parsed);
      }
    } catch {
      // ignore malformed localStorage
    }
  }, []);

  const pageClass = isKids
    ? 'min-h-screen text-white'
    : 'min-h-screen text-ink';
  const cardClass = isKids
    ? 'rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-5 transition-all hover:-translate-y-0.5'
    : 'rounded-2xl bg-white border border-cream-border p-5 transition-all hover:-translate-y-0.5';
  const listBg = isKids ? 'bg-white/5' : 'bg-cream';

  if (kids.length === 0) {
    return (
      <main className={pageClass + ' px-4 py-10'}>
        <div className="mx-auto max-w-2xl space-y-4">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold tracking-tight">{t('app.family.title')}</h1>
            <Link
              href={`/${locale}/app/settings`}
              className={isKids ? 'text-white/70 hover:text-white' : 'text-muted hover:text-ink'}
              aria-label={t('app.family.editFamily')}
            >
              ⚙️
            </Link>
          </header>
          <p className={isKids ? 'text-white/80' : 'text-muted'}>{t('app.family.subtitle')}</p>
          <div className={cardClass}>
            <p className="font-semibold mb-3">{t('app.family.emptyTitle')}</p>
            <p className={'text-sm mb-4 ' + (isKids ? 'text-white/70' : 'text-muted')}>
              {t('app.family.emptyBody')}
            </p>
            <Link
              href={`/${locale}/app/settings`}
              className={
                'inline-flex items-center rounded-full px-5 py-2.5 text-sm font-bold min-h-11 transition ' +
                (isKids
                  ? 'bg-cta-yellow text-purple-deep'
                  : 'bg-ink text-white')
              }
            >
              {t('app.family.addKid')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={pageClass + ' px-4 py-8'}>
      <div className="mx-auto max-w-2xl space-y-5">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold tracking-tight">{t('app.family.title')}</h1>
          <Link
            href={`/${locale}/app/settings`}
            aria-label={t('app.family.editFamily')}
            className={
              'inline-flex h-11 w-11 items-center justify-center rounded-full text-lg transition ' +
              (isKids ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white border border-cream-border hover:border-ink text-ink')
            }
          >
            ⚙️
          </Link>
        </header>

        <p className={isKids ? 'text-white/80' : 'text-muted'}>{t('app.family.subtitle')}</p>

        <BirthDateSoftPrompt
          kids={kids.map((k) => ({
            id: k.id,
            ordinal: k.ordinal,
            birth_month: k.birth_month,
            birth_year: k.birth_year,
          }))}
          nameByOrdinal={Object.fromEntries(
            localKids
              .filter((lk) => lk.name)
              .map((lk) => [lk.ordinal, lk.name as string]),
          )}
        />

        <ul className="space-y-4">
          {kids.map((kid, idx) => {
            const localMatch = localKids.find((lk) => lk.ordinal === kid.ordinal) ?? localKids[idx];
            const displayName = localMatch?.name ?? t('app.family.kidNumber', { n: kid.ordinal });
            const grade = localMatch?.grade ?? null;
            const status = statusBadge(kid.calendar_status);
            const kidClosures = closures
              .filter((c) => c.school_id === kid.school_id)
              .slice(0, 5);

            return (
              <li key={kid.id} className={cardClass}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider font-bold text-brand-purple mb-1">
                      {t('app.family.kidLabel', { n: kid.ordinal })}
                    </p>
                    <h2 className="text-xl font-extrabold truncate">{displayName}</h2>
                    <div className={'mt-1 flex flex-wrap gap-2 text-xs ' + (isKids ? 'text-white/80' : 'text-muted')}>
                      {(() => {
                        // Prefer the computed age from birth_month + birth_year
                        // (migration 038); fall back to the grade-derived
                        // age_range bucket when the parent hasn't filled in
                        // a birth date yet.
                        const computed = displayKidAge({
                          birth_month: kid.birth_month ?? null,
                          birth_year: kid.birth_year ?? null,
                          grade: grade ?? '',
                        });
                        if (computed) {
                          return (
                            <span className={'rounded-full px-2 py-0.5 ' + (isKids ? 'bg-white/10' : 'bg-purple-soft text-brand-purple font-semibold')}>
                              {computed}
                            </span>
                          );
                        }
                        return (
                          <span className={'rounded-full px-2 py-0.5 ' + (isKids ? 'bg-white/10' : 'bg-purple-soft text-brand-purple font-semibold')}>
                            {t(`app.family.ageRange.${kid.age_range}`)}
                          </span>
                        );
                      })()}
                      {grade && (
                        <span className={'rounded-full px-2 py-0.5 ' + (isKids ? 'bg-white/10' : 'bg-cream border border-cream-border')}>
                          {t('app.family.gradeLabel', { grade })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/${locale}/app/settings`}
                    className={'text-xs font-semibold underline ' + (isKids ? 'text-white/70 hover:text-white' : 'text-brand-purple hover:text-ink')}
                  >
                    {t('app.family.edit')}
                  </Link>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className={'text-sm font-semibold ' + (isKids ? 'text-white' : 'text-ink')}>
                    {kid.school_name}
                  </span>
                  <span
                    className={
                      'text-xs rounded-full px-2 py-0.5 ' +
                      (status.intent === 'positive'
                        ? (isKids ? 'bg-emerald-400/20 text-emerald-200' : 'bg-success/15 text-success')
                        : status.intent === 'pending'
                          ? (isKids ? 'bg-cta-yellow/20 text-cta-yellow' : 'bg-gold/30 text-ink')
                          : status.intent === 'error'
                            ? 'bg-red-500/20 text-red-300'
                            : (isKids ? 'bg-white/10 text-white/80' : 'bg-cream border border-cream-border text-muted'))
                    }
                  >
                    {status.emoji} {t(`app.calendar.status.${calendarStatusKey(kid.calendar_status)}`)}
                  </span>
                </div>

                {kidClosures.length > 0 ? (
                  <ul className={'mt-4 rounded-xl p-3 space-y-1.5 ' + listBg}>
                    <li className="text-xs font-bold uppercase tracking-wider mb-1 text-brand-purple">
                      {t('app.family.upcomingClosures')}
                    </li>
                    {kidClosures.map((c) => {
                      const d = daysUntil(c.start_date);
                      return (
                        <li key={c.id}>
                          <Link
                            href={`/${locale}/app/closures/${c.id}`}
                            className={
                              'flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm transition ' +
                              (isKids ? 'hover:bg-white/10' : 'hover:bg-white')
                            }
                          >
                            <span className="flex items-center gap-2 min-w-0 truncate">
                              <span aria-hidden="true">{c.emoji}</span>
                              <span className="truncate">{c.name}</span>
                            </span>
                            <span className={'shrink-0 text-xs ' + (isKids ? 'text-white/70' : 'text-muted')}>
                              {t('app.family.inDays', { count: Math.max(0, d) })}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={'mt-4 text-sm italic ' + (isKids ? 'text-white/60' : 'text-muted')}>
                    {t('app.family.noUpcomingClosures')}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <Link
          href={`/${locale}/app/settings`}
          className={
            'block w-full text-center rounded-full px-5 py-3 text-sm font-bold min-h-11 transition ' +
            (isKids
              ? 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              : 'bg-white border border-cream-border hover:border-ink text-ink')
          }
        >
          {t('app.family.addAnotherKid')}
        </Link>
      </div>
    </main>
  );
}

function calendarStatusKey(status: SchoolStatus): string {
  switch (status) {
    case 'verified_multi_year': return 'verifiedMultiYear';
    case 'verified_current': return 'verifiedCurrent';
    case 'ai_draft': return 'aiDraft';
    case 'needs_research': return 'needsResearch';
    case 'unavailable': return 'unavailable';
  }
}
