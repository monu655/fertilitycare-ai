// Small date helpers. Dates are plain "YYYY-MM-DD" text (no time zone surprises).

const DAY = 86_400_000;

export function isIsoDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function dayNumber(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00Z`).getTime() / DAY);
}

export function addDays(iso: string, days: number): string {
  return new Date((dayNumber(iso) + days) * DAY).toISOString().slice(0, 10);
}

// Monday of the week that contains this date.
export function weekStart(iso: string): string {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((dow + 6) % 7));
}

const SHORT = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const LONG = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

export const shortDate = (iso: string) => SHORT.format(new Date(`${iso}T00:00:00Z`));
export const longDate = (iso: string) => LONG.format(new Date(`${iso}T00:00:00Z`));
export const monthLabel = (iso: string) => MONTH.format(new Date(`${iso}T00:00:00Z`));
