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
