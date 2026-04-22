export default function AppLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-6">
      <div className="h-8 w-64 animate-pulse rounded-full bg-ink/5" />
      <div className="h-4 w-48 animate-pulse rounded-full bg-ink/5" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink/5" />
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-3xl bg-ink/10" />
      <div className="h-32 animate-pulse rounded-3xl bg-ink/5" />
    </div>
  );
}
