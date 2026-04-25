'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { School } from './KidForm';

// Phase 3.0 / Item 3.1 — typeahead replacement for the school <select>. Runs
// fully client-side against the schools[] passed in from the server (the
// settings page already loads every school name on mount). When a parent
// types a school we don't have, they tap "+ Add" and the request lands in
// `school_requests` for admin triage; the input then "selects" a sentinel
// id `__pending__:<request-id>` so the form can still submit and we can wire
// it up post-research.
//
// Future: if `schools.length` ever exceeds ~5k rows we'll swap the in-memory
// filter for a server action against `ILIKE '%query%'`. Today it's <300 rows
// and a string filter is cheaper than the round-trip.

const PENDING_PREFIX = '__pending__:';
const DEBOUNCE_MS = 200;
const MAX_RESULTS = 8;
const MIN_QUERY_FOR_REQUEST = 2;

export type SchoolAutocompleteProps = {
  schools: School[];
  value: string | null;
  onSelect: (schoolId: string | null) => void;
  testIdSuffix?: string;
  /**
   * Called after a successful school_request submission so the parent can
   * stash a friendly label like "Pending: <typed name>" alongside the sentinel
   * id. Optional — we render a simple toast either way.
   */
  onRequestSubmitted?: (requestedName: string, requestId: string) => void;
};

type Match = { id: string; name: string };

function normalize(s: string): string {
  return s.trim().toLocaleLowerCase();
}

function rankMatches(schools: School[], query: string): Match[] {
  if (!query) return [];
  const q = normalize(query);
  const startsWith: Match[] = [];
  const contains: Match[] = [];
  for (const s of schools) {
    const n = normalize(s.name);
    if (n === q || n.startsWith(q)) {
      startsWith.push({ id: s.id, name: s.name });
    } else if (n.includes(q)) {
      contains.push({ id: s.id, name: s.name });
    }
    if (startsWith.length + contains.length >= MAX_RESULTS * 2) break;
  }
  return startsWith.concat(contains).slice(0, MAX_RESULTS);
}

export function SchoolAutocomplete({
  schools,
  value,
  onSelect,
  testIdSuffix = '',
  onRequestSubmitted,
}: SchoolAutocompleteProps) {
  const t = useTranslations('app.schoolAutocomplete');

  const selectedSchool = useMemo(
    () => (value && !value.startsWith(PENDING_PREFIX) ? schools.find((s) => s.id === value) ?? null : null),
    [schools, value],
  );

  const [query, setQuery] = useState(selectedSchool?.name ?? '');
  const [debounced, setDebounced] = useState(query);
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Sync external value → input text (e.g. parent reset).
  useEffect(() => {
    setQuery(selectedSchool?.name ?? '');
  }, [selectedSchool]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [query]);

  // Click outside closes the dropdown.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const matches = useMemo(() => rankMatches(schools, debounced), [schools, debounced]);
  const trimmed = debounced.trim();
  const exactNameHit = matches.some((m) => normalize(m.name) === normalize(trimmed));
  const showAddRow =
    !submitting && trimmed.length >= MIN_QUERY_FOR_REQUEST && !exactNameHit;
  const totalRows = matches.length + (showAddRow ? 1 : 0);

  const choose = (id: string, label: string) => {
    setQuery(label);
    setOpen(false);
    onSelect(id);
  };

  const submitRequest = async () => {
    if (submitting || trimmed.length < MIN_QUERY_FOR_REQUEST) return;
    setSubmitting(true);
    setToast(null);
    try {
      const res = await fetch('/api/school-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ requested_name: trimmed }),
      });
      if (!res.ok) {
        setToast(t('requestFailed'));
        return;
      }
      const json = (await res.json()) as { ok: true; id: string };
      const sentinel = `${PENDING_PREFIX}${json.id}`;
      onSelect(sentinel);
      onRequestSubmitted?.(trimmed, json.id);
      setQuery(trimmed);
      setOpen(false);
      setToast(t('requestSuccess', { name: trimmed }));
    } catch {
      setToast(t('requestFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      e.preventDefault();
      return;
    }
    if (e.key === 'ArrowDown') {
      setFocusedIndex((i) => Math.min(i + 1, Math.max(0, totalRows - 1)));
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setFocusedIndex((i) => Math.max(0, i - 1));
      e.preventDefault();
    } else if (e.key === 'Enter') {
      if (focusedIndex < matches.length && matches[focusedIndex]) {
        const m = matches[focusedIndex]!;
        choose(m.id, m.name);
        e.preventDefault();
      } else if (showAddRow && focusedIndex === matches.length) {
        void submitRequest();
        e.preventDefault();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative" data-testid={`school-autocomplete${testIdSuffix}`}>
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={`school-list${testIdSuffix}`}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setFocusedIndex(0);
          if (selectedSchool && e.target.value !== selectedSchool.name) {
            // Editing away from a selection clears it until they pick again.
            onSelect(null);
          }
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t('placeholder')}
        className="w-full rounded-xl border border-cream-border bg-cream px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand-purple focus:outline-none"
        data-testid={`school-autocomplete-input${testIdSuffix}`}
      />
      {open && (matches.length > 0 || showAddRow) ? (
        <ul
          id={`school-list${testIdSuffix}`}
          role="listbox"
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-cream-border bg-white shadow-lg"
        >
          {matches.map((m, i) => (
            <li
              key={m.id}
              role="option"
              aria-selected={i === focusedIndex}
              onMouseEnter={() => setFocusedIndex(i)}
              onMouseDown={(e) => {
                // mousedown beats the input's blur which would close the
                // dropdown before onClick fires.
                e.preventDefault();
                choose(m.id, m.name);
              }}
              className={
                'cursor-pointer px-3 py-2 text-sm ' +
                (i === focusedIndex
                  ? 'bg-purple-soft text-ink'
                  : 'text-ink hover:bg-cream/70')
              }
            >
              {m.name}
            </li>
          ))}
          {showAddRow ? (
            <li
              role="option"
              aria-selected={focusedIndex === matches.length}
              onMouseEnter={() => setFocusedIndex(matches.length)}
              onMouseDown={(e) => {
                e.preventDefault();
                void submitRequest();
              }}
              className={
                'cursor-pointer border-t border-cream-border px-3 py-2 text-sm font-bold ' +
                (focusedIndex === matches.length
                  ? 'bg-gold/40 text-ink'
                  : 'text-brand-purple hover:bg-gold/20')
              }
              data-testid={`school-autocomplete-add${testIdSuffix}`}
            >
              {t('addRequestPrefix', { name: trimmed })}
            </li>
          ) : null}
        </ul>
      ) : null}
      {toast ? (
        <p
          role="status"
          className="mt-1 text-xs font-bold text-brand-purple"
          data-testid={`school-autocomplete-toast${testIdSuffix}`}
        >
          {toast}
        </p>
      ) : null}
    </div>
  );
}

export const SCHOOL_PENDING_PREFIX = PENDING_PREFIX;
