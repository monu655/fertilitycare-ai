// The daily numbers the Lifestyle Tracker records. One list drives the form, the validation, the charts and the summaries,
// so they cannot drift apart. Safe to import from browser code.

export type MetricKey = "sleepHours" | "stress" | "exerciseMinutes" | "fruitVeg" | "heatMinutes" | "sittingHours";

export type Metric = {
  key: MetricKey;
  label: string;
  short: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  hint?: string;
};

export const METRICS: Metric[] = [
  { key: "sleepHours", label: "Sleep last night", short: "Sleep", unit: "hours", min: 0, max: 24, step: 0.25 },
  { key: "stress", label: "Stress today (your own rating)", short: "Stress", unit: "1 to 5", min: 1, max: 5, step: 1, hint: "1 is low, 5 is high." },
  { key: "exerciseMinutes", label: "Exercise or planned physical activity", short: "Exercise", unit: "minutes", min: 0, max: 600, step: 5 },
  { key: "fruitVeg", label: "Fruit and vegetable portions", short: "Fruit and veg", unit: "portions", min: 0, max: 20, step: 1 },
  { key: "heatMinutes", label: "Heat exposure (hot tub, sauna, hot bath, heated seat)", short: "Heat exposure", unit: "minutes", min: 0, max: 600, step: 5 },
  { key: "sittingHours", label: "Time spent sitting", short: "Sitting", unit: "hours", min: 0, max: 24, step: 0.5 },
];

export const MEAL_PATTERNS = [
  { value: "mostly_home", label: "Mostly home-cooked meals" },
  { value: "mixed", label: "A mix" },
  { value: "mostly_packaged", label: "Mostly packaged or takeaway" },
] as const;

export function metricByKey(key: string): Metric | undefined {
  return METRICS.find((m) => m.key === key);
}

export function mealLabel(value: string | null | undefined): string {
  return MEAL_PATTERNS.find((m) => m.value === value)?.label ?? "Not recorded";
}

// "23:30" <-> minutes after midnight
export function bedtimeToMinutes(text: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

export function minutesToBedtime(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
