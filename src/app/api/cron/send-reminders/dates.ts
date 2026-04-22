function addDays(d: Date, n: number): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + n));
  return x.toISOString().slice(0, 10);
}

export function computeReminderWindow(today: Date = new Date()) {
  return { d3: addDays(today, 3), d7: addDays(today, 7), d14: addDays(today, 14) };
}
