#!/usr/bin/env tsx
/**
 * Parse the 11 anchor-private-school calendar files in
 *   docs/plans/calendar-pdfs/
 * into a single, schema-defensive JSON for Noah's review at
 *   docs/plans/parsed-school-calendars-2026-04-25.json
 *
 * Handles three formats:
 *   .ics — regex over BEGIN:VEVENT blocks; filters to closure-keyword SUMMARYs
 *   .pdf — pdftotext (poppler) → keep only annotation lines (date + label),
 *          group by the most-recent month header. Skips calendar grid rows.
 *   .png — reads a sibling <basename>.extracted.json hand-curated by Claude
 *          (multimodal). Keeps the parser deterministic + reproducible.
 *
 * Run:
 *   pnpm dlx tsx scripts/parse-school-calendars.ts
 *   pnpm dlx tsx scripts/parse-school-calendars.ts --school gulliver-prep
 */

// IMPORTANT: This script writes to a NEW migration file each run. It will
// REFUSE to overwrite an existing file. To regenerate output, pass an
// explicit --output=path argument with a new filename.
//
// Never run this script and overwrite an applied migration. Migration
// files are source-of-truth for production schema; replacing one after
// it's applied causes silent data drift.
//
// Phase 3.5 / 2026-04-26 incident: an earlier run of this script was
// silently regenerating supabase/migrations/029_anchor_schools_calendars
// .sql from scratch on every invocation. Migration 029 was already
// applied to prod. A subsequent rerun + commit could have shrunk it
// from 262 lines to 22, leaving prod's closures table out of sync with
// the migration file. The protections below — explicit --output flag,
// refuse-to-overwrite, automatic next-migration-number selection, and a
// determinism test — make the failure impossible going forward.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { basename, extname, join } from 'node:path';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ROOT = join(__dirname, '..');
const CAL_DIR = join(ROOT, 'docs', 'plans', 'calendar-pdfs');
const OUT_PATH = join(
  ROOT,
  'docs',
  'plans',
  'parsed-school-calendars-2026-04-25.json',
);
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations');

// Inspect supabase/migrations/ and return the next available 3-digit
// number (highest existing + 1, padded). Used as the default migration
// output filename when --output is not supplied so the script never
// overwrites an applied migration file.
export function nextMigrationNumber(
  migrationsDir: string = MIGRATIONS_DIR,
): string {
  if (!existsSync(migrationsDir)) return '001';
  const numbers = readdirSync(migrationsDir)
    .map((f) => f.match(/^(\d{3})_/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => parseInt(m[1], 10))
    .filter((n) => Number.isFinite(n));
  if (numbers.length === 0) return '001';
  const next = Math.max(...numbers) + 1;
  return next.toString().padStart(3, '0');
}

// Pull --foo=value or --foo value flags out of process.argv. Skips
// positional args. Returns the value or undefined.
function flag(name: string): string | undefined {
  const argv = process.argv;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === `--${name}` && i + 1 < argv.length) return argv[i + 1];
    if (a.startsWith(`--${name}=`)) return a.slice(name.length + 3);
  }
  return undefined;
}

// Map file-prefix → DB slug + display name + canonical source URL.
// Slugs verified against PROD via Supabase Studio on 2026-04-25 — they
// differ from data/schools/miami-schools-research-2026-04-24.schools.json
// (the research import normalized them slightly when it ran).
//
// `ensure` is set when the school does NOT yet exist in prod and the
// migration must INSERT it before attaching closures. Lehrman + Scheck
// Hillel were missed by the 316-school import.
type EnsureSchool = {
  district: string;
  city: string;
  state: string;
  type: string;
  is_mdcps: boolean;
  religious_affiliation?: string;
  address?: string;
  phone?: string;
  website?: string;
  data_source?: string;
};
const SCHOOL_REGISTRY: Record<
  string,
  {
    slug: string;
    name: string;
    sourceUrl: string;
    ensure?: EnsureSchool;
  }
> = {
  'gulliver-prep': {
    slug: 'gulliver-preparatory-school',
    name: 'Gulliver Preparatory School',
    sourceUrl:
      'https://www.gulliverprep.org/wp-content/uploads/academic_calendar.pdf',
  },
  'ransom-everglades': {
    slug: 'ransom-everglades-school',
    name: 'Ransom Everglades School',
    sourceUrl:
      'https://www.ransomeverglades.org/news-and-events/calendar',
  },
  'basis-independent-brickell': {
    slug: 'basis-independent-brickell',
    name: 'BASIS Independent Brickell',
    sourceUrl: 'https://basisindependent.com/brickell',
  },
  'scheck-hillel': {
    slug: 'scheck-hillel-community-school',
    name: 'Scheck Hillel Community School',
    sourceUrl: 'https://www.ehillel.org/quicklinks/calendar',
    ensure: {
      district: 'Miami-Dade Private',
      city: 'North Miami Beach',
      state: 'FL',
      type: 'private',
      is_mdcps: false,
      religious_affiliation: 'Jewish',
      address: '19000 NE 25th Avenue, North Miami Beach, FL 33180',
      phone: '(305) 931-2831',
      website: 'https://www.eHillel.org',
      data_source: 'calendar-import-2026-04-25',
    },
  },
  'westminster-christian': {
    slug: 'westminster-christian-school',
    name: 'Westminster Christian School',
    sourceUrl:
      'https://www.wcsmiami.org/news-and-events/key-dates-2025-26',
  },
  lehrman: {
    slug: 'lehrman-community-day-school',
    name: 'Lehrman Community Day School',
    sourceUrl:
      'https://www.lehrmanschool.org/parents/2025-26-calendar.cfm',
    ensure: {
      district: 'Miami-Dade Private',
      city: 'Miami Beach',
      state: 'FL',
      type: 'private',
      is_mdcps: false,
      religious_affiliation: 'Jewish',
      address: '727 77th Street, Miami Beach, FL 33141',
      phone: '(305) 866-2771',
      website: 'https://www.lehrmanschool.org',
      data_source: 'calendar-import-2026-04-25',
    },
  },
  'the-growing-place': {
    // Verified against prod 2026-04-26: the actual TGP slug is just
    // `the-growing-place`, not `the-growing-place-school-coral-gables` as
    // an earlier guess assumed. Fixed so the parser's emitted JSON lines
    // up with the schools row that migrations 029 / 035 select against.
    slug: 'the-growing-place',
    name: 'The Growing Place',
    sourceUrl: 'https://www.thegrowingplace.school/calendar',
  },
};

