'use client';

import { useEffect, useState } from 'react';

// DECISION: Minimal PWA install prompt. We listen for `beforeinstallprompt`,
// hide the button when (a) the event never fires (already-installed or Safari
// which doesn't expose it) and (b) after a successful install. No analytics —
// we don't track installs. Safari users see nothing; that's acceptable.
type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function PwaInstallButton({ label }: { label: string }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setInstalled(true);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed || !deferred) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await deferred.prompt();
          await deferred.userChoice;
        } finally {
          setDeferred(null);
        }
      }}
      className="hidden sm:inline-flex items-center rounded-full bg-brand-purple/10 px-3 py-1.5 text-xs font-bold text-brand-purple transition-colors hover:bg-brand-purple/20"
    >
      {label}
    </button>
  );
}
