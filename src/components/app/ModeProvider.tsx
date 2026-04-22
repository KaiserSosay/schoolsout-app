'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

// DECISION: App-scoped ModeProvider mirrors the landing ModeContext but lives
// under /app/* so the marketing bundle stays tree-shakeable and auth-free.
// Shares localStorage key `so-mode` so a user who flipped modes on the landing
// page keeps the choice in the app (and vice versa).
//
// DECISION: When the cookie `so-kid-session=1` is present we force mode='kids'
// and expose isKidLocked. A locked session can't flip to Parent Mode from the
// UI (the AppHeader hides the toggle pill + settings link), but a parent on
// the same device can click "Exit Kid Mode" which deletes the cookie and
// reloads.
export type Mode = 'parents' | 'kids';

type Ctx = {
  mode: Mode;
  setMode: (m: Mode) => void;
  toggle: () => void;
  isKidLocked: boolean;
  exitKidLock: () => void;
};

const MODE_KEY = 'so-mode';
const KID_SESSION_COOKIE = 'so-kid-session';
const ModeContext = createContext<Ctx | null>(null);

function readKidSessionCookie(): boolean {
  if (typeof document === 'undefined') return false;
  // DECISION: match on `so-kid-session=1` as a standalone segment. Using a
  // regex anchored on `\b` keeps a future cookie named
  // `so-kid-session-reminded` from accidentally satisfying this check.
  return /(?:^|;\s*)so-kid-session=1(?:;|$)/.test(document.cookie);
}

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<Mode>('parents');
  const [isKidLocked, setIsKidLocked] = useState(false);

  useEffect(() => {
    const locked = readKidSessionCookie();
    setIsKidLocked(locked);
    if (locked) {
      setModeState('kids');
      return;
    }
    try {
      const stored = localStorage.getItem(MODE_KEY);
      if (stored === 'parents' || stored === 'kids') setModeState(stored);
    } catch {
      /* private mode / sandboxed iframe — ignore */
    }
  }, []);

  const setMode = useCallback(
    (m: Mode) => {
      if (isKidLocked) return;
      setModeState(m);
      try {
        localStorage.setItem(MODE_KEY, m);
      } catch {
        /* noop */
      }
    },
    [isKidLocked],
  );

  const toggle = useCallback(() => {
    if (isKidLocked) return;
    setMode(mode === 'parents' ? 'kids' : 'parents');
  }, [mode, setMode, isKidLocked]);

  const exitKidLock = useCallback(() => {
    // Expire the cookie.
    document.cookie = `${KID_SESSION_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    window.location.reload();
  }, []);

  return (
    <ModeContext.Provider value={{ mode, setMode, toggle, isKidLocked, exitKidLock }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode(): Ctx {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useMode must be used inside <ModeProvider>');
  return ctx;
}
