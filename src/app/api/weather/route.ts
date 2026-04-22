import { NextResponse } from 'next/server';
import { weatherForDate } from '@/lib/weather';

// DECISION: Miami coords hardcoded for Phase A (Miami-only launch). When we
// expand beyond Miami, lift this to a per-city config keyed by school/closure.
const MIAMI = { lat: 25.7617, lon: -80.1918 };
// Open-Meteo free forecast horizon is 16 days; past that, fall back to averages.
const MAX_FORECAST_DAYS = 16;

export const revalidate = 3600; // cache 1h

export async function GET(req: Request) {
  const url = new URL(req.url);
  const date = url.searchParams.get('date');
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'invalid_date' }, { status: 400 });
  }

  const today = new Date(new Date().toISOString().slice(0, 10));
  const target = new Date(date);
  const deltaDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (deltaDays >= 0 && deltaDays <= MAX_FORECAST_DAYS) {
    try {
      const endpoint = new URL('https://api.open-meteo.com/v1/forecast');
      endpoint.searchParams.set('latitude', String(MIAMI.lat));
      endpoint.searchParams.set('longitude', String(MIAMI.lon));
      endpoint.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,weather_code');
      endpoint.searchParams.set('temperature_unit', 'fahrenheit');
      endpoint.searchParams.set('timezone', 'America/New_York');
      endpoint.searchParams.set('start_date', date);
      endpoint.searchParams.set('end_date', date);
      const res = await fetch(endpoint.toString(), { next: { revalidate: 3600 } });
      if (res.ok) {
        const data = await res.json();
        const highF = Math.round(data?.daily?.temperature_2m_max?.[0]);
        const lowF  = Math.round(data?.daily?.temperature_2m_min?.[0]);
        const code  = data?.daily?.weather_code?.[0];
        if (Number.isFinite(highF) && Number.isFinite(lowF)) {
          return NextResponse.json({ highF, lowF, code, source: 'forecast' });
        }
      }
    } catch {
      // DECISION: Any network/API failure falls through to monthly averages so
      // the card always renders something sensible instead of an error state.
    }
  }

  const avg = weatherForDate(date);
  return NextResponse.json({ highF: avg.highF, lowF: avg.lowF, icon: avg.icon, label: avg.label, source: 'monthly_average' });
}
