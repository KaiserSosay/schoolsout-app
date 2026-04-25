'use client';

// Platform-aware install instructions modal. Triggered from the user menu's
// "Get App" button. Renders different steps for iOS Safari, Android Chrome,
// desktop Chrome, desktop Edge, and a generic fallback.
//
// DECISION (Phase 3.0 / Item 1.3): we always render the modal on click
// (instead of relying on the native `beforeinstallprompt` event, which
// only fires on a subset of browsers). Browsers where a native prompt is
// available will still install via the CTA we describe — we just don't
// pre-empt their UI surface.

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { detectPlatform, type Platform } from '@/lib/platform';

const DISMISS_KEY = 'so-install-dismissed';

export function InstallAppModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('installApp');
  const [platform, setPlatform] = useState<Platform>('other');

  useEffect(() => {
    if (!open) return;
    setPlatform(detectPlatform());
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* private mode — noop */
    }
  }, [open]);

  // ESC closes the modal
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // For 'standalone', the user has already installed — short-circuit with a
  // friendly "you're already set" panel.
  if (platform === 'standalone') {
    return (
      <Frame onClose={onClose} title={t('alreadyInstalled.title')}>
        <p className="text-sm text-ink/80">{t('alreadyInstalled.body')}</p>
        <PrimaryButton onClick={onClose}>{t('gotIt')}</PrimaryButton>
      </Frame>
    );
  }

  const steps = stepsFor(platform, t);

  return (
    <Frame onClose={onClose} title={t('title')}>
      <p className="text-sm text-ink/80">{t('intro')}</p>
      <ol className="mt-4 space-y-3 text-sm">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-purple text-xs font-black text-white">
              {i + 1}
            </span>
            <span className="text-ink">{step}</span>
          </li>
        ))}
      </ol>
      <PrimaryButton onClick={onClose}>{t('gotIt')}</PrimaryButton>
    </Frame>
  );
}

function stepsFor(
  platform: Platform,
  t: ReturnType<typeof useTranslations>,
): React.ReactNode[] {
  switch (platform) {
    case 'ios-safari':
      return [
        t.rich('iosSafari.step1', {
          icon: () => (
            <span aria-hidden className="inline-block">
              ⬆️
            </span>
          ),
        }),
        t.rich('iosSafari.step2', {
          b: (chunks) => <span className="font-bold">{chunks}</span>,
        }),
        t.rich('iosSafari.step3', {
          b: (chunks) => <span className="font-bold">{chunks}</span>,
        }),
      ];
    case 'android-chrome':
      return [
        t.rich('androidChrome.step1', {
          b: (chunks) => <span className="font-bold">{chunks}</span>,
        }),
        t.rich('androidChrome.step2', {
          b: (chunks) => <span className="font-bold">{chunks}</span>,
        }),
      ];
    case 'desktop-chrome':
      return [
        t.rich('desktopChrome.step1', {
          b: (chunks) => <span className="font-bold">{chunks}</span>,
        }),
        t('desktopChrome.step2'),
      ];
    case 'desktop-edge':
      return [
        t.rich('desktopEdge.step1', {
          b: (chunks) => <span className="font-bold">{chunks}</span>,
        }),
        t('desktopEdge.step2'),
      ];
    case 'other':
    default:
      return [t('other.body')];
  }
}

function Frame({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-ink/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-app-title"
        className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-3xl border border-cream-border bg-cream p-6 shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-3xl">
              🎒
            </span>
            <h2
              id="install-app-title"
              className="text-lg font-black text-ink"
              style={{ letterSpacing: '-0.01em' }}
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </>
  );
}

function PrimaryButton({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-black text-cream transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      {children}
    </button>
  );
}
