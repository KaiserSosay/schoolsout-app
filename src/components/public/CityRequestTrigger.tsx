'use client';

// Opens the global FeatureRequestModal (mounted in [locale]/layout.tsx)
// with a prefilled body draft. Reuses the feature-request pipeline so
// city requests land in the same admin panel as every other piece of
// parent feedback — no separate moderation queue to build.
export function CityRequestTrigger({
  label,
  bodyDraft,
}: {
  label: string;
  bodyDraft: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(
          new CustomEvent('so-open-feature-request', {
            detail: { category: 'idea', bodyDraft },
          }),
        );
      }}
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white hover:bg-ink/90 transition-colors"
    >
      {label}
    </button>
  );
}
