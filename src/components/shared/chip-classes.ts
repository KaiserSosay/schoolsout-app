// Shared chip styling tokens — used by CampsFilterBar AND SchoolsIndexFilters.
// Keeping styling in one place ensures parity. If we want to evolve the chip
// look, we evolve it here once.
//
// The exact class strings preserve the legacy look: cream-bordered white pill
// in the inactive state, brand-purple fill when active. `chipDisabled` carries
// the "ghosted, can't tap" treatment used for sign-in-gated affordances.

export const chipBase =
  'inline-flex min-h-9 items-center rounded-full border px-3 py-1.5 text-xs font-bold transition-colors';

export const chipActive = 'bg-brand-purple text-white border-brand-purple';

export const chipInactive =
  'bg-white text-ink border-cream-border hover:border-brand-purple/40';

export const chipDisabled = 'opacity-40 cursor-not-allowed';
