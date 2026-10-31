import { describe, expect, it } from "vitest";
import { SECTIONS, sectionByStep } from "@/features/assessment/questions";
import { consentSchema, formToObject, sectionSchema } from "@/lib/validation/assessment";

const context = sectionByStep(2)!;
const lifestyle = sectionByStep(3)!;
const tests = sectionByStep(5)!;

function form(entries: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (Array.isArray(v)) v.forEach((x) => fd.append(k, x));
    else fd.append(k, v);
  }
  return fd;
}

describe("assessment validation (server rules)", () => {
  it("requires the age range", () => {
    const r = sectionSchema(context).safeParse(formToObject(context, form({})));
    expect(r.success).toBe(false);
  });

  it("accepts only the age range and leaves everything else optional", () => {
    const r = sectionSchema(context).safeParse(formToObject(context, form({ ageRange: "30-34" })));
    expect(r.success).toBe(true);
  });

  it("rejects a value that is not one of the allowed options", () => {
    const r = sectionSchema(context).safeParse(formToObject(context, form({ ageRange: "17" })));
    expect(r.success).toBe(false);
  });

  it("drops fields that were not declared (no extra data can be stored)", () => {
    const fd = form({ ageRange: "30-34", isAdmin: "true" });
    const r = sectionSchema(context).safeParse(formToObject(context, fd));
    expect(r.success).toBe(true);
    if (r.success) expect(Object.keys(r.data)).not.toContain("isAdmin");
  });

  it("treats empty test values as not provided, never as zero or abnormal", () => {
    const r = sectionSchema(tests).safeParse(formToObject(tests, form({ concentration: "", motility: "" })));
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.concentration).toBeUndefined();
      expect(r.data.motility).toBeUndefined();
    }
  });

  it("rejects out-of-range and non-numeric test values", () => {
    expect(sectionSchema(tests).safeParse(formToObject(tests, form({ motility: "150" }))).success).toBe(false);
    expect(sectionSchema(tests).safeParse(formToObject(tests, form({ motility: "-5" }))).success).toBe(false);
    expect(sectionSchema(tests).safeParse(formToObject(tests, form({ concentration: "abc" }))).success).toBe(false);
  });

  it("rejects text longer than the limit", () => {
    const r = sectionSchema(tests).safeParse(formToObject(tests, form({ testNotes: "x".repeat(501) })));
    expect(r.success).toBe(false);
  });

  it("accepts several checkbox choices and rejects unknown ones", () => {
    expect(sectionSchema(lifestyle).safeParse(formToObject(lifestyle, form({ exposures: ["heat", "long_sitting"] }))).success).toBe(true);
    expect(sectionSchema(lifestyle).safeParse(formToObject(lifestyle, form({ exposures: ["bogus"] }))).success).toBe(false);
  });

  it("every section offers a way to decline sensitive questions", () => {
    for (const s of SECTIONS) {
      for (const f of s.fields.filter((x) => x.kind === "radio")) {
        expect(f.options!.some((o) => o.value === "prefer_not" || o.value === "not_sure")).toBe(true);
      }
    }
  });
});

describe("consent validation", () => {
  it("requires the health consent box", () => {
    expect(consentSchema.safeParse({}).success).toBe(false);
    expect(consentSchema.safeParse({ consentHealth: "on" }).success).toBe(true);
  });

  it("AI consent is optional", () => {
    expect(consentSchema.safeParse({ consentHealth: "on", consentAi: "on" }).success).toBe(true);
  });
});
