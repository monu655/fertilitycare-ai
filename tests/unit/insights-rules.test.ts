import { describe, expect, it } from "vitest";
import { buildInsights } from "@/lib/insights/rules";
import { InsightSchema, validateInsights } from "@/lib/insights/schema";
import { SOURCES, sourceById } from "@/data/evidence-library";

const heavy = {
  context: { ageRange: "40-44" },
  lifestyle: { tobacco: "current", alcohol: "15+", activity: "mostly_sitting", sleep: "under_6", stress: "high" },
  history: { medications: "yes", chronicCondition: "yes" },
  tests: { semenAnalysisDone: "yes", concentration: 3, motility: 10 },
};

const FORBIDDEN_TEXT = [/you are infertile/i, /you have (?:azoosperm|oligosperm)/i, /guarantee/i, /\d+\s?%/];

describe("evidence library", () => {
  it("only has https links and unique ids", () => {
    const ids = new Set(SOURCES.map((s) => s.id));
    expect(ids.size).toBe(SOURCES.length);
    for (const s of SOURCES) expect(s.url.startsWith("https://")).toBe(true);
  });
});

describe("buildInsights", () => {
  it("returns schema-valid insights whose sources all exist and are verified", () => {
    const insights = buildInsights(heavy);
    expect(insights.length).toBeGreaterThan(3);
    for (const i of insights) {
      expect(InsightSchema.safeParse(i).success).toBe(true);
      expect(i.sourceIds.length).toBeGreaterThan(0);
      for (const id of i.sourceIds) expect(sourceById(id)?.verified).toBe(true);
    }
    expect(validateInsights(insights)).toHaveLength(insights.length);
  });

  it("never uses diagnosis, guarantee or percentage language", () => {
    for (const i of buildInsights(heavy)) {
      const text = JSON.stringify(i);
      for (const re of FORBIDDEN_TEXT) expect(text).not.toMatch(re);
    }
  });

  it("does not change its wording when test numbers change", () => {
    const low = buildInsights({ ...heavy, tests: { semenAnalysisDone: "yes", concentration: 1, motility: 1 } });
    const high = buildInsights({ ...heavy, tests: { semenAnalysisDone: "yes", concentration: 90, motility: 90 } });
    // "reported" only echoes what the user typed. Everything else must be identical.
    const strip = (list: ReturnType<typeof buildInsights>) =>
      JSON.stringify(list.map((i) => ({ ...i, reported: undefined })));
    expect(strip(low)).toBe(strip(high));
  });

  it("gives a general insight and an honest note when answers are sparse", () => {
    const insights = buildInsights({ context: { ageRange: "25-29" } });
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.every((i) => !i.personal || i.reported.length > 0)).toBe(true);
  });

  it("has unique insight ids", () => {
    const ids = buildInsights(heavy).map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
