'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  KidsManagementSection,
  type School,
} from './KidsManagementSection';
import {
  blankKid,
  gradeToAge,
  type KidState,
} from './KidForm';
import { AddressPicker, type GeoResult } from './AddressPicker';

// DECISION: COPPA-aligned. Kid NAME and exact GRADE are kept in localStorage
// only; the server only sees {school_id, age_range, ordinal}. The form maps
// grade input ("K", "3", "9") to one of the four server-side age buckets.
// The full draft (including the hidden kids past kidCount) is persisted
// under `so-onboarding-draft` so refreshing mid-flow doesn't wipe work.
//
// Step 4 added: optional address → coordinates via /api/geocode → saved to
// /api/saved-locations as the user's primary "Home" location. Draft persists
// the label + chosen coordinates so refreshing mid-flow doesn't lose them.
export type { School };

const DRAFT_KEY = 'so-onboarding-draft';
const KIDS_LS_KEY = 'so-kids';

type Draft = {
  parentName: string;
  kidCount: number;
  kids: KidState[];
  locationLabel?: string;
  location?: GeoResult | null;
};

function loadDraft(): Draft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed.parentName !== 'string' ||
      typeof parsed.kidCount !== 'number' ||
      !Array.isArray(parsed.kids)
    ) {
      return null;
    }
    const kidCount = Math.max(1, Math.min(5, Math.round(parsed.kidCount)));
    const out: Draft = {
      parentName: parsed.parentName,
      kidCount,
      kids: parsed.kids as KidState[],
    };
    if (typeof parsed.locationLabel === 'string') out.locationLabel = parsed.locationLabel;
    if (
      parsed.location &&
      typeof parsed.location === 'object' &&
      typeof parsed.location.latitude === 'number' &&
      typeof parsed.location.longitude === 'number'
    ) {
      out.location = parsed.location as GeoResult;
    }
    return out;
  } catch {
    return null;
  }
}

function saveKidsLocal(kids: KidState[]) {
  try {
    const strip = kids.map((k) => ({ name: k.name, grade: k.grade }));
    localStorage.setItem(KIDS_LS_KEY, JSON.stringify(strip));
  } catch {
    /* ignore quota / sandbox errors */
  }
}

