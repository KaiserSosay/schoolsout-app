import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('GET /api/geocode', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 400 on too-short query', async () => {
    const { GET } = await import('@/app/api/geocode/route');
    const res = await GET(new Request('http://localhost/api/geocode?q=ab'));
    expect(res.status).toBe(400);
  });

  it('returns 400 on missing query', async () => {
    const { GET } = await import('@/app/api/geocode/route');
    const res = await GET(new Request('http://localhost/api/geocode'));
    expect(res.status).toBe(400);
  });

  it('returns parsed results on a good query', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        {
          display_name: 'Coral Gables, Miami-Dade County, Florida, USA',
          lat: '25.7436',
          lon: '-80.2683',
        },
      ],
    } as unknown as Response);

    const { GET } = await import('@/app/api/geocode/route');
    const res = await GET(
      new Request('http://localhost/api/geocode?q=Coral%20Gables%20FL'),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.results).toHaveLength(1);
    expect(body.results[0].latitude).toBeCloseTo(25.7436, 4);
    expect(body.results[0].longitude).toBeCloseTo(-80.2683, 4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toContain('nominatim.openstreetmap.org');
  });

  it('returns 502 when upstream fails', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as unknown as Response);

    const { GET } = await import('@/app/api/geocode/route');
    const res = await GET(
      new Request('http://localhost/api/geocode?q=Coral%20Gables'),
    );
    expect(res.status).toBe(502);
  });
});
