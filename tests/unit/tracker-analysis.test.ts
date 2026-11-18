import { describe, expect, it } from "vitest";
import { addDays } from "@/lib/dates";
import { bedtimeSpread, comparePeriods, inRange, monthlySummaries, periodStats, weeklySummaries, type HabitEntry } from "@/features/tracker/analysis";

const TODAY = "2026-11-18";
const e = (daysAgo: number, over: Partial<HabitEntry> = {}): HabitEntry => ({
  id: `e${daysAgo}`,
  date: addDays(TODAY, -daysAgo),
  sleepHours: null,
  bedtimeMinutes: null,
  stress: null,
  mealPattern: null,
  fruitVeg: null,
  exerciseMinutes: null,
  sittingHours: null,
  heatMinutes: null,
  ...over,
});

describe("periodStats", () => {
  it("averages only recorded values and never treats empty as zero", () => {
    const stats = periodStats([e(0, { sleepHours: 6 }), e(1, { sleepHours: 8 }), e(2, {})]);
    const sleep = stats.find((s) => s.key === "sleepHours")!;
    expect(sleep.average).toBe(7);
    expect(sleep.recorded).toBe(2);
    expect(stats.find((s) => s.key === "stress")!.average).toBeNull();
  });
});

describe("comparePeriods", () => {
  it("compares the latest 14 days with the 14 before and states only numbers", () => {
    const entries = [0, 1, 2, 3].map((d) => e(d, { sleepHours: 7 })).concat([14, 15, 16].map((d) => e(d, { sleepHours: 6 })));
    const sleep = comparePeriods(entries, TODAY, 14).find((c) => c.key === "sleepHours")!;
    expect(sleep.current).toBe(7);
    expect(sleep.previous).toBe(6);
    expect(sleep.enough).toBe(true);
    expect(Object.keys(sleep)).not.toContain("verdict");
  });

  it("says there is not enough data when a period has fewer than 3 recorded days", () => {
    const entries = [e(0, { sleepHours: 7 }), e(1, { sleepHours: 7 }), e(15, { sleepHours: 6 })];
    expect(comparePeriods(entries, TODAY, 14).find((c) => c.key === "sleepHours")!.enough).toBe(false);
  });
});

describe("bedtimeSpread", () => {
  it("needs at least 3 nights", () => {
    expect(bedtimeSpread([e(0, { bedtimeMinutes: 1380 }), e(1, { bedtimeMinutes: 1400 })])).toBeNull();
  });
  it("counts times after midnight as late, not early", () => {
    const r = bedtimeSpread([e(0, { bedtimeMinutes: 23 * 60 }), e(1, { bedtimeMinutes: 30 }), e(2, { bedtimeMinutes: 23 * 60 + 30 })]);
    expect(r).toEqual({ minutes: 90, nights: 3 });
  });
});

describe("summaries", () => {
  it("builds weekly and monthly buckets with logged-day counts", () => {
    const entries = [0, 1, 2, 8, 9, 40].map((d) => e(d, { stress: 3 }));
    const weeks = weeklySummaries(entries, TODAY, 4);
    expect(weeks.reduce((a, w) => a + w.daysLogged, 0)).toBe(5);
    const months = monthlySummaries(entries, TODAY, 3);
    expect(months.reduce((a, m) => a + m.daysLogged, 0)).toBe(6);
  });
  it("inRange is inclusive", () => {
    expect(inRange([e(0), e(5), e(10)], addDays(TODAY, -5), TODAY)).toHaveLength(2);
  });
});