export function OnboardingForm({
  schools,
  locale,
  initialName,
}: {
  schools: School[];
  locale: string;
  initialName: string | null;
}) {
  const t = useTranslations('app.onboarding');
  const tStep4 = useTranslations('app.onboarding.step4');
  const router = useRouter();

  const [parentName, setParentName] = useState(initialName ?? '');
  const [kidCount, setKidCount] = useState(1);
  const [kids, setKids] = useState<KidState[]>(() => [blankKid()]);
  const [step, setStep] = useState<'kids' | 'address'>('kids');
  const [locationLabel, setLocationLabel] = useState('');
  const [pickedLocation, setPickedLocation] = useState<GeoResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const dirtyRef = useRef(false);

  // Hydrate on mount from localStorage draft.
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      if (draft.parentName) setParentName(draft.parentName);
      setKidCount(draft.kidCount);
      setKids(
        draft.kids.length
          ? draft.kids.map((k) => ({ ...blankKid(), ...k }))
          : [blankKid()],
      );
      if (draft.locationLabel) setLocationLabel(draft.locationLabel);
      if (draft.location) setPickedLocation(draft.location);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => {
      try {
        const payload: Draft = {
          parentName,
          kidCount,
          kids,
          locationLabel,
          location: pickedLocation,
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      } catch {
        /* ignore */
      }
    }, 300);
    return () => window.clearTimeout(id);
  }, [hydrated, parentName, kidCount, kids, locationLabel, pickedLocation]);

  const suggestedIds = useMemo(
    () => [
      '00000000-0000-0000-0000-000000000001', // The Growing Place
      '00000000-0000-0000-0000-000000000002', // Coral Gables Preparatory Academy
      '00000000-0000-0000-0000-000000000003', // Miami-Dade County Public Schools
    ],
    [],
  );

  const setKidCountAndGrow = (next: number) => {
    dirtyRef.current = true;
    setKidCount(next);
    setKids((prev) => {
      if (next > prev.length) {
        const out = prev.slice();
        while (out.length < next) out.push(blankKid());
        return out;
      }
      return prev;
    });
  };

  const updateKid = (idx: number, patch: Partial<KidState>) => {
    dirtyRef.current = true;
    setKids((prev) => {
      const out = [...prev];
      out[idx] = { ...out[idx]!, ...patch };
      return out;
    });
  };

  const addAnotherKid = () => {
    const next = Math.min(5, kidCount + 1);
    setKidCountAndGrow(next);
  };

  const visibleKids = kids.slice(0, kidCount);
  const canAdvanceToAddress =
    parentName.trim().length > 0 &&
    visibleKids.every((k) => Boolean(k.school_id));

  const finishOnboarding = async (withAddress: boolean) => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      saveKidsLocal(visibleKids);

      const profiles = visibleKids.map((k, i) => ({
        school_id: k.school_id!,
        age_range: gradeToAge(k.grade),
        ordinal: i + 1,
      }));

      const [mePatch, kidPost] = await Promise.all([
        fetch('/api/me', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ display_name: parentName.trim() }),
        }),
        fetch('/api/kid-profiles', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ profiles }),
        }),
      ]);

      if (!mePatch.ok || !kidPost.ok) {
        setError(t('error'));
        setSaving(false);
        return;
      }

      // DECISION: address POST is best-effort. If it fails we still move on —
      // user can always add a location in Settings later. A hard failure here
      // would be worse UX than a silent skip.
      if (withAddress && pickedLocation) {
        try {
          await fetch('/api/saved-locations', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              label: (locationLabel.trim() || tStep4('labelDefault')).slice(0, 80),
              latitude: pickedLocation.latitude,
              longitude: pickedLocation.longitude,
              is_primary: true,
            }),
          });
        } catch {
          /* ignore — continue */
        }
      }

      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }

      router.push(`/${locale}/app`);
      router.refresh();
    } catch {
      setError(t('error'));
      setSaving(false);
    }
  };

  const onKidsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAdvanceToAddress) return;
    setStep('address');
  };

  const onBackClick = (e: React.MouseEvent) => {
    if (!dirtyRef.current) return;
    const ok = window.confirm(t('backConfirm'));
    if (!ok) e.preventDefault();
  };

  if (step === 'address') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setStep('kids')}
            className="text-xs font-bold text-muted hover:text-ink"
          >
            {tStep4('back')}
          </button>
          <button
            type="button"
            onClick={() => finishOnboarding(false)}
            className="text-xs font-bold text-muted hover:text-ink"
            disabled={saving}
          >
            {tStep4('skip')}
          </button>
        </div>

        <header>
          <h2
            className="text-2xl font-black text-ink md:text-3xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            {tStep4('title')}
          </h2>
          <p className="mt-2 text-sm text-muted">{tStep4('subtitle')}</p>
          <p className="mt-2 text-[11px] italic text-muted">
            {tStep4('privacyNote')}
          </p>
        </header>

        <section>
          <label className="block text-xs font-black uppercase tracking-wider text-muted">
            {tStep4('labelLabel')}
          </label>
          <input
            type="text"
            value={locationLabel}
            onChange={(e) => setLocationLabel(e.target.value)}
            placeholder={tStep4('labelDefault')}
            className="mt-2 w-full rounded-2xl border border-cream-border bg-white px-4 py-3 text-base text-ink placeholder:text-muted focus:border-brand-purple focus:outline-none"
          />
        </section>

        <section>
          <AddressPicker
            labels={{
              addressLabel: tStep4('addressLabel'),
              addressPlaceholder: tStep4('addressPlaceholder'),
              findButton: tStep4('findButton'),
              finding: tStep4('finding'),
              pickResult: tStep4('pickResult'),
              findError: tStep4('findError'),
              noResults: tStep4('noResults'),
            }}
            onPick={(r) => setPickedLocation(r)}
          />
          {pickedLocation ? (
            <p className="mt-2 rounded-xl border border-cream-border bg-cream px-3 py-2 text-xs text-ink">
              ✅ {pickedLocation.display_name}
            </p>
          ) : null}
        </section>

        {error ? (
          <p role="alert" className="text-sm font-bold text-red-600">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => finishOnboarding(true)}
          disabled={saving}
          className="w-full rounded-full bg-ink px-6 py-4 text-base font-black text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? t('saving') : tStep4('saveAndFinish')}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onKidsSubmit} className="space-y-8">
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}`}
          onClick={onBackClick}
          className="inline-flex items-center gap-1 text-xs font-bold text-muted hover:text-ink"
        >
          {t('back')}
        </Link>
      </div>

      <section>
        <label className="block text-xs font-black uppercase tracking-wider text-muted">
          {t('labels.name')}
        </label>
        <input
          type="text"
          value={parentName}
          onChange={(e) => {
            dirtyRef.current = true;
            setParentName(e.target.value);
          }}
          placeholder={t('placeholders.name')}
          className="mt-2 w-full rounded-2xl border border-cream-border bg-white px-4 py-3 text-base text-ink placeholder:text-muted focus:border-brand-purple focus:outline-none"
          required
        />
      </section>

      <KidsManagementSection
        kids={kids}
        kidCount={kidCount}
        onCountChange={setKidCountAndGrow}
        onKidChange={updateKid}
        onAddKid={addAnotherKid}
        schools={schools}
        suggestedIds={suggestedIds}
        privacyNamespace="app.onboarding.privacy"
      />

      {error ? (
        <p role="alert" className="text-sm font-bold text-red-600">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canAdvanceToAddress || saving}
        className="w-full rounded-full bg-ink px-6 py-4 text-base font-black text-cream transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {tStep4('next')}
      </button>
    </form>
  );
}
