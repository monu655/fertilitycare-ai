import { describe, expect, it } from "vitest";
import { addDays, todayIso } from "@/lib/dates";
import { biomarkerSchema, habitEntrySchema } from "@/lib/validation/tracker";
import { MARKERS, markerByKey } from "@/features/medical/markers";
import { GOALS, suggestGoals } from "@/features/coach/goals";

const blank = { entryDate: todayIso(), sleepHours: "", bedtime: "", stress: "", mealPattern: "", fruitVeg: "", exerciseMinutes: "", heatMinutes: "", sittingHours: "" };

describe("habitEntrySchema", () => {
  it("accepts one value and leaves empty boxes undefined, not zero", () => {
    const r = habitEntrySchema.safeParse({ ...blank, sleepHours: "7.5" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.sleepHours).toBe(7.5);
      expect(r.data.stress).toBeUndefined();
    }
  });
  it("rejects an entry with no values", () => {
    expect(habitEntrySchema.safeParse(blank).success).toBe(false);
  });
  it("rejects future dates, out-of-range numbers and text", () => {
    expect(habitEntrySchema.safeParse({ ...blank, entryDate: addDays(todayIso(), 10), sleepHours: "7" }).success).toBe(false);
    expect(habitEntrySchema.safeParse({ ...blank, sleepHours: "30" }).success).toBe(false);
    expect(habitEntrySchema.safeParse({ ...blank, stress: "6" }).success).toBe(false);
    expect(habitEntrySchema.safeParse({ ...blank, sleepHours: "abc" }).success).toBe(false);
  });
});

describe("biomarkerSchema", () => {
  const ok = { takenOn: todayIso(), marker: "fsh", unit: "IU/L", value: "6", refLow: "", refHigh: "", notes: "" };
  it("accepts a value without any reference range", () => {
    const r = biomarkerSchema.safeParse(ok);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.refLow).toBeUndefined();
  });
  it("rejects an unknown marker, a wrong unit and a reversed range", () => {
    expect(biomarkerSchema.safeParse({ ...ok, marker: "made_up" }).success).toBe(false);
    expect(biomarkerSchema.safeParse({ ...ok, unit: "mL" }).success).toBe(false);
    expect(biomarkerSchema.safeParse({ ...ok, refLow: "10", refHigh: "2" }).success).toBe(false);
  });
  it("rejects negative values", () => {
    expect(biomarkerSchema.safeParse({ ...ok, value: "-1" }).success).toBe(false);
  });
});

describe("marker catalogue", () => {
  it("has no reference range of its own", () => {
    for (const m of MARKERS) {
      expect(Object.keys(m)).not.toContain("low");
      expect(Object.keys(m)).not.toContain("high");
      expect(Object.keys(m)).not.toContain("normalRange");
    }
    expect(markerByKey("total_testosterone")?.units.length).toBeGreaterThan(0);
  });
});

describe("goals", () => {
  it("suggests at most 3 goals and skips ones already chosen", () => {
    const s = suggestGoals(["sleep", "exercise", "nutrition"], ["bedtime_routine"]);
    expect(s.length).toBeLessThanOrEqual(3);
    expect(s.find((g) => g.key === "bedtime_routine")).toBeUndefined();
    expect(GOALS.length).toBeGreaterThan(5);
  });
  it("falls back to starter goals with no topics", () => {
    expect(suggestGoals([], []).length).toBeGreaterThan(0);
  });
});
