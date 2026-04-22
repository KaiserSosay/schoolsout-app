'use client';

import type { Closure } from '@/lib/closures';
import { ModeProvider, useMode } from './ModeContext';
import { Header } from './Header';
import { Hero } from './Hero';
import { DashboardPreview } from './DashboardPreview';
import { Problems } from './Problems';
import { HowItWorks } from './HowItWorks';
import { TwoDoors } from './TwoDoors';
import { Features } from './Features';
import { ClosuresGrid } from './ClosuresGrid';
import { RestOfYearAccordion } from './RestOfYearAccordion';
import { Coverage } from './Coverage';
import { ForCampOwners } from './ForCampOwners';
import { FAQ } from './FAQ';
import { FinalCTA } from './FinalCTA';
import { Footer } from './Footer';

export function HomeClient({
  closures,
  schoolId,
  locale,
}: {
  closures: Closure[];
  schoolId: string;
  locale: string;
}) {
  return (
    <ModeProvider>
      <ModeRoot>
        <Header locale={locale} />
        <main className="flex-1">
          <Hero schoolId={schoolId} locale={locale} />
          <DashboardPreview closures={closures} locale={locale} />
          <Problems />
          <HowItWorks />
          <TwoDoors />
          <Features />
          <ClosuresGrid closures={closures.slice(0, 3)} locale={locale} />
          <RestOfYearAccordion closures={closures.slice(3)} locale={locale} />
          <Coverage />
          <ForCampOwners />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer locale={locale} />
      </ModeRoot>
    </ModeProvider>
  );
}

function ModeRoot({ children }: { children: React.ReactNode }) {
  const { mode } = useMode();
  const className =
    mode === 'parents'
      ? 'min-h-screen flex flex-col bg-cream text-ink'
      : 'min-h-screen flex flex-col bg-gradient-to-br from-purple-deep via-purple-mid to-blue-deep text-white';
  return (
    <div data-mode={mode} className={className} suppressHydrationWarning>
      {children}
    </div>
  );
}
