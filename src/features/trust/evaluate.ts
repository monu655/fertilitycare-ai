import { checkReply, classifyQuestion, redact } from "@/features/ask/service";
import { knowledgeBase } from "@/features/ask/knowledge-base";
import { retrieve } from "@/features/ask/retrieve";
import { GUARDRAIL_CASES, type GuardrailCase } from "./guardrail-cases";

export type GuardrailResult = {
  id: string;
  kind: "question" | "reply" | "redact";
  group: string;
  input: string;
  note?: string;
  expected: string;
  actual: string;
  passed: boolean;
  knownGap: boolean;
};

// Runs every case against the REAL code. No network, no AI. Same code the app uses on each question.
export function runGuardrails(cases: GuardrailCase[] = GUARDRAIL_CASES): GuardrailResult[] {
  const passages = retrieve("Does smoking affect sperm?", knowledgeBase(), 3);

  return cases.map((c): GuardrailResult => {
    if (c.kind === "question") {
      const actual = classifyQuestion(c.input);
      return { id: c.id, kind: c.kind, group: c.group, input: c.input, expected: c.expect, actual, passed: actual === c.expect, knownGap: Boolean(c.knownGap) };
    }
    if (c.kind === "reply") {
      const result = checkReply(c.input, passages);
      const failed = result.checks.find((x) => x.status === "failed")?.id ?? "none";
      return { id: c.id, kind: c.kind, group: c.group, input: c.input, note: c.note, expected: c.expect, actual: failed, passed: failed === c.expect, knownGap: Boolean(c.knownGap) };
    }
    const cleaned = redact(c.input);
    const passed = !cleaned.includes(c.mustNotContain);
    return { id: c.id, kind: c.kind, group: c.group, input: c.input, expected: "removed", actual: passed ? "removed" : "still there", passed, knownGap: false };
  });
}
