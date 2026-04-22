import { useTranslations } from 'next-intl';
import { countdownColor, daysUntil } from '@/lib/countdown';

export type ClosureCardProps = {
  closure: { id: string; name: string; start_date: string; end_date: string; emoji: string };
  today?: Date;
};

function breakBadge(start: string, end: string) {
  const days = daysUntil(end, new Date(start + 'T00:00:00Z')) + 1;
  if (days >= 30) return 'summer';
  if (days >= 5) return 'longBreak';
  if (days >= 3) return 'threeDayWeekend';
  return null;
}

const colorClasses = {
  emerald: 'bg-success/20 text-success',
  amber: 'bg-amber-400/20 text-amber-200',
  gray: 'bg-white/10 text-white/70',
};

export function ClosureCard({ closure, today }: ClosureCardProps) {
  const t = useTranslations();
  const days = daysUntil(closure.start_date, today);
  const color = colorClasses[countdownColor(days)];
  const badge = breakBadge(closure.start_date, closure.end_date);

  const countdown =
    days === 0 ? t('home.countdown.today')
    : days === 1 ? t('home.countdown.tomorrow')
    : t('home.countdown.days', { days });

  return (
    <article className="rounded-2xl bg-white/10 backdrop-blur p-6 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-5xl" aria-hidden="true">{closure.emoji}</span>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${color}`}>{countdown}</span>
      </div>
      <h3 className="text-xl font-bold">{closure.name}</h3>
      <p className="text-sm text-white/70">
        {new Date(closure.start_date).toLocaleDateString()} – {new Date(closure.end_date).toLocaleDateString()}
      </p>
      {badge && (
        <span className="text-xs inline-block w-fit bg-cta-yellow/20 text-cta-yellow px-2 py-0.5 rounded-full">
          {t(`closure.badge.${badge}`)}
        </span>
      )}
    </article>
  );
}
