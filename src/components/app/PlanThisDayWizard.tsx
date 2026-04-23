'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

// DECISION: no Dialog primitive exists in this codebase and the spec says
// "no new JS deps". We use the native <dialog> element for accessibility
// (focus trap + Esc-to-close built in) with a simple CSS overlay.

type PlanType = 'coverage' | 'activities' | 'mix';
type Screen = 1 | 2 | 3;

export type WizardKid = {
  ordinal: number;
  name: string; // from localStorage
  grade?: string;
  age_range: '4-6' | '7-9' | '10-12' | '13+';
  school_id: string | null;
};

export type WizardCamp = {
  id: string;
  slug: string;
  name: string;
  ages_min: number;
  ages_max: number;
  price_tier: string;
  neighborhood: string | null;
};

export type WizardActivity = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  ages_min: number;
  ages_max: number;
  cost_tier: string;
  neighborhood: string | null;
  website_url: string | null;
  weather_preference: 'any' | 'indoor_preferred' | 'outdoor_preferred' | null;
  distance_miles: number | null;
};

export type WizardInitialPlan = {
  id: string;
  plan_type: PlanType;
  kid_names?: string[];
  camps?: string[];
  activities?: string[];
};

export type PlanThisDayWizardProps = {
  locale: string;
  open: boolean;
  onClose: () => void;
  closure: {
    id: string;
    name: string;
    start_date: string;
    school_id?: string | null;
  };
  kids: WizardKid[];
  initialPlan?: WizardInitialPlan | null;
  onSaved?: (planId: string) => void;
  onRemoved?: () => void;
};

type Weather =
  | { highF: number; lowF: number; code?: number; source: 'forecast' }
  | { highF: number; lowF: number; icon?: string; source: 'monthly_average' };

function isRainyCode(code: number | undefined): boolean {
  if (typeof code !== 'number') return false;
  if (code >= 51 && code <= 67) return true;
  if (code >= 80 && code <= 82) return true;
  if (code >= 95 && code <= 99) return true;
  return false;
}

