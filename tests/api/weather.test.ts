import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Weather route has no DB or Resend deps; only external dep is global fetch.

function daysFromToday(n: number): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

beforeEach(() => {
  vi.restoreAllMocks();
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('GET /api/weather', () => {
  it('rejects invalid date string', async () => {
    const { GET } = await import('@/app/api/weather/route');
    const res = await GET(new Request('http://localhost/api/weather?date=not-a-date'));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('invalid_date');
  });

  it('rejects missing date query param', async () => {
    const { GET } = await import('@/app/api/weather/route');
    const res = await GET(new Request('http://localhost/api/weather'));
    expect(res.status).toBe(400);
  });

  it('returns forecast for dates within 16 days (mocked Open-Meteo)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        daily: {
          temperature_2m_max: [87.4],
          temperature_2m_min: [73.1],
          weather_code: [2],
        },
      }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { GET } = await import('@/app/api/weather/route');
    const date = daysFromToday(5);
    const res = await GET(new Request(`http://localhost/api/weather?date=${date}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('forecast');
    expect(body.highF).toBe(87);
    expect(body.lowF).toBe(73);
    expect(body.code).toBe(2);
    expect(mockFetch).toHaveBeenCalledOnce();
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('api.open-meteo.com');
    expect(calledUrl).toContain(`start_date=${date}`);
  });

  it('falls back to monthly average for dates beyond 16 days', async () => {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);

    const { GET } = await import('@/app/api/weather/route');
    const res = await GET(new Request('http://localhost/api/weather?date=2027-03-22'));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('monthly_average');
    // March in Miami monthly-average table: highF: 81, lowF: 67
    expect(body.highF).toBe(81);
    expect(body.lowF).toBe(67);
    expect(body.label).toMatchObject({ en: 'Warm' });
    // Fetch should NOT have been called for a far-future date.
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('falls back to monthly average when Open-Meteo returns bad data', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      // `daily` present but arrays empty → Math.round(undefined) = NaN → fall through.
      json: async () => ({ daily: { temperature_2m_max: [], temperature_2m_min: [], weather_code: [] } }),
    });
    vi.stubGlobal('fetch', mockFetch);

    const { GET } = await import('@/app/api/weather/route');
    const date = daysFromToday(3);
    const res = await GET(new Request(`http://localhost/api/weather?date=${date}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('monthly_average');
  });

  it('falls back to monthly average when fetch throws', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('network down'));
    vi.stubGlobal('fetch', mockFetch);

    const { GET } = await import('@/app/api/weather/route');
    const date = daysFromToday(7);
    const res = await GET(new Request(`http://localhost/api/weather?date=${date}`));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.source).toBe('monthly_average');
  });
});
