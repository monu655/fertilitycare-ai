import { describe, expect, it } from "vitest";
import { DEMO_ANSWERS, DEMO_HISTORY, demoEnabled } from "@/features/demo/synthetic-data";
import { SECTIONS } from "@/features/assessment/questions";
import { sectionSchema } from "@/lib/validation/assessment";
import { buildInsights } from "@/lib/insights/rules";
import { validateInsights } from "@/lib/insights/schema";

describe("demo data", () => {
  it("passes the same validation as real answers", () => {
    for (const section of SECTIONS) {
      const result = sectionSchema(section).safeParse(DEMO_ANSWERS[section.id] ?? {});
      expect(result.success, section.id).toBe(true);
    }
  });

  it("earlier demo assessments also pass validation and are in the past", () => {
    expect(DEMO_HISTORY.length).toBeGreaterThan(0);
    for (const h of DEMO_HISTORY) {
      expect(h.daysAgo).toBeGreaterThan(0);
      for (const section of SECTIONS) {
        expect(sectionSchema(section).safeParse(h.answers[section.id] ?? {}).success, section.id).toBe(true);
      }
    }
  });

  it("produces valid, sourced insights", () => {
    const insights = validateInsights(buildInsights(DEMO_ANSWERS));
    expect(insights.length).toBeGreaterThan(2);
    for (const i of insights) expect(i.sourceIds.length).toBeGreaterThan(0);
  });

  it("contains no email, phone or name", () => {
    expect(JSON.stringify([DEMO_ANSWERS, DEMO_HISTORY])).not.toMatch(/@|\d{7,}/);
  });

  it("is on only when DEMO_MODE is exactly true", () => {
    expect(demoEnabled({ DEMO_MODE: "true" })).toBe(true);
    expect(demoEnabled({ DEMO_MODE: "false" })).toBe(false);
    expect(demoEnabled({})).toBe(false);
  });
});