// SUMMARY tokens that mark an event as a probable closure.
const CLOSURE_KEYWORDS = [
  'no school',
  'no classes',
  'no class',
  'closed',
  'campus closed',
  'holiday',
  'break',
  'recess',
  'first day',
  'last day',
  'early dismissal',
  'early release',
  'half day',
  'teacher',
  'professional',
  'planning',
  'thanksgiving',
  'winter',
  'spring',
  'memorial',
  'labor day',
  'veterans',
  'mlk',
  'martin luther king',
  'presidents',
  'good friday',
  'easter',
  'rosh hashanah',
  'yom kippur',
  'sukkot',
  'simchat',
  'shemini',
  'passover',
  'shavuot',
  'eid',
  'ramadan',
  'juneteenth',
  'orientation',
  'parent conference',
  'parent/teacher',
  'in-service',
  'inservice',
  'workday',
  'workdays',
  'graduation',
  'classes resume',
  'classes end',
  'school resumes',
  'shabbat',
  'lag baomer',
  "ta'anit",
  'purim',
  'chanukah',
  'hanukkah',
  'tisha',
];

// SUMMARYs containing any of these are dropped even if they hit a closure
// keyword (e.g. "Holiday Concert" is a Christmas concert, not a closure).
const NEGATIVE_KEYWORDS = [
  'concert',
  'fundraiser',
  'gala',
  'auction',
  'rehearsal',
  'audition',
  'open house',
  'social',
  'tour',
  'reunion',
  'meeting',
  'panel',
  'workshop',
  'application',
  'apply',
  'admissions',
  'webinar',
  'showcase',
  'fair',
  'play',
  'production',
  'musical',
  'sports',
  'game',
  'trip',
  'overnight',
  'dance',
  'birthday',
  'club',
  'breakfast',
  'lunch',
  'dinner',
  'reception',
  'photo',
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Confidence = 'high' | 'medium' | 'low';

type Closure = {
  name: string;
  category: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  closed_for_students: boolean;
  is_early_release: boolean;
  confidence: Confidence;
  notes?: string;
};

type CalendarParse = {
  school_year: string;
  source_file: string;
  source_url: string;
  parser:
    | 'ics'
    | 'pdf-regex'
    | 'pdf-sidecar'
    | 'png-sidecar'
    | 'unparseable';
  closures: Closure[];
  warnings: string[];
};

type SchoolParse = {
  slug: string;
  name: string;
  calendars: CalendarParse[];
};

// ---------------------------------------------------------------------------
// Categorization
// ---------------------------------------------------------------------------

export function categorize(summary: string): {
  category: string;
  isEarlyRelease: boolean;
  closedForStudents: boolean;
} {
  const s = summary.toLowerCase();
  const isEarlyRelease =
    /early\s*(dismissal|release)|half\s*day|11:30|12 ?pm|2 ?pm|1 ?pm dismissal/.test(
      s,
    );

  let category = 'other';
  if (/first day/.test(s)) category = 'first_day';
  else if (/last day/.test(s)) category = 'last_day';
  else if (/labor day/.test(s)) category = 'federal_holiday';
  else if (/memorial day/.test(s)) category = 'federal_holiday';
  else if (/veterans/.test(s)) category = 'federal_holiday';
  else if (/martin luther king|mlk/.test(s)) category = 'federal_holiday';
  else if (/presidents/.test(s)) category = 'federal_holiday';
  else if (/juneteenth/.test(s)) category = 'federal_holiday';
  else if (/independence day|july 4/.test(s)) category = 'federal_holiday';
  else if (/columbus|indigenous peoples/.test(s)) category = 'federal_holiday';
  else if (/thanksgiving/.test(s)) category = 'break';
  else if (/winter|christmas/.test(s)) category = 'break';
  else if (/spring/.test(s)) category = 'break';
  else if (/summer/.test(s)) category = 'break';
  else if (/easter|good friday/.test(s)) category = 'religious_holiday';
  else if (
    /rosh hashanah|yom kippur|sukkot|simchat|shemini|passover|shavuot|chanukah|hanukkah|tisha|purim|lag baomer|yom ha|shabbat/.test(
      s,
    )
  )
    category = 'religious_holiday';
  else if (/eid|ramadan/.test(s)) category = 'religious_holiday';
  else if (/diwali/.test(s)) category = 'religious_holiday';
  else if (/teacher|in-service|inservice|professional|planning|workday/.test(s))
    category = 'teacher_workday';
  else if (/parent.?teacher|parent conference/.test(s))
    category = 'parent_conference';
  else if (/orientation/.test(s)) category = 'orientation';
  else if (/graduation/.test(s)) category = 'graduation';
  else if (/recess|break/.test(s)) category = 'break';
  else if (/no school|no classes|closed/.test(s)) category = 'other';

  // "Early dismissal" days are still attended — students go home early. Mark
  // closed_for_students=false to mirror existing seed semantics.
  const closedForStudents = !isEarlyRelease;

  return { category, isEarlyRelease, closedForStudents };
}

export function looksLikeClosure(summary: string): boolean {
  const s = summary.toLowerCase();
  if (NEGATIVE_KEYWORDS.some((k) => s.includes(k))) return false;
  return CLOSURE_KEYWORDS.some((k) => s.includes(k));
}

// ---------------------------------------------------------------------------
// ICS parser
// ---------------------------------------------------------------------------

export function parseIcsString(raw: string): {
  closures: Closure[];
  warnings: string[];
} {
  const unfolded = raw.replace(/\r?\n[ \t]/g, '');
  const events = unfolded.split(/BEGIN:VEVENT/).slice(1);
  const closures: Closure[] = [];
  const warnings: string[] = [];
  for (const block of events) {
    const summaryMatch = block.match(/^SUMMARY(?:;[^:]*)?:(.+)$/m);
    const dtStartMatch = block.match(
      /^DTSTART(?:;[^:]*)?:(\d{8})(?:T\d{6}Z?)?/m,
    );
    const dtEndMatch = block.match(/^DTEND(?:;[^:]*)?:(\d{8})(?:T\d{6}Z?)?/m);
    if (!summaryMatch || !dtStartMatch) continue;
    const summary = summaryMatch[1]
      .trim()
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\n/gi, ' ');
    if (!looksLikeClosure(summary)) continue;
    const startStr = dtStartMatch[1];
    const startDate = `${startStr.slice(0, 4)}-${startStr.slice(4, 6)}-${startStr.slice(6, 8)}`;
    let endDate = startDate;
    if (dtEndMatch) {
      const endStr = dtEndMatch[1];
      const exclusive = new Date(
        Number(endStr.slice(0, 4)),
        Number(endStr.slice(4, 6)) - 1,
        Number(endStr.slice(6, 8)),
      );
      exclusive.setDate(exclusive.getDate() - 1);
      const inclusiveStr = exclusive.toISOString().slice(0, 10);
      if (inclusiveStr >= startDate) endDate = inclusiveStr;
    }
    const { category, isEarlyRelease, closedForStudents } =
      categorize(summary);
    closures.push({
      name: summary,
      category,
      start_date: startDate,
      end_date: endDate,
      closed_for_students: closedForStudents,
      is_early_release: isEarlyRelease,
      confidence: 'high',
    });
  }
  return { closures: dedupe(closures), warnings };
}

