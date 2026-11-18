// Synthetic (made-up) answers for the demo account. They do NOT describe a real person.
// Same field names and option values as the real assessment, so the real rules engine can run on them.

export const DEMO_ANSWERS: Record<string, Record<string, unknown>> = {
  context: { ageRange: "35-39", generalHealth: "good", underCare: "no" },
  lifestyle: {
    tobacco: "former",
    alcohol: "8-14",
    activity: "light",
    sleep: "6-7",
    stress: "high",
    exposures: ["heat", "long_sitting"],
  },
  history: {
    previousConcern: "no",
    surgeryInjury: "no",
    chronicCondition: "no",
    medications: "no",
    previousAssessment: "no",
  },
  tests: { semenAnalysisDone: "yes", concentration: 15, motility: 38 },
};

// Demo is on only when DEMO_MODE is exactly "true".
export function demoEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.DEMO_MODE === "true";
}

// Two earlier made-up assessments, so the Progress page has something to compare.
// The test numbers go up AND down on purpose: the demo must not suggest that a habit "caused" a change.
export const DEMO_HISTORY: { daysAgo: number; answers: Record<string, Record<string, unknown>> }[] = [
  {
    daysAgo: 120,
    answers: {
      context: { ageRange: "35-39", generalHealth: "good", underCare: "no" },
      lifestyle: {
        tobacco: "current",
        alcohol: "15+",
        activity: "mostly_sitting",
        sleep: "under_6",
        stress: "high",
        exposures: ["heat", "long_sitting"],
      },
      history: { previousConcern: "no", surgeryInjury: "no", chronicCondition: "no", medications: "no", previousAssessment: "no" },
      tests: { semenAnalysisDone: "yes", concentration: 14, motility: 36 },
    },
  },
  {
    daysAgo: 60,
    answers: {
      context: { ageRange: "35-39", generalHealth: "good", underCare: "no" },
      lifestyle: {
        tobacco: "former",
        alcohol: "8-14",
        activity: "light",
        sleep: "under_6",
        stress: "high",
        exposures: ["heat", "long_sitting"],
      },
      history: { previousConcern: "no", surgeryInjury: "no", chronicCondition: "no", medications: "no", previousAssessment: "no" },
      tests: { semenAnalysisDone: "yes", concentration: 11, motility: 33 },
    },
  },
];

// Made-up daily entries for the demo. Some days are left out on purpose, and some boxes are empty, like real life.
// Deterministic (no randomness) so tests and videos are repeatable. Day 0 is today.
export function demoHabitEntries(): {
  daysAgo: number;
  sleepHours: number | null;
  bedtimeMinutes: number | null;
  stress: number | null;
  mealPattern: "mostly_home" | "mixed" | "mostly_packaged" | null;
  fruitVeg: number | null;
  exerciseMinutes: number | null;
  sittingHours: number | null;
  heatMinutes: number | null;
}[] {
  const meals = ["mostly_home", "mixed", "mostly_packaged", "mixed"] as const;
  const rows = [];
  for (let d = 0; d < 28; d++) {
    if (d % 6 === 5) continue; // a day with no entry
    rows.push({
      daysAgo: d,
      sleepHours: d % 9 === 4 ? null : 5.5 + ((d * 7) % 5) * 0.5 + (d < 14 ? 0.5 : 0),
      bedtimeMinutes: d % 7 === 3 ? null : 22 * 60 + 30 + ((d * 25) % 90),
      stress: 2 + ((d * 3) % 4),
      mealPattern: meals[d % 4],
      fruitVeg: d % 5 === 2 ? null : 1 + (d % 4),
      exerciseMinutes: d % 3 === 0 ? 0 : 15 + ((d * 10) % 40),
      sittingHours: 6 + (d % 4),
      heatMinutes: d % 8 === 1 ? 20 : d % 8 === 5 ? 10 : 0,
    });
  }
  return rows;
}

// Made-up lab values. No reference ranges are filled in, because the app never supplies ranges of its own.
export const DEMO_LABS: { daysAgo: number; marker: string; value: number; unit: string; notes: string }[] = [
  { daysAgo: 120, marker: "semen_volume", value: 2.5, unit: "mL", notes: "Synthetic demo value" },
  { daysAgo: 30, marker: "semen_volume", value: 3.1, unit: "mL", notes: "Synthetic demo value" },
  { daysAgo: 120, marker: "sperm_concentration", value: 28, unit: "million per mL", notes: "Synthetic demo value" },
  { daysAgo: 30, marker: "sperm_concentration", value: 33, unit: "million per mL", notes: "Synthetic demo value" },
  { daysAgo: 30, marker: "total_testosterone", value: 18, unit: "nmol/L", notes: "Synthetic demo value" },
  { daysAgo: 30, marker: "fsh", value: 6, unit: "IU/L", notes: "Synthetic demo value" },
  { daysAgo: 30, marker: "lh", value: 5, unit: "IU/L", notes: "Synthetic demo value" },
];
