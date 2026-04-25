// Parses the body of a feature_requests row that originated from the
// /cities page's CityRequestTrigger. The trigger seeds the modal with
//   "City request: \nSchool: "
// so by the time the request lands, body looks like:
//   "City request: Orlando\nSchool: Orlando Magnet School"
// (the user fills both lines, or just the city line — school is optional).
//
// Returns nulls when the body doesn't match the prefix shape — the admin
// pane falls back to rendering the body verbatim.

export type ParsedCityRequest = {
  city: string | null;
  school: string | null;
};

export function parseCityRequestBody(body: string | null | undefined): ParsedCityRequest {
  if (!body) return { city: null, school: null };
  // Only attempt to parse if the body starts with the canonical prefix.
  // Saves us from false-positives on unrelated feedback that happens to
  // contain "City" somewhere.
  if (!/^\s*City request\s*:/i.test(body)) {
    return { city: null, school: null };
  }
  const cityMatch = body.match(/^\s*City request\s*:\s*(.*)$/im);
  const schoolMatch = body.match(/^\s*School\s*:\s*(.*)$/im);
  const trim = (s: string | undefined) => {
    const v = (s ?? '').trim();
    return v.length > 0 ? v : null;
  };
  return {
    city: trim(cityMatch?.[1]),
    school: trim(schoolMatch?.[1]),
  };
}
