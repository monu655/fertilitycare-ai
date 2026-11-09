import { describe, expect, it, vi } from "vitest";
import { answerQuestion } from "@/features/ask/service";

const groqEnv = { AI_ENABLED: "true", GROQ_API_KEY: "test-groq-key-not-real" };
const reply = (content: string) =>
  vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 })) as unknown as typeof fetch;
const ask = (q: string, f: typeof fetch, aiConsent = true) => answerQuestion(q, { aiConsent }, { env: groqEnv, fetchImpl: f });

const good = JSON.stringify({
  answer: "Mayo Clinic notes that smoking may lower sperm count. The evidence is low quality, so please talk with a healthcare professional.",
  usedPassages: [1],
});

describe("safety checks", () => {
  it("shows every check as passed for a good AI answer", async () => {
    const r = await ask("Does smoking affect sperm?", reply(good));
    expect(r.mode).toBe("ai");
    expect(r.checks?.map((c) => c.status)).toEqual(["passed", "passed", "passed", "passed"]);
  });

  it("marks the failing check and skips the ones after it", async () => {
    const unsafe = JSON.stringify({ answer: "Smoking will cure itself if you stop, so there is no need to see a healthcare professional.", usedPassages: [1] });
    const r = await ask("Does smoking affect sperm?", reply(unsafe));
    expect(r.mode).toBe("sources");
    expect(r.checks?.map((c) => c.status)).toEqual(["passed", "passed", "failed", "skipped"]);

    const bad = await ask("Does smoking affect sperm?", reply("not json"));
    expect(bad.checks?.map((c) => c.status)).toEqual(["failed", "skipped", "skipped", "skipped"]);
  });

  it("has no checks when the provider gave no reply", async () => {
    const down = vi.fn(async () => new Response("no", { status: 401 })) as unknown as typeof fetch;
    const r = await ask("Does smoking affect sperm?", down);
    expect(r.checks).toBeUndefined();
    expect(r.receipt?.sentToAi).toBe(true);
  });
});

describe("data receipt", () => {
  it("says nothing was sent without consent or key", async () => {
    const f = reply(good);
    expect((await ask("Does smoking affect sperm?", f, false)).receipt).toEqual({ sentToAi: false });
    expect((await answerQuestion("Does smoking affect sperm?", { aiConsent: true }, { env: {}, fetchImpl: f })).receipt).toEqual({ sentToAi: false });
  });

  it("lists exactly what was sent and says when personal details were removed", async () => {
    const f = reply(good);
    const r = await ask("Does smoking affect sperm? mail me a@b.com", f);
    expect(r.receipt?.provider).toBe("Groq");
    expect(r.receipt?.question).not.toContain("a@b.com");
    expect(r.receipt?.removedDetails).toBe(true);
    expect(r.receipt?.passageTopics?.length).toBeGreaterThan(0);
    // The receipt matches the real request body.
    const body = String((f as unknown as { mock: { calls: [string, RequestInit][] } }).mock.calls[0][1].body);
    expect(body).toContain(r.receipt!.question!);
  });
});
