// Plain arithmetic on the person's own daily entries. No judgement and no AI: averages, counts and period comparisons.
// Safe to import from browser code.

import { addDays, monthLabel, shortDate, weekStart } from "@/lib/dates";
import { METRICS, type MetricKey } from "./metrics";

export type HabitEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  sleepHours: number | null;
  bedtimeMinutes: number | null;
  stress: number | null;
  mealPattern: string | null;
  fruitVeg: number | null;
  exerciseMinutes: number | null;
  sittingHours: number | null;
  heatMinutes: number | null;
};

export const round1 = (n: number) => Math.round(n * 10) / 10;

export function average(values: number[]): number | null {
  return values.length === 0 ? null : round1(values.reduce((a, b) => a + b, 0) / values.length);
}

export function valuesOf(entries: HabitEntry[], key: MetricKey): number[] {
  return entries.map((e) => e[key]).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
}

export function inRange(entries: HabitEntry[], from: string, to: string): HabitEntry[] {
  return entries.filter((e) => e.date >= from && e.date <= to);
}

export type PeriodStat = { key: MetricKey; label: string; unit: string; average: number | null; recorded: number };

export function periodStats(entries: HabitEntry[]): PeriodStat[] {
  return METRICS.map((m) => {
    const v = valuesOf(entries, m.key);
    return { key: m.key, label: m.short, unit: m.unit, average: average(v), recorded: v.length };
  });
}

// How much the bedtime moved around, in minutes. Times after midnight count as late, not as early morning.
export function bedtimeSpread(entries: HabitEntry[]): { minutes: number; nights: number } | null {
  const times = entries
    .map((e) => e.bedtimeMinutes)
    .filter((v): v is number => typeof v === "number")
    .map((m) => (m < 12 * 60 ? m + 24 * 60 : m));
  if (times.length < 3) return null;
  return { minutes: Math.max(...times) - Math.min(...times), nights: times.length };
}

export type Comparison = {
  key: MetricKey;
  label: string;
  unit: string;
  previous: number | null;
  current: number | null;
  previousRecorded: number;
  currentRecorded: number;
  enough: boolean; // at least 3 recorded days in each period
};

// Latest N days against the N days before them. Only describes the numbers, never says better or worse.
export function comparePeriods(entries: HabitEntry[], today: string, days = 14): Comparison[] {
  const curFrom = addDays(today, -(days - 1));
  const prevTo = addDays(curFrom, -1);
  const prevFrom = addDays(prevTo, -(days - 1));
  const cur = periodStats(inRange(entries, curFrom, today));
  const prev = periodStats(inRange(entries, prevFrom, prevTo));
  return METRICS.map((m, i) => ({
    key: m.key,
    label: m.short,
    unit: m.unit,
    previous: prev[i].average,
    current: cur[i].average,
    previousRecorded: prev[i].recorded,
    currentRecorded: cur[i].recorded,
    enough: prev[i].recorded >= 3 && cur[i].recorded >= 3,
  }));
}

export type BucketSummary = {
  label: string;
  from: string;
  daysLogged: number;
  stats: Record<MetricKey, number | null>;
  heatDays: number;
};

function summarise(label: string, from: string, group: HabitEntry[]): BucketSummary {
  const stats = {} as Record<MetricKey, number | null>;
  for (const m of METRICS) stats[m.key] = average(valuesOf(group, m.key));
  return {
    label,
    from,
    daysLogged: group.length,
    stats,
    heatDays: group.filter((e) => (e.heatMinutes ?? 0) > 0).length,
  };
}

// Newest first. Weeks run Monday to Sunday.
export function weeklySummaries(entries: HabitEntry[], today: string, weeks = 8): BucketSummary[] {
  const thisWeek = weekStart(today);
  const out: BucketSummary[] = [];
  for (let i = 0; i < weeks; i++) {
    const from = addDays(thisWeek, -7 * i);
    const group = inRange(entries, from, addDays(from, 6));
    out.push(summarise(`Week of ${shortDate(from)}`, from, group));
  }
  return out;
}

export function monthlySummaries(entries: HabitEntry[], today: string, months = 6): BucketSummary[] {
  const out: BucketSummary[] = [];
  let y = Number(today.slice(0, 4));
  let m = Number(today.slice(5, 7));
  for (let i = 0; i < months; i++) {
    const from = `${y}-${String(m).padStart(2, "0")}-01`;
    const to = `${y}-${String(m).padStart(2, "0")}-31`; // string compare works for any real day of the month
    out.push(summarise(monthLabel(from), from, inRange(entries, from, to)));
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return out;
}
