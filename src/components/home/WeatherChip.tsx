'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useMode } from './ModeContext';

type WeatherResponse =
  | { highF: number; lowF: number; code?: number; source: 'forecast' }
  | {
      highF: number;
      lowF: number;
      icon?: string;
      label?: { en: string; es: string };
      source: 'monthly_average';
    };

// Map Open-Meteo weather codes to a friendly emoji.
// https://open-meteo.com/en/docs — "WMO Weather interpretation codes"
function emojiForCode(code: number | undefined): string {
  if (code == null) return '☀️';
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '🌨️';
  if (code >= 80 && code <= 82) return '🌦️';
  if (code >= 85 && code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

export function WeatherChip({ date, locale }: { date: string; locale: string }) {
  const t = useTranslations('landing.nextDaysOff');
  const { mode } = useMode();
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/weather?date=${encodeURIComponent(date)}`);
        if (!res.ok) throw new Error('weather_fetch_failed');
        const json = (await res.json()) as WeatherResponse;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const chipBase =
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold';
  const chipCream =
    mode === 'parents'
      ? 'bg-cream border border-cream-border text-ink'
      : 'bg-white/15 border border-white/15 text-white/90';

  if (loading) {
    return (
      <span
        className={
          chipBase +
          ' ' +
          (mode === 'parents'
            ? 'bg-cream border border-cream-border text-muted animate-pulse'
            : 'bg-white/10 border border-white/10 text-white/50 animate-pulse')
        }
        aria-busy="true"
      >
        {t('loadingWeather')}
      </span>
    );
  }

  if (!data) {
    // Quietly hide on error — Phase 0 honesty rule, no fake fallback
    return null;
  }

  if (data.source === 'forecast') {
    const icon = emojiForCode(data.code);
    return (
      <span className={chipBase + ' ' + chipCream}>
        <span aria-hidden="true">{icon}</span>
        <span>
          {data.highF}° / {data.lowF}°
        </span>
      </span>
    );
  }

  const label = locale === 'es' ? data.label?.es : data.label?.en;
  const icon = data.icon ?? '🌤️';
  const text = label
    ? t('weatherLabel.average', { label })
    : `${data.highF}° / ${data.lowF}°`;
  return (
    <span className={chipBase + ' ' + chipCream}>
      <span aria-hidden="true">{icon}</span>
      <span>
        {data.highF}° · {text}
      </span>
    </span>
  );
}
