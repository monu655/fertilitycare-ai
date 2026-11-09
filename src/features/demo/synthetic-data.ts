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
