// Static lookup table of Miami-Dade neighborhood centroids.
//
// DECISION (Phase 3.0 / Item 1.9): keep distance sort honest without an
// external geocoding API. When a camp has a neighborhood but no lat/lng
// (most of the 70 imported research camps), we fall back to the
// neighborhood centroid + flag the result as approximate so the card
// renders "~3.2 mi" instead of "3.2 mi". UX_PRINCIPLES rule #4 — honest
// disclosures everywhere; rule #2 — no hallucinations.
//
// Coordinates are public-domain neighborhood centroids — Wikipedia,
// USPS ZIP centroids, or our own pin-on-map averages. ±0.5 mi accuracy
// is fine because we're sorting, not navigating.

export type Centroid = { lat: number; lng: number };

// Keep keys in their canonical capitalization (matches camps.neighborhood
// values from the research import). Lookup is case-insensitive via
// `neighborhoodCentroid()` below.
export const NEIGHBORHOOD_CENTROIDS: Record<string, Centroid> = {
  'Aventura':                { lat: 25.9565, lng: -80.1391 },
  'Bal Harbour':             { lat: 25.8898, lng: -80.1265 },
  'Bay Harbor Islands':      { lat: 25.8881, lng: -80.1322 },
  'Brickell':                { lat: 25.7617, lng: -80.1918 },
  'Coconut Grove':           { lat: 25.7281, lng: -80.2434 },
  'Coral Gables':            { lat: 25.7211, lng: -80.2683 },
  'Coral Way':               { lat: 25.7510, lng: -80.2400 },
  'Cutler Bay':              { lat: 25.5808, lng: -80.3473 },
  'Doral':                   { lat: 25.8195, lng: -80.3553 },
  'Downtown':                { lat: 25.7743, lng: -80.1937 },
  'Downtown Miami':          { lat: 25.7743, lng: -80.1937 },
  'Edgewater':               { lat: 25.7975, lng: -80.1880 },
  'El Portal':               { lat: 25.8551, lng: -80.1959 },
  'Fisher Island':           { lat: 25.7625, lng: -80.1430 },
  'Florida City':            { lat: 25.4476, lng: -80.4793 },
  'Hialeah':                 { lat: 25.8576, lng: -80.2781 },
  'Hialeah Gardens':         { lat: 25.8612, lng: -80.3247 },
  'Homestead':               { lat: 25.4687, lng: -80.4776 },
  'Indian Creek':            { lat: 25.8780, lng: -80.1364 },
  'Kendall':                 { lat: 25.6793, lng: -80.3173 },
  'Key Biscayne':            { lat: 25.6939, lng: -80.1628 },
  'Liberty City':            { lat: 25.8328, lng: -80.2390 },
  'Little Haiti':            { lat: 25.8254, lng: -80.1928 },
  'Little Havana':           { lat: 25.7649, lng: -80.2294 },
  'Little River':            { lat: 25.8459, lng: -80.2008 },
  'Medley':                  { lat: 25.8723, lng: -80.3289 },
  'Miami':                   { lat: 25.7617, lng: -80.1918 },
  'Miami Beach':             { lat: 25.7907, lng: -80.1300 },
  'Miami Gardens':           { lat: 25.9420, lng: -80.2456 },
  'Miami Lakes':             { lat: 25.9087, lng: -80.3087 },
  'Miami Shores':            { lat: 25.8634, lng: -80.1928 },
  'Miami Springs':           { lat: 25.8221, lng: -80.2895 },
  'Midtown':                 { lat: 25.8027, lng: -80.1945 },
  'North Bay Village':       { lat: 25.8462, lng: -80.1572 },
  'North Miami':             { lat: 25.8901, lng: -80.1867 },
  'North Miami Beach':       { lat: 25.9331, lng: -80.1626 },
  'Opa-locka':               { lat: 25.9026, lng: -80.2503 },
  'Overtown':                { lat: 25.7866, lng: -80.1992 },
  'Palmetto Bay':            { lat: 25.6220, lng: -80.3251 },
  'Pinecrest':               { lat: 25.6679, lng: -80.3079 },
  'South Miami':             { lat: 25.7076, lng: -80.2933 },
  'Sunny Isles Beach':       { lat: 25.9434, lng: -80.1234 },
  'Surfside':                { lat: 25.8773, lng: -80.1259 },
  'Sweetwater':              { lat: 25.7634, lng: -80.3711 },
  'Tamiami':                 { lat: 25.7494, lng: -80.4264 },
  'The Roads':               { lat: 25.7623, lng: -80.2050 },
  'Upper Eastside':          { lat: 25.8270, lng: -80.1856 },
  'Virginia Gardens':        { lat: 25.8062, lng: -80.3045 },
  'West Miami':              { lat: 25.7611, lng: -80.2967 },
  'Westchester':             { lat: 25.7548, lng: -80.3399 },
  'Wynwood':                 { lat: 25.8011, lng: -80.1990 },
};

const NORMALIZED_INDEX: Record<string, Centroid> = Object.fromEntries(
  Object.entries(NEIGHBORHOOD_CENTROIDS).map(([k, v]) => [
    k.toLowerCase().trim(),
    v,
  ]),
);

/**
 * Look up a centroid by neighborhood name. Case- and whitespace-insensitive.
 * Returns null when the neighborhood isn't in the table — caller should treat
 * the camp as "no location" and let it sink to the bottom of the sort.
 */
export function neighborhoodCentroid(
  neighborhood: string | null | undefined,
): Centroid | null {
  if (!neighborhood) return null;
  return NORMALIZED_INDEX[neighborhood.toLowerCase().trim()] ?? null;
}
