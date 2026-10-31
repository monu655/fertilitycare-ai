import { describe, expect, it, vi } from "vitest";
import { generateAiNotes, minimalAnswers, passesSafetyChecks } from "@/lib/ai/service";

const env = { AI_ENABLED: "true", ANTHROPIC_API_KEY: "test-key-not-real" };
const answers = { ageRange: "30-34", tobacco: "never" };

function replyWith(text: string) {
  return vi.fn(async () => new Response(JSON.stringify({ content: [{ type: "text", text }] }), { status: 200 }));
}

const goodJson = JSON.stringify({
  summary: "Your answers cover lifestyle and history. This is general educational information, so please talk with a healthcare professional.",
  questions: ["Which tests would you suggest first?", "Should my partner be assessed too?"],
});

describe("generateAiNotes", () => {
  it("accepts a valid, safe reply", async () => {
    const f = replyWith(goodJson);
    const out = await generateAiNotes({ answers, aiConsent: true }, { env, fetchImpl: f as unknown as typeof fetch });
    expect(out?.questions).toHaveLength(2);
  });

  it("accepts JSON wrapped in a code fence", async () => {
    const f = replyWith("```json\n" + goodJson + "\n```");
    const out = await generateAiNotes({ answers, aiConsent: true }, { env, fetchImpl: f as unknown as typeof fetch });
    expect(out).not.toBeNull();
  });

  it("does not call the network without AI consent", async () => {
    const f = replyWith(goodJson);
    const out = await generateAiNotes({ answers, aiConsent: false }, { env, fetchImpl: f as unknown as typeof fetch });
    expect(out).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("does not call the network when disabled or key missing", async () => {
    const f = replyWith(goodJson);
    expect(await generateAiNotes({ answers, aiConsent: true }, { env: { AI_ENABLED: "false", ANTHROPIC_API_KEY: "k" }, fetchImpl: f as unknown as typeof fetch })).toBeNull();
    expect(await generateAiNotes({ answers, aiConsent: true }, { env: { AI_ENABLED: "true" }, fetchImpl: f as unknown as typeof fetch })).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("returns null for invalid JSON, wrong shape, or http errors", async () => {
    const deps = (f: unknown) => ({ env, fetchImpl: f as typeof fetch });
    expect(await generateAiNotes({ answers, aiConsent: true }, deps(replyWith("not json")))).toBeNull();
    expect(await generateAiNotes({ answers, aiConsent: true }, deps(replyWith('{"summary":"short"}')))).toBeNull();
    expect(await generateAiNotes({ answers, aiConsent: true }, deps(vi.fn(async () => new Response("no", { status: 500 }))))).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    const f = vi.fn(async () => {
      throw new Error("network down");
    });
    expect(await generateAiNotes({ answers, aiConsent: true }, { env, fetchImpl: f as unknown as typeof fetch })).toBeNull();
  });

  it("rejects replies with forbidden content", async () => {
    const bad = JSON.stringify({
      summary: "You are infertile and this plan is guaranteed to work. Please follow it carefully every day.",
      questions: ["Is there anything else?"],
    });
    const out = await generateAiNotes({ answers, aiConsent: true }, { env, fetchImpl: replyWith(bad) as unknown as typeof fetch });
    expect(out).toBeNull();
  });

  it("sends only coded answers, never name, email or free text", async () => {
    const f = replyWith(goodJson);
    await generateAiNotes({ answers, aiConsent: true }, { env, fetchImpl: f as unknown as typeof fetch });
    const body = JSON.parse(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    const userContent: string = body.messages[0].content;
    expect(userContent).toContain("30-34");
    expect(userContent).not.toMatch(/@|password|email/i);
    expect(userContent).not.toMatch(/"name"/i);
  });
});

describe("passesSafetyChecks", () => {
  it("blocks percentages, links and dosing advice", () => {
    const base = { summary: "x".repeat(30), questions: ["ok question here?"] };
    expect(passesSafetyChecks({ ...base, summary: "About 40% of men. " + "x".repeat(20) })).toBe(false);
    expect(passesSafetyChecks({ ...base, summary: "See https://example.com for more. " + "x".repeat(10) })).toBe(false);
    expect(passesSafetyChecks({ ...base, questions: ["Should I take 50 mg daily?"] })).toBe(false);
    expect(passesSafetyChecks(base)).toBe(true);
  });
});

describe("minimalAnswers", () => {
  it("drops free text, test numbers and unknown fields", () => {
    const out = minimalAnswers({
      context: { ageRange: "30-34", notes: "private words" },
      lifestyle: { tobacco: "never", exposures: ["heat"] },
      tests: { semenAnalysisDone: "yes", concentration: 12 },
    });
    expect(out).toEqual({ ageRange: "30-34", tobacco: "never", exposures: ["heat"], semenAnalysisDone: "yes" });
  });
});
