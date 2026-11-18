import { describe, expect, it } from "vitest";
import { exportAsText } from "@/features/privacy/export-text";
import { buildInsights } from "@/lib/insights/rules";

type Data = Parameters<typeof exportAsText>[0];

const data = {
  exportedAt: "2026-10-29T08:00:00.000Z",
  note: "x",
  account: { id: "u1", email: "a@example.com", name: "Asha", createdAt: new Date("2026-10-27T08:00:00Z") },
  consents: [{ purpose: "HEALTH_ASSESSMENT", granted: true, version: "v1", createdAt: new Date("2026-10-27T09:00:00Z") }],
  assessments: [
    {
      id: "a1",
      status: "SUBMITTED",
      createdAt: new Date(),
      submittedAt: new Date("2026-10-27T10:00:00Z"),
      answers: { context: { ageRange: "40-44" }, lifestyle: { tobacco: "current" } },
    },
  ],
  insights: buildInsights({ context: { ageRange: "40-44" }, lifestyle: { tobacco: "current" } }).map((i) => ({
    assessmentId: "a1",
    topic: i.topic,
    source: "rules",
    content: i,
  })),
  dailyEntries: [{ date: "2026-11-01", sleepHours: 7, bedtimeMinutes: 1410, stress: 3, mealPattern: "mostly_home", fruitVegPortions: 3, exerciseMinutes: 30, sittingHours: 6, heatMinutes: null }],
  labValues: [{ takenOn: "2026-10-20", marker: "fsh", value: 6, unit: "IU/L", labRangeLow: null, labRangeHigh: null, notes: "typed by me" }],
  weeklyGoals: [{ weekStart: "2026-11-16", goal: "move_daily", targetDays: 3, daysDone: 2 }],
  consultationQuestions: [{ assessmentId: "a1", questions: ["Is my sleep a concern?"] }],
  activityLog: [{ action: "account.created", createdAt: new Date("2026-10-27T08:00:00Z") }],
} as unknown as Data;

describe("exportAsText", () => {
  const text = exportAsText(data);

  it("includes daily entries, lab values and weekly goals", () => {
    expect(text).toContain("2026-11-01: sleep 7 hours, bedtime 23:30");
    expect(text).toContain("fsh 6 IU/L");
    expect(text).toContain("move daily - 2 of 3 days");
  });

  it("is written as plain sentences, not code", () => {
    expect(text).toContain("YOUR ACCOUNT");
    expect(text).toContain("Email: a@example.com");
    expect(text).toContain("Health assessment consent - Given");
    expect(text).toContain("40 to 44");
    expect(text).toContain("Is my sleep a concern?");
    expect(text).toContain("Account created");
    expect(text).not.toMatch(/[{}\[\]]"|":/);
  });

  it("never includes password data", () => {
    expect(text).not.toMatch(/password_?hash|\$2[aby]\$/i);
  });

  it("lists insights with their limits", () => {
    expect(text).toContain("Tobacco and sperm health");
    expect(text).toContain("Limits:");
  });
});
