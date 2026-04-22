// DECISION: Stub only. Subagent C replaces this with the real Kid Mode UI
// (rotating gradients, countdowns, activity feed). Keeping it as a thin
// placeholder unblocks the Parent Dashboard shell without waiting on kid work.
export function KidDashboard() {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="text-6xl">🎮</div>
      <p className="mt-6 text-xl font-black text-ink">
        Kid Mode dashboard coming next.
      </p>
      <p className="mt-2 text-sm text-muted">
        Flip back to Parent Mode up top to see your family plan.
      </p>
    </div>
  );
}
