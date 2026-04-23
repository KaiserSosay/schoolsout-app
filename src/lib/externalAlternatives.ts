// Match external alternatives (sitters, cruises, resorts) to a closure.
// Pure function so it runs either in a Server Component (closure detail)
// or client-side.

export type AlternativeType = 'sitter_service' | 'cruise' | 'resort' | 'travel';

export type ExternalAlternative = {
  id: string;
  type: AlternativeType;
  name: string;
  provider: string;
  description: string | null;
  deep_link_template: string;
  duration_days: number | null;
  departure_city: string | null;
  min_lead_days: number;
  price_from_cents: number | null;
};

export type ClosureLike = {
  start_date: string; // ISO yyyy-mm-dd
  end_date: string;
};

function closureDurationDays(c: ClosureLike): number {
  const s = Date.parse(c.start_date + 'T00:00:00Z');
  const e = Date.parse(c.end_date + 'T00:00:00Z');
  return Math.round((e - s) / 86_400_000) + 1;
}

function daysUntil(iso: string): number {
  const start = Date.parse(iso + 'T00:00:00Z');
  const now = Date.now();
  return Math.round((start - now) / 86_400_000);
}

// Core selector — one-day closures get sitter suggestions, multi-day
// closures get travel options (cruise or resort) that fit the span AND
// the remaining lead-time before departure. Closures more than 60 days
// out skip sitters (too far to bother) and closures inside min_lead_days
// skip travel (can't book in time).
export function alternativesForClosure(
  closure: ClosureLike,
  alternatives: ReadonlyArray<ExternalAlternative>,
): ExternalAlternative[] {
  const days = closureDurationDays(closure);
  const lead = daysUntil(closure.start_date);

  if (days === 1) {
    if (lead > 60) return [];
    return alternatives.filter((a) => a.type === 'sitter_service');
  }

  if (days >= 3) {
    return alternatives.filter((a) => {
      if (a.type !== 'cruise' && a.type !== 'resort' && a.type !== 'travel') {
        return false;
      }
      if (a.duration_days != null && a.duration_days > days) return false;
      if (lead < a.min_lead_days) return false;
      return true;
    });
  }

  return [];
}

// Render helper — substitutes {{zip}}, {{start}}, {{end}} placeholders in
// deep_link_template with the parent's zip + the closure window. Returns
// the template unchanged if a placeholder has no matching arg.
export function renderDeepLink(
  template: string,
  ctx: { zip?: string | null; start: string; end: string },
): string {
  return template
    .replace(/\{\{zip\}\}/g, ctx.zip ?? '')
    .replace(/\{\{start\}\}/g, ctx.start)
    .replace(/\{\{end\}\}/g, ctx.end);
}
