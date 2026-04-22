import { NextResponse } from 'next/server';
import { z } from 'zod';

// DECISION: Using Nominatim (OSM, free, no key) through a server-side proxy
// because their ToS require a descriptive User-Agent. If we outgrow ~1 req/sec
// we swap to Mapbox via GEOCODING_API_KEY — client code won't change. The
// `next: { revalidate: 86400 }` hint caches identical queries for 24h.

const schema = z.object({
  q: z.string().min(3).max(200),
  countrycodes: z.string().default('us'),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = schema.safeParse({
    q: url.searchParams.get('q'),
    countrycodes: url.searchParams.get('countrycodes') ?? 'us',
  });
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_query' }, { status: 400 });
  }

  const endpoint = new URL('https://nominatim.openstreetmap.org/search');
  endpoint.searchParams.set('q', parsed.data.q);
  endpoint.searchParams.set('countrycodes', parsed.data.countrycodes);
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('limit', '5');
  endpoint.searchParams.set('addressdetails', '1');

  const res = await fetch(endpoint.toString(), {
    headers: { 'User-Agent': 'SchoolsOut/1.0 (https://schoolsout.net)' },
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'upstream_error' }, { status: 502 });
  }
  const raw = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;
  return NextResponse.json({
    results: raw.map((r) => ({
      display_name: r.display_name,
      latitude: Number(r.lat),
      longitude: Number(r.lon),
    })),
  });
}
