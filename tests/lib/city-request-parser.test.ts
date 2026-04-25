import { describe, it, expect } from 'vitest';
import { parseCityRequestBody } from '@/lib/city-request-parser';

// Phase 3.0 / Item 3.6 — admin's feature-requests panel surfaces an
// extracted-fields panel above the body whenever the body is a city
// request. This test guards the parser against drift.

describe('parseCityRequestBody', () => {
  it('extracts city + school from the canonical seeded body', () => {
    const body = 'City request: Orlando\nSchool: Orlando Magnet School';
    expect(parseCityRequestBody(body)).toEqual({
      city: 'Orlando',
      school: 'Orlando Magnet School',
    });
  });

  it('extracts city only when school line is empty', () => {
    const body = 'City request: Tampa\nSchool: ';
    expect(parseCityRequestBody(body)).toEqual({
      city: 'Tampa',
      school: null,
    });
  });

  it('extracts city when school line is missing entirely', () => {
    const body = 'City request: Boston';
    expect(parseCityRequestBody(body)).toEqual({
      city: 'Boston',
      school: null,
    });
  });

  it('returns nulls for non-city-request feedback', () => {
    expect(parseCityRequestBody('I love this app!')).toEqual({
      city: null,
      school: null,
    });
    expect(parseCityRequestBody('Bug: dashboard 500s on Safari 17')).toEqual({
      city: null,
      school: null,
    });
  });

  it('returns nulls for empty / null input', () => {
    expect(parseCityRequestBody('')).toEqual({ city: null, school: null });
    expect(parseCityRequestBody(null)).toEqual({ city: null, school: null });
    expect(parseCityRequestBody(undefined)).toEqual({ city: null, school: null });
  });

  it('is case-insensitive on the prefix labels', () => {
    const body = 'city request: Houston\nschool: Bellaire HS';
    expect(parseCityRequestBody(body)).toEqual({
      city: 'Houston',
      school: 'Bellaire HS',
    });
  });

  it('tolerates extra whitespace around values', () => {
    const body = 'City request:    Austin   \nSchool:   Eanes Elementary  ';
    expect(parseCityRequestBody(body)).toEqual({
      city: 'Austin',
      school: 'Eanes Elementary',
    });
  });
});
