'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Mode = 'parents' | 'kids';

type Ctx = {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
};

const MODE_KEY = 'so-mode';

const ModeContext = createContext<Ctx | null>(null);

// DECISION: default is 'parents' per the premium-editorial rebuild. The old
// default was 'kids'; on the first post-upgrade visit for existing users we
// honor whatever they already have in localStorage.
export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('parents');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MODE_KEY);
      if (stored === 'parents' || stored === 'kids') setModeState(stored);
    } catch {
      /* sandboxed iframes / private mode */
    }
  }, []);

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      /* noop */
    }
  }, []);

  const toggle = useCallback(
    () => setMode(mode === 'parents' ? 'kids' : 'parents'),
    [mode, setMode],
  );

  return (
    <ModeContext.Provider value={{ mode, setMode, toggle }}>{children}</ModeContext.Provider>
  );
}

export function useMode(): Ctx {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used inside <ModeProvider>');
  return ctx;
}
