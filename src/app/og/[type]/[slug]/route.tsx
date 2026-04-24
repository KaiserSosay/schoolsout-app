import { ImageResponse } from 'next/og';
import { createServiceSupabase } from '@/lib/supabase/service';

// Phase 2.7 Goal 4: dynamic OG image route. One endpoint generates
// Open Graph images for camps, closures, and schools by type.
//
//   /og/camp/{slug}         → image for a camp detail page
//   /og/school/{slug}       → image for a school detail page
//   /og/break/{id}          → image for a closure detail page
//
// Falls back to the static /opengraph-image.tsx asset if the looked-up
// row isn't found; callers (generateMetadata) can choose to point at
// the dynamic URL and accept the fallback silently.

export const runtime = 'edge';

const WIDTH = 1200;
const HEIGHT = 630;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ type: string; slug: string }> },
) {
  const { type, slug } = await ctx.params;
  const svc = createServiceSupabase();

  let title = "School's Out!";
  let subtitle = 'Miami summer camps + school-closure calendars';
  let badge: string | null = null;

  if (type === 'camp') {
    const { data } = await svc
      .from('camps')
      .select('name, neighborhood, ages_min, ages_max, verified')
      .eq('slug', slug)
      .maybeSingle();
    const row = data as {
      name: string;
      neighborhood: string | null;
      ages_min: number | null;
      ages_max: number | null;
      verified: boolean;
    } | null;
    if (row) {
      title = row.name;
      const parts: string[] = [];
      if (row.neighborhood) parts.push(row.neighborhood);
      if (row.ages_min != null && row.ages_max != null) {
        parts.push(`Ages ${row.ages_min}–${row.ages_max}`);
      }
      subtitle = parts.join(' · ') || 'Miami-area camp';
      badge = row.verified ? '✓ Verified' : null;
    }
  } else if (type === 'school') {
    const { data } = await svc
      .from('schools')
      .select('name, city')
      .eq('slug', slug)
      .maybeSingle();
    const row = data as { name: string; city: string } | null;
    if (row) {
      title = row.name;
      subtitle = row.city ? `${row.city} · school calendar` : 'School calendar';
    }
  } else if (type === 'break') {
    const { data } = await svc
      .from('closures')
      .select('name, start_date, end_date')
      .eq('id', slug)
      .maybeSingle();
    const row = data as {
      name: string;
      start_date: string;
      end_date: string;
    } | null;
    if (row) {
      title = row.name;
      const d = new Date(row.start_date + 'T00:00:00').toLocaleDateString(
        'en-US',
        { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
      );
      subtitle = `Miami schools closed · ${d}`;
      badge = 'Break';
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px',
          fontFamily: 'system-ui, sans-serif',
          background:
            'linear-gradient(135deg, #6D28D9 0%, #7C3AED 50%, #2563EB 100%)',
          color: '#FFFFFF',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 32, fontWeight: 900 }}>School&rsquo;s Out!</div>
          {badge ? (
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                background: 'rgba(255,255,255,0.15)',
                padding: '4px 12px',
                borderRadius: 999,
              }}
            >
              {badge}
            </div>
          ) : null}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 32, opacity: 0.85, fontWeight: 600 }}>
            {subtitle}
          </div>
        </div>
        <div style={{ fontSize: 20, opacity: 0.7 }}>
          schoolsout.net
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT },
  );
}
