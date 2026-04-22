// ICS (iCalendar RFC 5545) builder for School's Out! calendar exports.
// Each closure becomes one all-day VEVENT spanning start_date to end_date+1
// (DTEND is exclusive per RFC 5545 §3.6.1 for DATE values).

export interface IcsClosure {
  id: string;
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD (inclusive)
  emoji?: string | null;
}

// RFC 5545 §3.3.11 — TEXT values must escape \, ; , and newlines.
function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

// YYYY-MM-DD → YYYYMMDD (ICS DATE form).
function toIcsDate(date: string): string {
  return date.replace(/-/g, '');
}

// Add one day to a YYYY-MM-DD string and return YYYYMMDD (ICS DTEND exclusive).
function addOneDayIcs(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + 1);
  const yy = dt.getUTCFullYear().toString().padStart(4, '0');
  const mm = (dt.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = dt.getUTCDate().toString().padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

// Stamp uses UTC basic format — YYYYMMDDTHHMMSSZ.
function icsStamp(d: Date = new Date()): string {
  const yy = d.getUTCFullYear().toString().padStart(4, '0');
  const mm = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = d.getUTCDate().toString().padStart(2, '0');
  const hh = d.getUTCHours().toString().padStart(2, '0');
  const mi = d.getUTCMinutes().toString().padStart(2, '0');
  const ss = d.getUTCSeconds().toString().padStart(2, '0');
  return `${yy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

export function buildIcs(closures: IcsClosure[]): string {
  const stamp = icsStamp();
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//schoolsout.net//Schools Out v1//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Schools Out!',
  ];

  for (const c of closures) {
    const summary = c.emoji ? `${c.emoji} ${c.name}` : c.name;
    lines.push(
      'BEGIN:VEVENT',
      `UID:closure-${c.id}@schoolsout.net`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(c.start_date)}`,
      `DTEND;VALUE=DATE:${addOneDayIcs(c.end_date)}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText('School closure · schoolsout.net')}`,
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  }

  lines.push('END:VCALENDAR');
  // RFC 5545 §3.1 line endings are CRLF.
  return lines.join('\r\n') + '\r\n';
}
