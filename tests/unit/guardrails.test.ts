import { describe, expect, it } from "vitest";
import { GUARDRAIL_CASES } from "@/features/trust/guardrail-cases";
import { runGuardrails } from "@/features/trust/evaluate";

describe("guardrail cases", () => {
  const results = runGuardrails();

  it("has a good spread of cases with unique ids", () => {
    expect(GUARDRAIL_CASES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(GUARDRAIL_CASES.map((c) => c.id)).size).toBe(GUARDRAIL_CASES.length);
    expect(new Set(GUARDRAIL_CASES.map((c) => c.kind))).toEqual(new Set(["question", "reply", "redact"]));
  });

  // One test per case, so a failure names the exact case.
  for (const r of results.filter((x) => !x.knownGap)) {
    it(`${r.id}: ${r.input.slice(0, 60)} -> ${r.expected}`, () => {
      expect(r.actual).toBe(r.expected);
    });
  }

  it("lists known gaps openly, and they really are gaps today", () => {
    const gaps = results.filter((r) => r.knownGap);
    expect(gaps.length).toBeGreaterThan(0);
    // If someone fixes a gap, this fails on purpose: move that case out of "Known gaps".
    for (const g of gaps) expect(g.passed).toBe(false);
  });
});
