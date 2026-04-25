'use client';

// DECISION: Friendly, branded error page — no stack trace. The `reset` handler
// comes from Next.js App Router and re-runs the failed route segment. Copy
// lives in <ErrorState /> so any client surface that needs an error block
// (e.g. NotificationsDrawer) renders with the same warmth.
import { ErrorState } from '@/components/ErrorState';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorState onRetry={reset} ref={error.digest} />;
}
