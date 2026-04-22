'use client';

// DECISION: /app-scoped error boundary. Same friendly copy as the root one,
// but keeps the user inside the app shell — the outer layout persists so the
// bottom nav is still there and the user can escape to a different tab.
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center p-6 text-center">
      <div className="animate-gentle-bounce text-5xl" aria-hidden>
        🌤️
      </div>
      <h2 className="mt-5 text-2xl font-black tracking-tight text-ink">
        Our service is having a slow day.
      </h2>
      <p className="mt-3 text-sm text-muted">
        We couldn&apos;t load this screen. Tap retry, or try a different tab
        below.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-5 inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-sm font-black text-cream transition hover:-translate-y-0.5 hover:shadow-lg min-h-11"
      >
        Retry
      </button>
      {error.digest ? (
        <p className="mt-3 text-[11px] text-muted/70">Ref: {error.digest}</p>
      ) : null}
    </section>
  );
}
