'use client';

import { useTranslations } from 'next-intl';
import { KidForm, type KidState, type School, blankKid } from './KidForm';

// DECISION: Shared "Your kids" section. Wraps the privacy callout, the count
// pill selector, the KidForm list, and the "+ Add another kid" button. Both
// onboarding and settings render this exact section — single source of truth
// for how kids are managed in the UI.

export function KidsManagementSection({
  kids,
  kidCount,
  onCountChange,
  onKidChange,
  onAddKid,
  onDeleteKid,
  schools,
  suggestedIds,
  showCountPills = true,
  showAddButton = true,
  privacyNamespace = 'app.onboarding.privacy',
}: {
  kids: KidState[];
  kidCount: number;
  onCountChange: (next: number) => void;
  onKidChange: (idx: number, patch: Partial<KidState>) => void;
  onAddKid?: () => void;
  onDeleteKid?: (idx: number) => void;
  schools: School[];
  suggestedIds: string[];
  showCountPills?: boolean;
  showAddButton?: boolean;
  privacyNamespace?: 'app.onboarding.privacy' | 'app.settings.privacy';
}) {
  const t = useTranslations('app.onboarding');
  const tPriv = useTranslations(privacyNamespace);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-brand-purple/20 bg-purple-soft/30 p-4 flex gap-3">
        <div className="shrink-0 text-2xl" aria-hidden>
          🔒
        </div>
        <div>
          <p className="mb-1 font-bold text-ink">{tPriv('title')}</p>
          <p className="text-sm leading-relaxed text-muted">{tPriv('body')}</p>
        </div>
      </div>

      {showCountPills ? (
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-muted">
            {t('labels.kidCount')}
          </label>
          <div className="mt-2 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n === kidCount;
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onCountChange(n)}
                  className={
                    'h-10 w-10 rounded-full text-sm font-black transition-colors ' +
                    (active
                      ? 'bg-brand-purple text-white'
                      : 'bg-white border border-cream-border text-ink hover:border-brand-purple/40')
                  }
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-5">
        {kids.slice(0, kidCount).map((kid, idx) => (
          <KidForm
            key={idx}
            kid={kid}
            ordinal={idx + 1}
            schools={schools}
            suggestedIds={suggestedIds}
            onChange={(patch) => onKidChange(idx, patch)}
            onDelete={
              onDeleteKid && kidCount > 1 ? () => onDeleteKid(idx) : undefined
            }
          />
        ))}
      </div>

      {showAddButton && onAddKid && kidCount < 5 ? (
        <AddAnotherButton onAddKid={onAddKid} />
      ) : null}
    </section>
  );
}

function AddAnotherButton({ onAddKid }: { onAddKid: () => void }) {
  const t = useTranslations('app.settings.sections.kids');
  return (
    <button
      type="button"
      onClick={onAddKid}
      className="w-full rounded-2xl border border-dashed border-brand-purple/40 bg-white px-4 py-4 text-sm font-bold text-brand-purple hover:bg-purple-soft"
    >
      {t('addAnother')}
    </button>
  );
}

export { blankKid };
export type { KidState, School };
