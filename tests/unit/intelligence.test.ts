import { describe, expect, it, vi } from "vitest";
import { addDays } from "@/lib/dates";
import type { HabitEntry } from "@/features/tracker/analysis";
import type { Biomarker } from "@/features/medical/queries";
import { buildPatternInsights, ruleOverview, ruleQuestions } from "@/features/intelligence/engine";
import { checkIntelligenceReply, generateIntelligence, inventedNumbers, violatesJudgement } from "@/lib/ai/intelligence";

const TODAY = "2026-11-18";
const entry = (d: number, over: Partial<HabitEntry> = {}): HabitEntry => ({
  id: `e${d}`, date: addDays(TODAY, -d), sleepHours: 6.5, bedtimeMinutes: 1400, stress: 3, mealPattern: "mixed", fruitVeg: 2,
  exerciseMinutes: 20, sittingHours: 8, heatMinutes: 0, ...over,
});
const many = Array.from({ length: 12 }, (_, i) => entry(i));
const labs: Biomarker[] = [{ id: "b1", takenOn: "2026-10-01", marker: "fsh", value: 6, unit: "IU/L", refLow: null, refHigh: null, notes: "private note" }];

describe("pattern engine", () => {
  it("describes patterns only when there are enough recorded days", () => {
    const few = buildPatternInsights({ entries: [entry(0), entry(1)], today: TODAY, responses: null, biomarkers: [] });
    expect(few.insights).toHaveLength(0);
    expect(few.notes.length).toBeGreaterThan(0);
    const out = buildPatternInsights({ entries: many, today: TODAY, responses: null, biomarkers: [] });
    expect(out.insights.map((i) => i.id)).toContain("sleep");
  });

  it("gives every insight all six required parts", () => {
    const out = buildPatternInsights({ entries: many, today: TODAY, responses: null, biomarkers: labs });
    for (const i of out.insights) {
      expect(i.observation.length).toBeGreaterThan(10);
      expect(i.supportingData.length).toBeGreaterThan(0);
      expect(i.explanation.length).toBeGreaterThan(10);
      expect(i.suggestions.length).toBeGreaterThan(0);
      expect(i.limitations.length).toBeGreaterThan(10);
      expect(i.whenToConsult.length).toBeGreaterThan(10);
    }
  });

  it("leaves labs out unless biomarkers are passed in", () => {
    const without = buildPatternInsights({ entries: many, today: TODAY, responses: null, biomarkers: [] });
    expect(without.insights.flatMap((i) => i.supportingData).some((f) => f.group === "labs")).toBe(false);
    const withLabs = buildPatternInsights({ entries: many, today: TODAY, responses: null, biomarkers: labs });
    expect(withLabs.insights.flatMap((i) => i.supportingData).some((f) => f.group === "labs")).toBe(true);
  });

  it("never puts dates or free-text notes into the facts", () => {
    const out = buildPatternInsights({ entries: many, today: TODAY, responses: null, biomarkers: labs });
    const text = out.insights.flatMap((i) => i.supportingData.map((f) => f.text)).join(" ");
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(text).not.toMatch(/private note/);
  });

  it("does not use judging or diagnosing wording", () => {
    const out = buildPatternInsights({ entries: many, today: TODAY, responses: null, biomarkers: labs });
    const all = [ruleOverview(out), ...ruleQuestions(out.insights), ...out.insights.flatMap((i) => [i.observation, ...i.suggestions, i.limitations, i.whenToConsult])].join(" ");
    expect(all).not.toMatch(/\b(abnormal|you are infertile|you have (?:a )?(?:low|poor)|diagnos(?:is|ed) as)\b/i);
  });
});

describe("AI reply checks", () => {
  const facts = ["Average sleep: 6.5 hours (12 days recorded)"];
  const good = JSON.stringify({
    overview: "You recorded sleep on 12 days with an average of 6.5 hours. A healthcare professional can explain what this means for you in context.",
    questions: ["What does my sleep record tell you?", "Which tests would you suggest first?", "Should I keep tracking?"],
  });

  it("accepts a reply whose numbers all come from the sent facts", () => {
    const r = checkIntelligenceReply(good, facts);
    expect(r.ok).toBe(true);
    expect(r.checks.every((c) => c.status === "passed")).toBe(true);
  });
  it("rejects invented numbers", () => {
    const bad = good.replace("6.5", "5.2");
    const r = checkIntelligenceReply(bad, facts);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("invented_number");
    expect(inventedNumbers("It was 9 hours", facts)).toEqual([9]);
  });
  it("rejects wording that calls a change good or bad", () => {
    expect(violatesJudgement("Your sleep got better")).toBe(true);
    const r = checkIntelligenceReply(good.replace("A healthcare professional can explain", "This is an improvement. A healthcare professional can explain"), facts);
    expect(r.ok).toBe(false);
  });
  it("rejects unsafe wording and bad format", () => {
    const unsafe = good.replace("What does my sleep record tell you?", "You are infertile, take 50 mg of this medicine");
    expect(checkIntelligenceReply(unsafe, facts).ok).toBe(false);
    const r = checkIntelligenceReply("not json at all", facts);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(["bad_json", "bad_shape"]).toContain(r.reason);
  });
});

describe("generateIntelligence", () => {
  const env = { AI_ENABLED: "true", GROQ_API_KEY: "test-groq-key-not-real" };
  const reply = (content: string) =>
    vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 }));
  const facts = ["Average sleep: 6.5 hours (12 days recorded)"];

  it("makes no network call without tracking-data consent", async () => {
    const f = reply("{}");
    const r = await generateIntelligence({ facts, consent: false }, { env, fetchImpl: f as unknown as typeof fetch });
    expect(f).not.toHaveBeenCalled();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("no_consent");
  });
  it("makes no network call when there is nothing to send", async () => {
    const f = reply("{}");
    const r = await generateIntelligence({ facts: [], consent: true }, { env, fetchImpl: f as unknown as typeof fetch });
    expect(f).not.toHaveBeenCalled();
    if (!r.ok) expect(r.reason).toBe("no_data");
  });
  it("sends only the facts given, with no email, name or date", async () => {
    const f = reply(JSON.stringify({ overview: "x".repeat(60), questions: ["a?", "b?", "c?"] }));
    await generateIntelligence({ facts, consent: true }, { env, fetchImpl: f as unknown as typeof fetch });
    expect(f).toHaveBeenCalledTimes(1);
    const calls = f.mock.calls as unknown as [string, { body: string }][];
    const body = calls[0][1].body;
    expect(body).toContain("6.5 hours");
    expect(body).not.toMatch(/@|\d{4}-\d{2}-\d{2}/);
  });
  it("falls back when AI is not configured", async () => {
    const f = reply("{}");
    const r = await generateIntelligence({ facts, consent: true }, { env: {}, fetchImpl: f as unknown as typeof fetch });
    expect(f).not.toHaveBeenCalled();
    expect(r.ok).toBe(false);
  });
  it("falls back when the provider fails", async () => {
    const f = vi.fn(async () => new Response("boom", { status: 500 }));
    const r = await generateIntelligence({ facts, consent: true }, { env, fetchImpl: f as unknown as typeof fetch });
    expect(r.ok).toBe(false);
  });
});