export function PlanThisDayWizard(props: PlanThisDayWizardProps) {
  const { open, onClose, closure, kids, locale, initialPlan, onSaved, onRemoved } = props;
  const t = useTranslations('app.planThisDay');
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // If opening an existing plan, jump to screen 3.
  const [screen, setScreen] = useState<Screen>(initialPlan ? 3 : 1);
  const [selectedKids, setSelectedKids] = useState<number[]>([]);
  const [planType, setPlanType] = useState<PlanType | null>(initialPlan?.plan_type ?? null);

  const [camps, setCamps] = useState<WizardCamp[]>([]);
  const [activities, setActivities] = useState<WizardActivity[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [weather, setWeather] = useState<Weather | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  // Open / close the native dialog when `open` flips.
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      try { dlg.showModal(); } catch { /* already open */ }
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  // Autocheck kids whose school matches this closure's school_id.
  // Runs only the first time the wizard is opened (or kids change).
  useEffect(() => {
    if (!open || initialPlan) return;
    const matches = kids.filter((k) => k.school_id === closure.school_id).map((k) => k.ordinal);
    if (matches.length > 0) setSelectedKids(matches);
    else if (kids.length === 1) setSelectedKids([kids[0].ordinal]);
  }, [open, kids, closure.school_id, initialPlan]);

  // Weather fetch once.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`/api/weather?date=${closure.start_date}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setWeather(d); })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [open, closure.start_date]);

  // Screen 3 data loader
  const loadScreen3 = useCallback(async (pt: PlanType) => {
    setLoadingPlan(true);
    const ages = kids
      .filter((k) => selectedKids.length === 0 || selectedKids.includes(k.ordinal))
      .map((k) => k.age_range);
    const uniqueAges = Array.from(new Set(ages));

    const rainy = weather && 'code' in weather && isRainyCode(weather.code);
    const weatherParam = rainy ? 'rainy' : 'sunny';

    try {
      const [campsRes, actRes] = await Promise.all([
        pt !== 'activities'
          ? fetch(`/api/camps?closure_id=${closure.id}${uniqueAges.length ? `&age=${minAge(uniqueAges)}` : ''}`)
              .then((r) => (r.ok ? r.json() : { camps: [] }))
          : Promise.resolve({ camps: [] }),
        pt !== 'coverage'
          ? fetch(
              `/api/family-activities?closure_id=${closure.id}&weather=${weatherParam}${
                uniqueAges.length ? `&kid_ages=${uniqueAges.join(',')}` : ''
              }`,
            ).then((r) => (r.ok ? r.json() : { activities: [] }))
          : Promise.resolve({ activities: [] }),
      ]);
      const campLimit = pt === 'mix' ? 2 : 3;
      const actLimit = pt === 'mix' ? 2 : 3;
      setCamps((campsRes.camps ?? []).slice(0, campLimit));
      setActivities((actRes.activities ?? []).slice(0, actLimit));
    } catch {
      setCamps([]);
      setActivities([]);
    } finally {
      setLoadingPlan(false);
    }
  }, [closure.id, kids, selectedKids, weather]);

  // Load screen 3 whenever we land on it.
  useEffect(() => {
    if (screen === 3 && planType) {
      loadScreen3(planType);
    }
  }, [screen, planType, loadScreen3]);

  const toggleKid = (ordinal: number) => {
    setSelectedKids((prev) =>
      prev.includes(ordinal) ? prev.filter((o) => o !== ordinal) : [...prev, ordinal],
    );
  };

  const handleSave = async () => {
    if (!planType) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const chosenKids = kids.filter((k) => selectedKids.includes(k.ordinal));
      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          closure_id: closure.id,
          plan_type: planType,
          kid_names: chosenKids.map((k) => k.name).filter(Boolean),
          camp_ids: camps.map((c) => c.id),
          activity_ids: activities.map((a) => a.id),
        }),
      });
      if (!res.ok) throw new Error(`save_failed_${res.status}`);
      const data = await res.json();
      setSaveMsg(t('screen3.saveSuccess'));
      onSaved?.(data.id);
      // Auto-close after a beat so the toast is visible.
      setTimeout(() => { onClose(); }, 900);
    } catch {
      setSaveMsg(t('screen3.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = t('screen3.shareText', { closureName: closure.name });
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: closure.name, text: shareText, url });
        return;
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setShareMsg(t('screen3.shareCopied'));
        setTimeout(() => setShareMsg(null), 2500);
        return;
      }
      setShareMsg(t('screen3.shareFailed'));
    } catch {
      setShareMsg(t('screen3.shareFailed'));
    }
  };

  const handleRemove = async () => {
    if (typeof window === 'undefined') return;
    if (!window.confirm(t('screen3.removeConfirm'))) return;
    try {
      const res = await fetch(`/api/plans?closure_id=${closure.id}`, { method: 'DELETE' });
      if (res.ok) {
        onRemoved?.();
        onClose();
      }
    } catch {
      // swallow — the modal stays open and the user can retry
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/40 bg-transparent p-0 m-0 w-full max-w-[720px] mx-auto rounded-t-3xl sm:rounded-3xl"
      onClose={onClose}
      onClick={(e) => {
        // click-outside-to-close: only when clicking the backdrop (the <dialog>
        // itself receives the click when the backdrop is the target).
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="plan-wizard-title"
    >
      <div
        className="bg-cream text-ink rounded-t-3xl sm:rounded-3xl min-h-[60vh] max-h-[90vh] overflow-y-auto"
        data-testid="plan-wizard-body"
      >
        <div className="sticky top-0 bg-cream border-b border-cream-border flex items-center justify-between px-5 py-3 z-10">
          <p
            id="plan-wizard-title"
            className="text-xs font-bold uppercase tracking-widest text-brand-purple"
          >
            {screen === 1 ? t('screen1.title') : screen === 2 ? t('screen2.title') : t('screen3.title')}
          </p>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-2xl text-muted hover:text-ink"
          >
            ×
          </button>
        </div>

        <div className="px-5 py-6 space-y-4">
          {screen === 1 && (
            <Screen1
              kids={kids}
              selected={selectedKids}
              onToggle={toggleKid}
              locale={locale}
            />
          )}

          {screen === 2 && (
            <Screen2 selected={planType} onSelect={setPlanType} />
          )}

          {screen === 3 && (
            <Screen3
              weather={weather}
              camps={camps}
              activities={activities}
              planType={planType}
              loading={loadingPlan}
              locale={locale}
            />
          )}
        </div>

        <div className="sticky bottom-0 bg-cream border-t border-cream-border px-5 py-3 flex items-center justify-between gap-3">
          {screen > 1 && screen < 3 ? (
            <button
              type="button"
              onClick={() => setScreen((s) => (s - 1) as Screen)}
              className="min-h-[44px] px-4 py-2 text-sm font-semibold text-muted hover:text-ink"
            >
              {t('nav.back')}
            </button>
          ) : <span />}

          {screen < 3 && (
            <button
              type="button"
              disabled={
                (screen === 1 && selectedKids.length === 0) ||
                (screen === 2 && planType === null)
              }
              onClick={() => setScreen((s) => (Math.min(3, s + 1)) as Screen)}
              className="min-h-[44px] px-5 py-2 rounded-full bg-ink text-white font-bold disabled:opacity-40"
            >
              {t('nav.next')}
            </button>
          )}

          {screen === 3 && (
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 min-h-[48px] rounded-full bg-gold text-ink font-bold disabled:opacity-60"
                >
                  {t('screen3.save')}
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  className="min-h-[48px] px-4 rounded-full border border-ink/20 text-ink font-semibold hover:bg-ink/5"
                >
                  {t('screen3.share')}
                </button>
              </div>
              {(saveMsg || shareMsg) && (
                <p className="text-xs text-muted" role="status">
                  {saveMsg || shareMsg}
                </p>
              )}
              {initialPlan && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="self-start text-xs text-muted hover:text-ink underline"
                >
                  {t('screen3.remove')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}

function minAge(ages: string[]): number {
  let min = 99;
  for (const a of ages) {
    const n = parseInt(a.split('-')[0] || '0', 10);
    if (n < min) min = n;
  }
  return min === 99 ? 0 : min;
}

function Screen1({
  kids,
  selected,
  onToggle,
  locale,
}: {
  kids: WizardKid[];
  selected: number[];
  onToggle: (ordinal: number) => void;
  locale: string;
}) {
  const t = useTranslations('app.planThisDay.screen1');
  if (kids.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-cream-border p-5 space-y-3">
        <p className="text-sm text-ink">{t('emptyKids')}</p>
        <a
          href={`/${locale}/app/family`}
          className="inline-block text-sm font-semibold text-brand-purple hover:underline"
        >
          {t('goToFamily')}
        </a>
      </div>
    );
  }
  return (
    <ul className="space-y-2" data-testid="plan-wizard-screen1-kids">
      {kids.map((k) => {
        const checked = selected.includes(k.ordinal);
        return (
          <li key={k.ordinal}>
            <label
              className={
                'flex items-center gap-3 rounded-2xl border px-4 h-16 cursor-pointer transition ' +
                (checked
                  ? 'border-brand-purple bg-purple-soft'
                  : 'border-cream-border bg-white hover:border-ink/30')
              }
            >
              <input
                type="checkbox"
                className="h-5 w-5 accent-brand-purple"
                checked={checked}
                onChange={() => onToggle(k.ordinal)}
                aria-label={k.name || `Kid ${k.ordinal}`}
              />
              <span className="flex-1 font-bold text-ink">
                {k.name || `Kid ${k.ordinal}`}
              </span>
              <span className="text-xs rounded-full bg-ink/10 px-2 py-1 text-ink">
                Ages {k.age_range}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function Screen2({
  selected,
  onSelect,
}: {
  selected: PlanType | null;
  onSelect: (p: PlanType) => void;
}) {
  const t = useTranslations('app.planThisDay.screen2');
  const options: { key: PlanType; emoji: string }[] = [
    { key: 'coverage', emoji: '🎒' },
    { key: 'activities', emoji: '🏖️' },
    { key: 'mix', emoji: '🎯' },
  ];
  return (
    <ul className="space-y-2" data-testid="plan-wizard-screen2-types">
      {options.map((o) => {
        const checked = selected === o.key;
        return (
          <li key={o.key}>
            <label
              className={
                'flex items-center gap-3 rounded-2xl border px-4 h-14 cursor-pointer transition ' +
                (checked
                  ? 'border-brand-purple bg-purple-soft'
                  : 'border-cream-border bg-white hover:border-ink/30')
              }
            >
              <input
                type="radio"
                name="plan-type"
                className="h-5 w-5 accent-brand-purple"
                checked={checked}
                onChange={() => onSelect(o.key)}
              />
              <span className="text-2xl" aria-hidden="true">{o.emoji}</span>
              <span className="flex-1">
                <span className="block font-bold text-ink">{t(`${o.key}.title`)}</span>
                <span className="block text-xs text-muted">{t(`${o.key}.subtitle`)}</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function Screen3({
  weather,
  camps,
  activities,
  planType,
  loading,
  locale,
}: {
  weather: Weather | null;
  camps: WizardCamp[];
  activities: WizardActivity[];
  planType: PlanType | null;
  loading: boolean;
  locale: string;
}) {
  const t = useTranslations('app.planThisDay.screen3');
  return (
    <>
      <section className="rounded-2xl bg-white border border-cream-border p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-purple">
          🌤️ Weather
        </p>
        {weather ? (
          <p className="text-xl font-extrabold text-ink">
            {weather.highF}° / {weather.lowF}°{' '}
            <span className="text-xs font-normal text-muted">
              {weather.source === 'forecast' ? 'Forecast' : 'Monthly avg'}
            </span>
          </p>
        ) : (
          <div className="h-6 w-32 rounded-lg skeleton-shine-cream" />
        )}
      </section>

      {(planType === 'coverage' || planType === 'mix') && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-ink">{t('campsHeading')}</h3>
          {loading ? (
            <div className="space-y-2">
              <div className="h-16 rounded-2xl skeleton-shine-cream" />
              <div className="h-16 rounded-2xl skeleton-shine-cream" />
            </div>
          ) : camps.length === 0 ? (
            <div className="rounded-2xl bg-white border border-cream-border p-4 text-sm text-muted">
              {t('noCamps')}
              <div className="mt-2">
                <a
                  href={`/${locale}/app/camps`}
                  className="text-xs font-semibold text-brand-purple hover:underline"
                >
                  Browse camps →
                </a>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {camps.map((c) => (
                <li key={c.id}>
                  <a
                    href={`/${locale}/app/camps/${c.slug}`}
                    className="block rounded-2xl bg-white border border-cream-border p-4 hover:-translate-y-0.5 transition"
                  >
                    <p className="font-bold text-ink">{c.name}</p>
                    <p className="text-xs text-muted">
                      Ages {c.ages_min}–{c.ages_max} · {c.price_tier}
                      {c.neighborhood && ` · ${c.neighborhood}`}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {(planType === 'activities' || planType === 'mix') && (
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-ink">{t('activitiesHeading')}</h3>
          {loading ? (
            <div className="space-y-2">
              <div className="h-16 rounded-2xl skeleton-shine-cream" />
              <div className="h-16 rounded-2xl skeleton-shine-cream" />
            </div>
          ) : activities.length === 0 ? (
            <div className="rounded-2xl bg-white border border-cream-border p-4 text-sm text-muted">
              {t('empty')}
              <div className="mt-2">
                <a
                  href={`/${locale}/app`}
                  className="text-xs font-semibold text-brand-purple hover:underline"
                >
                  Open the app →
                </a>
              </div>
            </div>
          ) : (
            <ul className="space-y-2">
              {activities.map((a) => (
                <li key={a.id}>
                  <a
                    href={a.website_url ?? '#'}
                    target={a.website_url ? '_blank' : undefined}
                    rel={a.website_url ? 'noopener noreferrer' : undefined}
                    className="block rounded-2xl bg-white border border-cream-border p-4 hover:-translate-y-0.5 transition"
                  >
                    <p className="font-bold text-ink">{a.name}</p>
                    <p className="text-xs text-muted">
                      Ages {a.ages_min}–{a.ages_max} · {a.cost_tier === 'free' ? 'Free' : a.cost_tier}
                      {a.neighborhood && ` · ${a.neighborhood}`}
                      {a.distance_miles != null && ` · 📍 ${a.distance_miles < 10 ? a.distance_miles.toFixed(1) : Math.round(a.distance_miles)} mi`}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}
