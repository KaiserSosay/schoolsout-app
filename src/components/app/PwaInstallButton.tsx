'use client';

// "Get App" trigger inside the user menu.
//
// DECISION (Phase 3.0 / Item 1.3): always render. Clicking opens the
// platform-aware InstallAppModal. The previous version listened for
// `beforeinstallprompt` and rendered nothing when the event never fired
// (iOS Safari, Firefox, etc.) — which is exactly when the user MOST needs
// instructions. We trade a one-tap native install on Chrome for a
// universally-useful "here's how" panel.

import { useState } from 'react';
import { InstallAppModal } from '@/components/InstallAppModal';

export function PwaInstallButton({ label }: { label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex w-full items-center gap-2 rounded-full bg-brand-purple/10 px-3 py-2 text-xs font-bold text-brand-purple transition-colors hover:bg-brand-purple/20"
      >
        <span aria-hidden>📱</span>
        <span>{label}</span>
      </button>
      <InstallAppModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
