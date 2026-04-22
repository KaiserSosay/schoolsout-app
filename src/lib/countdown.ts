export function daysUntil(date: string | Date, now: Date = new Date()): number {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00Z') : date;
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

export function countdownColor(days: number): 'emerald' | 'amber' | 'gray' {
  if (days <= 7) return 'emerald';
  if (days <= 30) return 'amber';
  return 'gray';
}
