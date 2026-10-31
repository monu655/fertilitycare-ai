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
  tests: { semenAnalysisDone: "no" },
};

// Demo is on only when DEMO_MODE is exactly "true".
export function demoEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.DEMO_MODE === "true";
}
