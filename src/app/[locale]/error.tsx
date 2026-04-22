'use client';

// DECISION: Friendly, branded error page — no stack trace. The `reset` handler
// comes from Next.js App Router and re-runs the failed route segment. If it
// keeps failing, we offer a Home link as an escape hatch.
export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center p-8 text-center">
      <div className="animate-gentle-bounce text-6xl" aria-hidden>
        🌤️
      </div>
      <h1 className="mt-6 text-3xl font-black tracking-tight text-ink">
        Our service is having a slow day.
      </h1>
      <p className="mt-3 text-base text-muted">
        Something hiccupped while loading this page. Give it another try — if it
        keeps happening, drop us a line at{' '}
        <a href="mailto:hello@schoolsout.net" className="font-bold text-brand-purple underline">
          hello@schoolsout.net
        </a>
        .
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 inline-flex items-center rounded-full bg-ink px-6 py-3 text-base font-black text-cream transition hover:-translate-y-0.5 hover:shadow-lg min-h-11"
      >
        Try again
      </button>
      {error.digest ? (
        <p className="mt-4 text-[11px] text-muted/70">Ref: {error.digest}</p>
      ) : null}
    </main>
  );
}
