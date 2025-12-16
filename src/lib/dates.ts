export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseISODateUTC(date: string): Date {
  // Expect YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("Invalid date format. Expected YYYY-MM-DD.");
  }

  const d = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    throw new Error("Invalid date.");
  }

  return d;
}

export function toISODateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDaysUTC(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/**
 * Returns the start of week (UTC midnight) for the given date.
 * `weekStartsOn`: 0 = Sunday, 1 = Monday, ...
 */
export function startOfWeekUTC(date: Date, weekStartsOn: number = 1): Date {
  const d = new Date(date);
  // normalize to UTC midnight
  d.setUTCHours(0, 0, 0, 0);

  const day = d.getUTCDay(); // 0..6
  const diff = (day - weekStartsOn + 7) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d;
}
