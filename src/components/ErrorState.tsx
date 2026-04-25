// Reusable friendly error block. Same copy + tone as the route-segment
// error boundary at src/app/[locale]/error.tsx (Phase 3.0 / Item 1.7 —
// extracted so client surfaces with localized error states render with
// the same warmth instead of a generic "Something went wrong"). UX_PRINCIPLES
// rule #8 — errors are human, friendly, with a retry.
import type { ReactNode } from 'react';

export type ErrorStateProps = {
  /** Override headline. Defaults to "Our service is having a slow day." */
  title?: string;
  /** Override body copy. Defaults to the standard "hiccupped" message. */
  body?: ReactNode;
  /** Retry CTA label. Defaults to "Try again". */
  retryLabel?: string;
  /** When omitted, the retry button is hidden. */
  onRetry?: () => void;
  /** Optional ref / digest line ("Ref: abc123…"). */
  ref?: string;
  /** Render in a compact inline layout (e.g. inside a drawer). */
  compact?: boolean;
};

const DEFAULT_BODY = (
  <>
    Something hiccupped while loading this. Give it another try — if it keeps
    happening, drop us a line at{' '}
    <a
      href="mailto:hello@schoolsout.net"
      className="font-bold text-brand-purple underline"
    >
      hello@schoolsout.net
    </a>
    .
  </>
);

export function ErrorState({
  title = 'Our service is having a slow day.',
  body = DEFAULT_BODY,
  retryLabel = 'Try again',
  onRetry,
  ref,
  compact = false,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div className="px-4 py-6 text-center">
        <div className="animate-gentle-bounce text-4xl" aria-hidden>
          🌤️
        </div>
        <p className="mt-3 text-sm font-bold text-ink">{title}</p>
        <p className="mt-1 text-xs text-muted">{body}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex min-h-11 items-center rounded-full bg-ink px-4 py-2 text-xs font-black text-cream"
          >
            {retryLabel}
          </button>
        ) : null}
        {ref ? (
          <p className="mt-3 text-[11px] text-muted/70">Ref: {ref}</p>
        ) : null}
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-8 text-center">
      <div className="animate-gentle-bounce text-6xl" aria-hidden>
        🌤️
      </div>
      <h1 className="mt-6 text-3xl font-black tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-3 text-base text-muted">{body}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex min-h-11 items-center rounded-full bg-ink px-6 py-3 text-base font-black text-cream transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          {retryLabel}
        </button>
      ) : null}
      {ref ? (
        <p className="mt-4 text-[11px] text-muted/70">Ref: {ref}</p>
      ) : null}
    </main>
  );
}
