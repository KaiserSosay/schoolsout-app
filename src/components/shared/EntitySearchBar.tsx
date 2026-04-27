'use client';

import { useEffect, useState } from 'react';

// Generic debounced search input shared by camps + schools (and any future
// entity directory). Owns its own local state so the parent only sees a
// settled value. Visual treatment matches the pre-extraction inline input
// inside CampsFilterBar (rounded pill, 🔍 prefix, clear-X suffix when typed).

export function EntitySearchBar({
  value,
  onChange,
  placeholder,
  ariaLabel,
  clearLabel,
  debounceMs = 300,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  ariaLabel: string;
  clearLabel: string;
  debounceMs?: number;
}) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (local === value) return;
    const id = window.setTimeout(() => {
      onChange(local);
    }, debounceMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local, debounceMs]);

  return (
    <div className="relative w-full md:w-60">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted"
      >
        🔍
      </span>
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        aria-label={ariaLabel}
        placeholder={placeholder}
        className="block w-full min-h-11 rounded-full border border-cream-border bg-white pl-9 pr-9 py-2 text-sm text-ink placeholder:text-muted outline-none focus:border-ink/40 focus:ring-2 focus:ring-ink/20"
      />
      {local ? (
        <button
          type="button"
          aria-label={clearLabel}
          onClick={() => {
            setLocal('');
            onChange('');
          }}
          className="absolute inset-y-0 right-2 flex items-center px-2 text-muted hover:text-ink"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
