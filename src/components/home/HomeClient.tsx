'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { LanguageToggle } from '@/components/LanguageToggle';
import type { Locale } from '@/i18n/config';
import type { Closure } from '@/lib/closures';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { AgeFilter, type AgeRange } from './AgeFilter';
import { ClosuresGrid } from './ClosuresGrid';
import { RestOfYearAccordion } from './RestOfYearAccordion';
import { CampsPreview } from './CampsPreview';
import { OperatorCTA } from './OperatorCTA';
import { CoParentShare } from './CoParentShare';
import { Footer } from './Footer';
import { ModeToggle, type Mode } from './ModeToggle';

const MODE_KEY = 'mode';
const AGE_KEY = 'ageRange';

// DECISION: Mode defaults to "kids" on server render and first client paint.
// localStorage is read in useEffect so there's no hydration mismatch — the
// initial HTML always matches kids mode, then the client may swap to parents.

export function HomeClient({
  closures,
  schoolId,
  locale,
}: {
  closures: Closure[];
  schoolId: string;
  locale: string;
}) {
  const [mode, setMode] = useState<Mode>('kids');
  const [ageRange, setAgeRange] = useState<AgeRange>('all');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const m = localStorage.getItem(MODE_KEY);
      if (m === 'kids' || m === 'parents') setMode(m);
      const a = localStorage.getItem(AGE_KEY);
      if (a === 'all' || a === '4-6' || a === '7-9') setAgeRange(a);
    } catch {
      // localStorage can throw in sandboxed iframes / private mode — ignore.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(MODE_KEY, mode);
    } catch {
      /* noop */
    }
  }, [mode, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(AGE_KEY, ageRange);
    } catch {
      /* noop */
    }
  }, [ageRange, hydrated]);

  const next3 = useMemo(() => closures.slice(0, 3), [closures]);
  const rest = useMemo(() => closures.slice(3), [closures]);
  const nextClosure = closures[0] ?? null;

  const rootBg =
    mode === 'kids'
      ? 'bg-gradient-to-br from-purple-deep via-purple-mid to-blue-deep text-white'
      : 'bg-gradient-to-br from-slate-100 via-white to-slate-50 text-slate-900';

  return (
    <div className={'min-h-screen transition-colors ' + rootBg} data-mode={mode}>
      <header className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4 gap-3">
        <Link
          href={`/${locale}`}
          className={
            'text-lg font-bold ' +
            (mode === 'kids' ? 'text-white' : 'text-slate-900')
          }
        >
          School&apos;s Out! 🎒
        </Link>
        <div className="flex items-center gap-2">
          <ModeToggle mode={mode} onChange={setMode} />
          <LanguageToggle currentLocale={locale as Locale} />
        </div>
      </header>

      <main className="max-w-md md:max-w-4xl lg:max-w-6xl mx-auto px-4 pb-10">
        <Hero
          mode={mode}
          schoolId={schoolId}
          locale={locale}
          nextClosure={nextClosure}
        />
        <HowItWorks mode={mode} />
        <section className="mt-10">
          <AgeFilter value={ageRange} onChange={setAgeRange} mode={mode} />
        </section>
        <ClosuresGrid closures={next3} mode={mode} locale={locale} />
        <RestOfYearAccordion closures={rest} mode={mode} locale={locale} />
        <CampsPreview mode={mode} />
        <OperatorCTA mode={mode} />
        <CoParentShare mode={mode} />
        <Footer mode={mode} locale={locale} />
      </main>
    </div>
  );
}
