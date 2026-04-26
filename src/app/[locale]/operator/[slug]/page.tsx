import { notFound } from 'next/navigation';
import { checkOperatorAccess } from '@/lib/operator/auth';
import { createServiceSupabase } from '@/lib/supabase/service';
import type { OperatorLocale } from '@/lib/operator/copy';
import { OperatorDashboard } from '@/components/operator/OperatorDashboard';
import type { OperatorCamp } from '@/components/operator/OperatorDashboard';

export const dynamic = 'force-dynamic';

const VALID_LOCALES = ['en', 'es'] as const;

type PageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export default async function OperatorDashboardPage({ params }: PageProps) {
  const { locale: rawLocale, slug } = await params;
  const locale: OperatorLocale = (VALID_LOCALES as readonly string[]).includes(
    rawLocale,
  )
    ? (rawLocale as OperatorLocale)
    : 'en';

  // Auth + ownership gate. All failure modes collapse to notFound() so an
  // attacker scanning slugs never gets a different status code for "exists
  // but you can't see it" vs "doesn't exist".
  const access = await checkOperatorAccess(slug);
  if (!access.ok) notFound();

  // Fetch the camp row + future closures for the coverage section.
  const db = createServiceSupabase();
  const { data: camp } = await db
    .from('camps')
    .select(
      [
        'id',
        'slug',
        'name',
        'description',
        'categories',
        'ages_min',
        'ages_max',
        'phone',
        'email',
        'website_url',
        'registration_url',
        'registration_deadline',
        'price_tier',
        'price_min_cents',
        'price_max_cents',
        'price_notes',
        'hours_start',
        'hours_end',
        'before_care_offered',
        'before_care_start',
        'before_care_price_cents',
        'after_care_offered',
        'after_care_end',
        'after_care_price_cents',
        'lunch_included',
        'special_needs_friendly',
        'scholarships_available',
        'scholarships_notes',
        'accommodations',
        'photo_urls',
        'data_completeness',
        'closed_on_holidays',
      ].join(', '),
    )
    .eq('id', access.campId)
    .maybeSingle();
  if (!camp) notFound();

  // Phase 3.1.4: closure-coverage checklist data. Fetch the next 12 months
  // of verified closures for any school + the operator's existing coverage
  // saves so the form can pre-render their state.
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date();
  horizon.setMonth(horizon.getMonth() + 12);
  const horizonIso = horizon.toISOString().slice(0, 10);

  const [{ data: closures }, { data: coverageRows }] = await Promise.all([
    db
      .from('closures')
      .select(
        'id, school_id, name, start_date, end_date, category, schools:school_id (name, slug)',
      )
      .gte('start_date', today)
      .lte('start_date', horizonIso)
      .eq('status', 'verified')
      .order('start_date', { ascending: true })
      .limit(150),
    db
      .from('camp_closure_coverage')
      .select('closure_id, is_open, notes')
      .eq('camp_id', access.campId),
  ]);

  return (
    <OperatorDashboard
      locale={locale}
      camp={camp as unknown as OperatorCamp}
      campSlug={slug}
      operatorEmail={access.user.email}
      closures={
        (closures ?? []).map((row) => ({
          id: row.id as string,
          name: row.name as string,
          start_date: row.start_date as string,
          end_date: row.end_date as string,
          category: (row.category as string | null) ?? null,
          school_name:
            (row.schools as unknown as { name?: string } | null)?.name ?? null,
        }))
      }
      coverage={
        (coverageRows ?? []).map((row) => ({
          closure_id: row.closure_id as string,
          is_open: row.is_open as boolean,
          notes: (row.notes as string | null) ?? null,
        }))
      }
    />
  );
}

