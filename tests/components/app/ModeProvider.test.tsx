import { render, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { ModeProvider, useMode } from '@/components/app/ModeProvider';

function Probe({ onCtx }: { onCtx: (ctx: ReturnType<typeof useMode>) => void }) {
  onCtx(useMode());
  return null;
}

// DECISION: jsdom 29 doesn't ship a full localStorage — stub it with a Map so
// the ModeProvider can round-trip mode state. The real impl is tested in
// production; we're only verifying hydrate/persist logic here.
type Store = Map<string, string>;
let store: Store;
beforeEach(() => {
  store = new Map<string, string>();
  const storageStub: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (k) => (store.has(k) ? store.get(k)! : null),
    key: (i) => Array.from(store.keys())[i] ?? null,
    removeItem: (k) => {
      store.delete(k);
    },
    setItem: (k, v) => {
      store.set(k, String(v));
    },
  };
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: storageStub,
  });
});

describe('app/ModeProvider', () => {
  it('hydrates from localStorage when a mode is stored', async () => {
    window.localStorage.setItem('so-mode', 'kids');
    let captured: ReturnType<typeof useMode> | null = null;

    await act(async () => {
      render(
        <ModeProvider>
          <Probe onCtx={(ctx) => (captured = ctx)} />
        </ModeProvider>,
      );
    });

    expect(captured?.mode).toBe('kids');
  });

  it('defaults to parents when localStorage is empty', async () => {
    let captured: ReturnType<typeof useMode> | null = null;

    await act(async () => {
      render(
        <ModeProvider>
          <Probe onCtx={(ctx) => (captured = ctx)} />
        </ModeProvider>,
      );
    });

    expect(captured?.mode).toBe('parents');
  });

  it('persists mode changes back to localStorage', async () => {
    let captured: ReturnType<typeof useMode> | null = null;

    await act(async () => {
      render(
        <ModeProvider>
          <Probe onCtx={(ctx) => (captured = ctx)} />
        </ModeProvider>,
      );
    });

    await act(async () => {
      captured?.setMode('kids');
    });
    expect(window.localStorage.getItem('so-mode')).toBe('kids');
    expect(captured?.mode).toBe('kids');

    await act(async () => {
      captured?.toggle();
    });
    expect(window.localStorage.getItem('so-mode')).toBe('parents');
    expect(captured?.mode).toBe('parents');
  });
});
