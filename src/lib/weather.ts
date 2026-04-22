// DECISION: Open-Meteo (or any live weather API) is Phase 2. For Phase 0
// we use a static lookup of Miami monthly averages — zero network, zero cost,
// good enough for the "what will the weather be" curiosity on a closure card.
//
// Source: NOAA/NWS climate normals for Miami, FL (1991–2020), rounded to
// typical daily high/low. These are averages; specific days will vary.

export type WeatherEntry = {
  highF: number;
  lowF: number;
  icon: string;
  label: { en: string; es: string };
};

export const miamiMonthlyAverage: Record<number, WeatherEntry> = {
  1: { highF: 76, lowF: 62, icon: '🌤️', label: { en: 'Mild', es: 'Agradable' } },
  2: { highF: 78, lowF: 63, icon: '🌤️', label: { en: 'Mild', es: 'Agradable' } },
  3: { highF: 81, lowF: 67, icon: '☀️', label: { en: 'Warm', es: 'Cálido' } },
  4: { highF: 84, lowF: 70, icon: '☀️', label: { en: 'Warm', es: 'Cálido' } },
  5: { highF: 87, lowF: 74, icon: '☀️', label: { en: 'Hot', es: 'Caluroso' } },
  6: { highF: 89, lowF: 77, icon: '⛈️', label: { en: 'Hot & rainy', es: 'Caluroso y lluvioso' } },
  7: { highF: 91, lowF: 78, icon: '⛈️', label: { en: 'Hot & rainy', es: 'Caluroso y lluvioso' } },
  8: { highF: 91, lowF: 78, icon: '⛈️', label: { en: 'Hot & rainy', es: 'Caluroso y lluvioso' } },
  9: { highF: 89, lowF: 77, icon: '⛈️', label: { en: 'Hot & rainy', es: 'Caluroso y lluvioso' } },
  10: { highF: 85, lowF: 74, icon: '🌤️', label: { en: 'Warm', es: 'Cálido' } },
  11: { highF: 81, lowF: 69, icon: '🌤️', label: { en: 'Mild', es: 'Agradable' } },
  12: { highF: 77, lowF: 64, icon: '🌤️', label: { en: 'Mild', es: 'Agradable' } },
};

export function weatherForDate(date: string): WeatherEntry {
  const month = new Date(date + 'T00:00:00Z').getUTCMonth() + 1;
  return miamiMonthlyAverage[month] ?? miamiMonthlyAverage[1];
}