function parseIcs(filePath: string): {
  closures: Closure[];
  warnings: string[];
} {
  return parseIcsString(readFileSync(filePath, 'utf8'));
}

// ---------------------------------------------------------------------------
// PDF parser — regex over pdftotext -layout output
// ---------------------------------------------------------------------------

const MONTHS: Record<string, number> = {
  JANUARY: 1,
  JAN: 1,
  FEBRUARY: 2,
  FEB: 2,
  MARCH: 3,
  MAR: 3,
  APRIL: 4,
  APR: 4,
  MAY: 5,
  JUNE: 6,
  JUN: 6,
  JULY: 7,
  JUL: 7,
  AUGUST: 8,
  AUG: 8,
  SEPTEMBER: 9,
  SEP: 9,
  SEPT: 9,
  OCTOBER: 10,
  OCT: 10,
  NOVEMBER: 11,
  NOV: 11,
  DECEMBER: 12,
  DEC: 12,
};

// Match a month header. Year is optional — Scheck Hillel 26-27 prints
// "SEPTEMBER" alone. We pick the FIRST month header on a line because
// some PDFs render 3 months per row (Scheck 25-26).
const MONTH_HEADER_RE =
  /^\s*(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)(?:\s*\([^)]*\))?(?:[\s'’]*(\d{4}))?/i;
// "Year-only" line (Scheck 26-27 prints "2026" then several months under it).
const STANDALONE_YEAR_RE = /^\s*(20\d{2})\s*$/;

// Inline date pattern for "Important Dates" tables (Gulliver 26-27).
// Matches "September 7, 2026", "March 22-26, 2027", "Dec 21, 2026-Jan 1, 2027".
const MONTH_NAME_RE =
  '(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)';
const INLINE_SINGLE_DATE_RE = new RegExp(
  `${MONTH_NAME_RE}\\s+(\\d{1,2})(?:[\\s\\u2013-]+(?:${MONTH_NAME_RE}\\s+)?(\\d{1,2}))?(?:,\\s*(\\d{4}))?`,
  'gi',
);

// Annotation patterns: "DD Description" or "DD-DD Description" or
// "Description DD-DD" (some PDFs have description first).
const ANNOTATION_DAY_FIRST = /^\s*(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?\s+(.+)$/;
const ANNOTATION_DAY_LAST =
  /^(.+?)\s+(\d{1,2})(?:\s*[-–]\s*(\d{1,2}))?\s*$/;

// Lines whose tokens are mostly bare numbers/single-letter day-of-week
// markers — those are calendar grid rows. Skip them.
function looksLikeGridRow(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  if (tokens.length < 4) return false;
  const numericish = tokens.filter((t) => /^\d{1,2}$/.test(t)).length;
  const dayHeader = tokens.filter((t) =>
    /^(S|M|T|W|R|F|TH|SU)$/i.test(t),
  ).length;
  return numericish + dayHeader >= Math.max(4, tokens.length - 1);
}

// Some annotations span multiple lines — try to glue continuation lines
// (lines that don't start with a date and don't look like a grid).
function compactAnnotations(lines: string[]): string[] {
  const out: string[] = [];
  for (const raw of lines) {
    const line = raw.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (
      MONTH_HEADER_RE.test(line) ||
      ANNOTATION_DAY_FIRST.test(line) ||
      /^\d/.test(line)
    ) {
      out.push(line);
    } else if (out.length > 0 && /^[a-z(]/.test(line)) {
      // continuation of previous annotation (lowercase or open-paren start)
      out[out.length - 1] += ' ' + line;
    } else {
      out.push(line);
    }
  }
  return out;
}

type InlineDate = {
  matched: string;
  start: string;
  end: string;
  index: number;
};

function monthNumber(name: string): number | null {
  const k = name.toUpperCase().replace(/[.]/g, '');
  return MONTHS[k] ?? null;
}

export function parseInlineDates(
  line: string,
  schoolYear: string,
): InlineDate[] {
  const out: InlineDate[] = [];
  // Pattern: Month Day(-Day)?, Year   OR   Month Day, Year-Month Day, Year
  // Captures: 1=month, 2=day1, 3=day2 (optional), 4=year (optional),
  //           5=month2 (optional, for cross-month range), 6=day3, 7=year2
  const RE =
    /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\s+(\d{1,2})(?:\s*[-–]\s*(?:(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\s+)?(\d{1,2}))?(?:,?\s*(\d{4}))?(?:\s*[-–]\s*(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\s+(\d{1,2})(?:,?\s*(\d{4}))?)?/gi;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(line)) !== null) {
    const m1 = monthNumber(m[1]);
    if (!m1) continue;
    const d1 = Number(m[2]);
    const m2InRange = m[3] ? monthNumber(m[3]) : null;
    const d2 = m[4] ? Number(m[4]) : null;
    const y1 = m[5]
      ? Number(m[5])
      : inferYearForMonth(m1, schoolYear, null);
    // Cross-range "Month Day, Year-Month Day, Year"
    const crossMonth = m[6] ? monthNumber(m[6]) : null;
    const crossDay = m[7] ? Number(m[7]) : null;
    const crossYear = m[8] ? Number(m[8]) : null;

    const start = formatDate(y1, m1, d1);
    let end = start;
    if (crossMonth && crossDay) {
      const ey = crossYear ?? inferYearForMonth(crossMonth, schoolYear, y1);
      end = formatDate(ey, crossMonth, crossDay);
    } else if (d2 !== null) {
      const em = m2InRange ?? m1;
      const ey = em < m1 ? y1 + 1 : y1;
      end = formatDate(ey, em, d2);
    }
    if (end < start) continue;
    out.push({ matched: m[0], start, end, index: m.index });
  }
  return out;
}

function inferYearForMonth(
  month: number,
  schoolYear: string,
  prevYear: number | null,
): number {
  // School year format "YYYY-YYYY"; first year covers Aug–Dec, second covers Jan–Jul.
  const [a, b] = schoolYear.split('-').map((s) => Number(s));
  if (month >= 7) return a; // Jul–Dec → first year
  if (month <= 6) return b; // Jan–Jun → second year
  return prevYear ?? a;
}

function parsePdf(
  filePath: string,
  schoolYear: string,
): { closures: Closure[]; warnings: string[]; usedSidecar: boolean } {
  // Sidecar override — when the PDF's column layout makes regex parsing
  // unreliable, a hand-curated `<basename>.extracted.json` (verified by a
  // multimodal review of the PDF) takes precedence. Same shape as the PNG
  // sidecar.
  const sidecar = filePath.replace(/\.pdf$/i, '.extracted.json');
  if (existsSync(sidecar)) {
    const data = JSON.parse(readFileSync(sidecar, 'utf8')) as {
      note?: string;
      closures: Closure[];
    };
    return {
      closures: dedupe(data.closures),
      warnings: data.note ? [data.note] : [],
      usedSidecar: true,
    };
  }

  const text = execFileSync('pdftotext', ['-layout', filePath, '-'], {
    encoding: 'utf8',
  });
  const allLines = text.split(/\r?\n/);
  const warnings: string[] = [];
  const closures: Closure[] = [];

  // Strategy A: explicit "Month Day, Year" inline dates (Gulliver 26-27
  // "Important Dates" table). For multi-column layouts (two side-by-side
  // tables on the same row), split by date positions: each date's
  // description is the text between the prior date's end and this date's
  // start. Drop short/non-closure descriptions.
  for (const raw of allLines) {
    if (!raw.trim()) continue;
    // Use the un-collapsed line so column gaps are preserved.
    const dateMatches = parseInlineDates(raw, schoolYear);
    if (dateMatches.length === 0) continue;
    let prevEnd = 0;
    for (const m of dateMatches) {
      const descRaw = raw.slice(prevEnd, m.index);
      const description = cleanLabel(descRaw);
      prevEnd = m.index + m.matched.length;
      if (!description || description.length < 3) continue;
      if (!looksLikeClosure(description)) continue;
      const { category, isEarlyRelease, closedForStudents } =
        categorize(description);
      closures.push({
        name: stripTrailingNumbers(description),
        category,
        start_date: m.start,
        end_date: m.end,
        closed_for_students: closedForStudents,
        is_early_release: isEarlyRelease,
        confidence: 'high',
      });
    }
  }

  // Strip pure grid rows.
  const cleaned = allLines.filter((l) => l.trim() && !looksLikeGridRow(l));
  // Compact wrapped annotations.
  const annotations = compactAnnotations(cleaned);

  let currentMonth: number | null = null;
  let currentYear: number | null = null;

  for (const line of annotations) {
    const monthMatch = line.match(MONTH_HEADER_RE);
    if (monthMatch) {
      const monthName = monthMatch[1].toUpperCase();
      currentMonth = MONTHS[monthName] ?? null;
      // Pull explicit year if present, e.g. "AUGUST 2025" or "AUGUST '25".
      const yearMatch = line.match(/(?:'|’)(\d{2})|(\d{4})/);
      if (yearMatch) {
        const y = yearMatch[2]
          ? Number(yearMatch[2])
          : 2000 + Number(yearMatch[1]);
        currentYear = y;
      } else if (currentMonth) {
        currentYear = inferYearForMonth(
          currentMonth,
          schoolYear,
          currentYear,
        );
      }
      continue;
    }

    if (currentMonth === null || currentYear === null) continue;

    // Date-first form
    let m = line.match(ANNOTATION_DAY_FIRST);
    let day1: number | null = null;
    let day2: number | null = null;
    let label: string | null = null;
    if (m) {
      day1 = Number(m[1]);
      day2 = m[2] ? Number(m[2]) : null;
      label = m[3].trim();
    } else {
      const m2 = line.match(ANNOTATION_DAY_LAST);
      if (m2) {
        label = m2[1].trim();
        day1 = Number(m2[2]);
        day2 = m2[3] ? Number(m2[3]) : null;
      }
    }
    if (day1 === null || !label) continue;
    if (day1 < 1 || day1 > 31) continue;
    if (day2 !== null && (day2 < 1 || day2 > 31)) continue;

    // Strip embedded grid day-number contamination from the label and
    // re-validate. If the cleaned label is too short or empty, skip.
    label = stripTrailingNumbers(label);
    if (label.length < 4) continue;

    // Reject obvious non-closure annotations.
    if (!looksLikeClosure(label)) continue;

    // Build dates. If day2 < day1, span crosses a month boundary; cap end
    // at end of currentMonth and surface a warning so Noah sees it.
    const start = formatDate(currentYear, currentMonth, day1);
    let end = start;
    if (day2 !== null) {
      if (day2 >= day1) {
        end = formatDate(currentYear, currentMonth, day2);
      } else {
        // Cross-month range like "30-3" — too ambiguous to auto-resolve.
        warnings.push(
          `Cross-month range "${day1}-${day2}" for "${label}" — split manually.`,
        );
        continue;
      }
    }

    const { category, isEarlyRelease, closedForStudents } =
      categorize(label);

    // Confidence:
    //   high   — clearly tagged as a holiday/break/no-school annotation
    //   medium — closure-keyword match but label is ambiguous (e.g. just "Recess")
    let confidence: Confidence = 'high';
    if (
      label.length > 80 ||
      label.split(/\s+/).length > 12 ||
      /tbd|tba|tentative/i.test(label)
    ) {
      confidence = 'low';
    } else if (
      !/no\s*school|no\s*classes|holiday|recess|break|closed|first day|last day|early dismissal|graduation|workday|in-service|inservice|professional|planning|orientation|conference|resume|day off/i.test(
        label,
      )
    ) {
      confidence = 'medium';
    }

    closures.push({
      name: cleanLabel(label),
      category,
      start_date: start,
      end_date: end,
      closed_for_students: closedForStudents,
      is_early_release: isEarlyRelease,
      confidence,
    });
  }

  return { closures: dedupe(closures), warnings, usedSidecar: false };
}

function cleanLabel(s: string): string {
  // Strip trailing parens/punctuation noise + normalize whitespace.
  return s
    .replace(/\s+/g, ' ')
    .replace(/[\s\-–]+$/g, '')
    .replace(/^[-–\s]+/g, '')
    .trim();
}

// Some descriptions get contaminated with calendar grid day numbers, e.g.
// "First Day of School 11 12 13 14 15 16 17". Strip trailing sequences of
// 2+ standalone day numbers (and any leading-day-number prefix the grid
// parser may have left behind).
export function stripTrailingNumbers(s: string): string {
  let out = s;
  out = out.replace(/(?:\b\d{1,2}\b\s*){3,}$/g, '').trim();
  out = out.replace(/^(?:\b\d{1,2}\b\s*){2,}/g, '').trim();
  return out || s;
}

function formatDate(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(
    d,
  ).padStart(2, '0')}`;
}

// ---------------------------------------------------------------------------
// PNG handler — reads sidecar JSON
// ---------------------------------------------------------------------------

function parsePng(filePath: string): {
  closures: Closure[];
  warnings: string[];
  parser: 'png-sidecar' | 'unparseable';
} {
  const sidecar = filePath.replace(/\.png$/i, '.extracted.json');
  if (!existsSync(sidecar)) {
    return {
      closures: [],
      warnings: [
        `No sidecar JSON at ${basename(sidecar)} — image left unparsed.`,
      ],
      parser: 'unparseable',
    };
  }
  const data = JSON.parse(readFileSync(sidecar, 'utf8')) as {
    note?: string;
    closures: Closure[];
  };
  return {
    closures: dedupe(data.closures),
    warnings: data.note ? [data.note] : [],
    parser: 'png-sidecar',
  };
}

// ---------------------------------------------------------------------------
// Dedupe + sort
// ---------------------------------------------------------------------------

function dedupe(closures: Closure[]): Closure[] {
  const seen = new Set<string>();
  const out: Closure[] = [];
  for (const c of closures.sort((a, b) =>
    a.start_date.localeCompare(b.start_date),
  )) {
    const key = `${c.start_date}|${c.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function inferSchoolYear(filename: string): string | null {
  // e.g. "gulliver-prep-2025-2026.pdf" → "2025-2026"
  const m = filename.match(/(\d{4})-(\d{4})/);
  return m ? `${m[1]}-${m[2]}` : null;
}

function inferSchoolKey(filename: string): string | null {
  for (const key of Object.keys(SCHOOL_REGISTRY)) {
    if (filename.startsWith(key + '-')) return key;
  }
  return null;
}

function main() {
  const filterArg = process.argv.indexOf('--school');
  const filter = filterArg >= 0 ? process.argv[filterArg + 1] : null;

  const files = readdirSync(CAL_DIR)
    .filter((f) => /\.(ics|pdf|png)$/i.test(f))
    .sort();

  const bySchool = new Map<string, SchoolParse>();
  for (const file of files) {
    const key = inferSchoolKey(file);
    if (!key) {
      console.warn(`SKIP unknown school for ${file}`);
      continue;
    }
    if (filter && key !== filter) continue;

    const reg = SCHOOL_REGISTRY[key];
    const schoolYear = inferSchoolYear(file) ?? '2025-2026';
    const ext = extname(file).toLowerCase();
    const fullPath = join(CAL_DIR, file);

    let parserName: CalendarParse['parser'];
    let closures: Closure[];
    let warnings: string[];

    if (ext === '.ics') {
      const r = parseIcs(fullPath);
      parserName = 'ics';
      closures = r.closures;
      warnings = r.warnings;
    } else if (ext === '.pdf') {
      const r = parsePdf(fullPath, schoolYear);
      parserName = r.usedSidecar ? 'pdf-sidecar' : 'pdf-regex';
      closures = r.closures;
      warnings = r.warnings;
    } else if (ext === '.png') {
      const r = parsePng(fullPath);
      parserName = r.parser;
      closures = r.closures;
      warnings = r.warnings;
    } else {
      continue;
    }

    if (!bySchool.has(key)) {
      bySchool.set(key, {
        slug: reg.slug,
        name: reg.name,
        calendars: [],
      });
    }
    bySchool.get(key)!.calendars.push({
      school_year: schoolYear,
      source_file: file,
      source_url: reg.sourceUrl,
      parser: parserName,
      closures,
      warnings,
    });

    console.log(
      `  ${file}: ${closures.length} closures (${parserName}${warnings.length ? `, ${warnings.length} warnings` : ''})`,
    );
  }

  // Merge calendars per school. If a school has both an ICS and a PDF for
  // the same year, keep BOTH parses but tag them so the verification doc
  // shows the operator which to trust. Don't auto-merge — Noah picks.
  const out = {
    generated_at: '2026-04-25',
    source_dir: 'docs/plans/calendar-pdfs/',
    schools: Array.from(bySchool.values()).sort((a, b) =>
      a.slug.localeCompare(b.slug),
    ),
  };

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${OUT_PATH}`);

  // Render the verification markdown + the migration SQL alongside the JSON
  // so a single `pnpm dlx tsx scripts/parse-school-calendars.ts` regenerates
  // every artifact Noah reviews.
  writeFileSync(
    join(ROOT, 'docs', 'plans', 'calendar-import-verification-2026-04-25.md'),
    renderVerification(out),
  );
  console.log(`Wrote docs/plans/calendar-import-verification-2026-04-25.md`);

  // Migration output path. Default: NEXT available migration number, so
  // a fresh run never overwrites an applied file. Override via --output=
  // for a known-safe explicit path. Refuse to write if the destination
  // file already exists — see top-of-file warning + R1 in shipping rules.
  const explicitOutput = flag('output');
  const migrationPath = explicitOutput
    ? (explicitOutput.startsWith('/') ? explicitOutput : join(ROOT, explicitOutput))
    : join(
        MIGRATIONS_DIR,
        `${nextMigrationNumber()}_parsed_school_calendars.sql`,
      );
  if (existsSync(migrationPath)) {
    throw new Error(
      `Migration file ${migrationPath} already exists. Pass --output=new_filename to write a new one. ` +
        'NEVER overwrite an applied migration — production data drift will result.',
    );
  }
  writeFileSync(migrationPath, renderMigration(out));
  console.log(
    `Wrote ${migrationPath.replace(ROOT + '/', '')} (NOT applied)`,
  );
}

// ---------------------------------------------------------------------------
// Verification doc + migration rendering
// ---------------------------------------------------------------------------

type ParsedRoot = {
  generated_at: string;
  source_dir: string;
  schools: SchoolParse[];
};

// For each (school, school_year), pick the calendar to ship: prefer
// hand-curated sidecars (highest trust) over regex parses; demote ICS feeds
// because Gulliver's public ICS is an events feed (no closures) and Ransom's
// drops mostly summer-camp noise. Returns null when no calendar is shippable.
function pickPreferredCalendar(
  cals: CalendarParse[],
): CalendarParse | null {
  const order: CalendarParse['parser'][] = [
    'pdf-sidecar',
    'png-sidecar',
    'pdf-regex',
    'ics',
    'unparseable',
  ];
  const sorted = [...cals].sort(
    (a, b) => order.indexOf(a.parser) - order.indexOf(b.parser),
  );
  for (const c of sorted) if (c.closures.length > 0) return c;
  return null;
}

function calendarsByYear(school: SchoolParse): Map<string, CalendarParse[]> {
  const m = new Map<string, CalendarParse[]>();
  for (const c of school.calendars) {
    if (!m.has(c.school_year)) m.set(c.school_year, []);
    m.get(c.school_year)!.push(c);
  }
  return m;
}

function renderVerification(root: ParsedRoot): string {
  const lines: string[] = [];
  lines.push(`# Anchor School Calendar Import — Verification Plan`);
  lines.push(``);
  lines.push(`Generated **${root.generated_at}** by`);
  lines.push(`\`scripts/parse-school-calendars.ts\` from sources in`);
  lines.push(`\`${root.source_dir}\`.`);
  lines.push(``);
  lines.push(`> **Action:** Noah reviews this doc. When approved, dad applies`);
  lines.push(`> migration \`029_anchor_schools_calendars.sql\` via`);
  lines.push(`> \`pnpm exec supabase db push\`. **Do not apply yet.**`);
  lines.push(``);

  // Summary table
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(
    `| School | 2025-26 | 2026-27 | Source | Notes |`,
  );
  lines.push(`|---|---:|---:|---|---|`);
  for (const s of root.schools) {
    const byYear = calendarsByYear(s);
    const c2526 = pickPreferredCalendar(byYear.get('2025-2026') ?? []);
    const c2627 = pickPreferredCalendar(byYear.get('2026-2027') ?? []);
    const n2526 = c2526?.closures.length ?? 0;
    const n2627 = c2627?.closures.length ?? 0;
    const sourceParsers = [c2526?.parser, c2627?.parser]
      .filter(Boolean)
      .join(', ');
    let note = '';
    if (n2526 === 0 && n2627 === 0) {
      note = '⛔ **Unparseable — see school section below.**';
    } else if (n2526 > 0 && n2627 === 0) {
      note = '25-26 only; 26-27 not yet published';
    } else if (n2526 === 0 && n2627 > 0) {
      note = '26-27 only; 25-26 missing';
    } else {
      note = 'Both years parsed';
    }
    lines.push(
      `| ${s.name} | ${n2526 || '—'} | ${n2627 || '—'} | ${sourceParsers || '—'} | ${note} |`,
    );
  }
  lines.push(``);

  // Per-school detail
  for (const s of root.schools) {
    lines.push(`## ${s.name}`);
    lines.push(``);
    lines.push(`Slug: \`${s.slug}\``);
    lines.push(``);
    const byYear = calendarsByYear(s);
    const yearsSorted = [...byYear.keys()].sort();
    for (const year of yearsSorted) {
      const cals = byYear.get(year)!;
      const picked = pickPreferredCalendar(cals);
      lines.push(`### ${year}`);
      lines.push(``);
      for (const cal of cals) {
        const tag =
          cal === picked
            ? '✅ **selected**'
            : '— alternate parse, not used';
        lines.push(
          `- \`${cal.source_file}\` (${cal.parser}) → ${cal.closures.length} closures ${tag}`,
        );
        if (cal === picked) {
          lines.push(`  Source URL: ${cal.source_url}`);
        }
        if (cal.warnings.length) {
          for (const w of cal.warnings) {
            lines.push(`  > ${w}`);
          }
        }
      }
      lines.push(``);

      if (!picked || picked.closures.length === 0) {
        lines.push(
          `**No closures will be imported for this school year.** Calendar status stays \`needs_research\`.`,
        );
        lines.push(``);
        continue;
      }

      lines.push(
        `| Date | Name | Category | Closed | Early Release | Confidence |`,
      );
      lines.push(`|---|---|---|---|---|---|`);
      for (const c of picked.closures) {
        const dateRange =
          c.start_date === c.end_date
            ? c.start_date
            : `${c.start_date} – ${c.end_date}`;
        lines.push(
          `| ${dateRange} | ${escapeMd(c.name)} | ${c.category} | ${c.closed_for_students ? 'Y' : 'N'} | ${c.is_early_release ? 'Y' : 'N'} | ${c.confidence} |`,
        );
      }
      lines.push(``);

      // Items to double-check (low-confidence rows + religious observance
      // ambiguities + grade-staggered last days)
      const flags = picked.closures.filter(
        (c) =>
          c.confidence !== 'high' ||
          /tentative|tba|tbd/i.test(c.name) ||
          (/grade|gr\.\s*\d/i.test(c.name) && c.category === 'last_day'),
      );
      if (flags.length) {
        lines.push(`**Items Noah should double-check:**`);
        for (const c of flags) {
          lines.push(
            `- \`${c.start_date}\` "${c.name}" — confidence: ${c.confidence}`,
          );
        }
        lines.push(``);
      }
    }
  }

  lines.push(`---`);
  lines.push(``);
  lines.push(`## What the migration does`);
  lines.push(``);
  lines.push(
    `1. Adds a unique index on \`closures(school_id, start_date, name)\` so the inserts can use \`ON CONFLICT DO NOTHING\` (idempotent re-runs).`,
  );
  lines.push(
    `2. Looks up each anchor school by slug; raises if any slug is missing (forces operator to fix the schools table first).`,
  );
  lines.push(
    `3. Inserts the **selected** rows above for each school + year.`,
  );
  lines.push(
    `4. Updates \`schools.calendar_status\` to \`verified_multi_year\` for schools where BOTH 25-26 and 26-27 are parsed and majority-high-confidence; \`verified_current\` for one-year-only; leaves the rest at their existing status.`,
  );
  lines.push(``);
  lines.push(`## Anti-import list`);
  lines.push(``);
  lines.push(
    `- **BASIS Independent Brickell** — DevClawd downloaded BASIS Brooklyn's PDF by mistake. No rows inserted. Status stays \`needs_research\`.`,
  );
  lines.push(
    `- **The Growing Place School** — DevClawd captured a 404 page screenshot. No rows inserted. Status stays \`needs_research\` (the original \`docs/audits/2026-04-23-calendar-audit.md\` flow — call (305) 446-0846 — is still the next step).`,
  );
  lines.push(``);
  return lines.join('\n');
}

function escapeMd(s: string): string {
  return s.replace(/\|/g, '\\|');
}

function renderMigration(root: ParsedRoot): string {
  const lines: string[] = [];
  lines.push(
    `-- Phase 3.0 — anchor private school calendar import (2025-26 + 2026-27).`,
  );
  lines.push(`-- Generated by scripts/parse-school-calendars.ts on ${root.generated_at}.`);
  lines.push(`--`);
  lines.push(`-- Sources (per row): docs/plans/calendar-pdfs/<file> + sidecar JSON when present.`);
  lines.push(`-- Verification doc: docs/plans/calendar-import-verification-2026-04-25.md`);
  lines.push(`-- Parsed JSON:      docs/plans/parsed-school-calendars-2026-04-25.json`);
  lines.push(`--`);
  lines.push(`-- DO NOT APPLY until Noah reviews the verification doc and approves.`);
  lines.push(`-- Rerunning is safe: ON CONFLICT DO NOTHING against the new unique index.`);
  lines.push(``);

  // Step 1: precursor unique index so ON CONFLICT works.
  lines.push(
    `-- 1. Unique index on (school_id, start_date, name) — required for the`,
  );
  lines.push(
    `--    ON CONFLICT clause below. CONCURRENTLY would be safer in prod but`,
  );
  lines.push(
    `--    Supabase migrations don't run in transactions for that, and the`,
  );
  lines.push(`--    closures table is small.`);
  lines.push(
    `create unique index if not exists closures_school_start_name_unique`,
  );
  lines.push(`  on public.closures (school_id, start_date, name);`);
  lines.push(``);

  // Step 2: inserts wrapped in DO block with slug lookups.
  const eligible = root.schools
    .map((s) => {
      const byYear = calendarsByYear(s);
      const cal2526 = pickPreferredCalendar(byYear.get('2025-2026') ?? []);
      const cal2627 = pickPreferredCalendar(byYear.get('2026-2027') ?? []);
      const closures = [
        ...((cal2526?.closures ?? []).map((c) => ({
          c,
          year: '2025-2026',
          source_url: cal2526!.source_url,
        }))),
        ...((cal2627?.closures ?? []).map((c) => ({
          c,
          year: '2026-2027',
          source_url: cal2627!.source_url,
        }))),
      ];
      return { school: s, closures, cal2526, cal2627 };
    })
    .filter((e) => e.closures.length > 0);

  lines.push(`do $$`);
  lines.push(`declare`);
  for (const e of eligible) {
    const v = slugToVar(e.school.slug);
    lines.push(`  ${v} uuid;`);
  }
  lines.push(`begin`);
  for (const e of eligible) {
    const v = slugToVar(e.school.slug);
    // If this school is missing from prod, INSERT it first (idempotent via
    // ON CONFLICT DO NOTHING) then SELECT its id back. Otherwise just SELECT.
    const ensure = ensureForSlug(e.school.slug);
    if (ensure) {
      const cols = [
        'slug',
        'name',
        'district',
        'city',
        'state',
        'type',
        'is_mdcps',
        'religious_affiliation',
        'address',
        'phone',
        'website',
        'data_source',
      ];
      const vals = [
        pgString(e.school.slug),
        pgString(e.school.name),
        pgString(ensure.district),
        pgString(ensure.city),
        pgString(ensure.state),
        pgString(ensure.type),
        String(ensure.is_mdcps),
        ensure.religious_affiliation
          ? pgString(ensure.religious_affiliation)
          : 'null',
        ensure.address ? pgString(ensure.address) : 'null',
        ensure.phone ? pgString(ensure.phone) : 'null',
        ensure.website ? pgString(ensure.website) : 'null',
        ensure.data_source ? pgString(ensure.data_source) : 'null',
      ];
      lines.push(`  -- Insert ${e.school.name} if missing (was not in 316-school import).`);
      lines.push(`  insert into public.schools (${cols.join(', ')})`);
      lines.push(`    values (${vals.join(', ')})`);
      lines.push(`    on conflict (slug) do nothing;`);
    }
    lines.push(
      `  select id into ${v} from public.schools where slug = '${e.school.slug}';`,
    );
    lines.push(
      `  if ${v} is null then raise exception 'school slug ${e.school.slug} not found — fix schools table first'; end if;`,
    );
  }
  lines.push(``);

  // Inserts grouped per school per year.
  for (const e of eligible) {
    const v = slugToVar(e.school.slug);
    lines.push(`  -- ${e.school.name} (${e.school.slug})`);
    lines.push(`  insert into public.closures (`);
    lines.push(
      `    school_id, name, start_date, end_date, status, source, source_url, source_type,`,
    );
    lines.push(
      `    school_year, category, closed_for_students, is_early_release, confidence`,
    );
    lines.push(`  ) values`);
    const valueLines = e.closures.map(({ c, year, source_url }, idx) => {
      const term = idx === e.closures.length - 1 ? '' : ',';
      // Pick source_type per the parser used: PNG screenshots came from
      // website calendar pages; PDFs are the school's published PDF.
      const cal = (year === '2025-2026' ? e.cal2526 : e.cal2627)!;
      const sourceType =
        cal.parser === 'png-sidecar'
          ? 'school_website_calendar_page'
          : 'school_pdf';
      return `    (${v}, ${pgString(c.name)}, '${c.start_date}', '${c.end_date}', 'verified', 'official_pdf', ${pgString(source_url)}, ${pgString(sourceType)}, '${year}', ${pgString(c.category)}, ${c.closed_for_students}, ${c.is_early_release}, ${pgString(c.confidence)})${term}`;
    });
    lines.push(...valueLines);
    lines.push(`  on conflict (school_id, start_date, name) do nothing;`);
    lines.push(``);
  }

  // Step 3: calendar_status updates. Promote only schools where the
  // shipped data is high-confidence enough.
  lines.push(
    `  -- Promote calendar_status only where the imported data is trustworthy.`,
  );
  for (const e of eligible) {
    const has2526 = e.closures.some((x) => x.year === '2025-2026');
    const has2627 = e.closures.some((x) => x.year === '2026-2027');
    const highShare =
      e.closures.filter((x) => x.c.confidence === 'high').length /
      e.closures.length;
    let status: string | null = null;
    if (has2526 && has2627 && highShare >= 0.7) {
      status = 'verified_multi_year';
    } else if ((has2526 || has2627) && highShare >= 0.7) {
      status = 'verified_current';
    }
    if (!status) continue;
    lines.push(
      `  update public.schools set calendar_status = '${status}', last_synced_at = now() where slug = '${e.school.slug}';`,
    );
  }
  lines.push(``);
  lines.push(`end $$;`);
  lines.push(``);
  return lines.join('\n');
}

function ensureForSlug(slug: string): EnsureSchool | null {
  for (const reg of Object.values(SCHOOL_REGISTRY)) {
    if (reg.slug === slug && reg.ensure) return reg.ensure;
  }
  return null;
}

function pgString(s: string): string {
  // Postgres single-quote escaping: ' → ''
  return `'${s.replace(/'/g, "''")}'`;
}

function slugToVar(slug: string): string {
  return slug.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_id';
}

// Run main() only when invoked directly (not when imported by tests).
const isDirectRun =
  require.main === module ||
  process.argv[1]?.endsWith('parse-school-calendars.ts');
if (isDirectRun) main();
