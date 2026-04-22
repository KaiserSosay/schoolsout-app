'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// DECISION: App-scoped ModeProvider mirrors the landing ModeContext but lives
// under /app/* so the marketing bundle stays tree-shakeable and auth-free.
// Shares localStorage key `so-mode` so a user who flipped modes on the landing
// page keeps the choice in the app (and vice versa).
export type Mode = 'parents' | 'kids';

type Ctx = {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
};

const MODE_KEY = 'so-mode';
const ModeContext = createContext<Ctx | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('parents');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(MODE_KEY);
      if (stored === 'parents' || stored === 'kids') setModeState(stored);
    } catch {
      /* private mode / sandboxed iframe — ignore */
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
