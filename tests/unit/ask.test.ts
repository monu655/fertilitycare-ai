import { describe, expect, it, vi } from "vitest";
import { activeProvider, callModel } from "@/lib/ai/provider";
import { knowledgeBase } from "@/features/ask/knowledge-base";
import { retrieve } from "@/features/ask/retrieve";
import { answerQuestion, classifyQuestion, redact } from "@/features/ask/service";
import { sourceById } from "@/data/evidence-library";

const kb = knowledgeBase();
const groqEnv = { AI_ENABLED: "true", GROQ_API_KEY: "test-groq-key-not-real" };

function groqReply(content: string) {
  return vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 }));
}
const asFetch = (f: unknown) => f as typeof fetch;

describe("knowledge base", () => {
  it("has many passages and every source id is verified", () => {
    expect(kb.length).toBeGreaterThan(20);
    for (const p of kb) {
      expect(p.sourceIds.length).toBeGreaterThan(0);
      for (const id of p.sourceIds) expect(sourceById(id)?.verified).toBe(true);
    }
    expect(new Set(kb.map((p) => p.id)).size).toBe(kb.length);
  });
});

describe("retrieve", () => {
  it("finds the right passage for everyday words", () => {
    expect(retrieve("Does smoking affect sperm?", kb)[0].id).toBe("insight-tobacco");
    expect(retrieve("what is a semen analysis", kb).some((p) => p.id.includes("semen") || p.id.includes("tests"))).toBe(true);
    expect(retrieve("can a sauna or laptop hurt", kb)[0].id).toBe("insight-heat");
    expect(retrieve("when should I see a doctor", kb).some((p) => p.id === "insight-when-to-see")).toBe(true);
  });
  it("returns nothing for unrelated questions", () => {
    expect(retrieve("what is the best pizza recipe", kb)).toEqual([]);
    expect(retrieve("??", kb)).toEqual([]);
  });
});

describe("classifyQuestion", () => {
  it("flags emergencies", () => {
    expect(classifyQuestion("I have sudden severe pain in my testicle")).toBe("urgent");
    expect(classifyQuestion("is this testicular torsion?")).toBe("urgent");
  });
  it("refuses diagnosis, prediction and dosing", () => {
    expect(classifyQuestion("Am I infertile?")).toBe("refused");
    expect(classifyQuestion("Will my wife get pregnant soon")).toBe("refused");
    expect(classifyQuestion("What dose should I take")).toBe("refused");
    expect(classifyQuestion("diagnose me please")).toBe("refused");
  });
  it("lets normal questions through", () => {
    expect(classifyQuestion("Does smoking affect sperm?")).toBe("ok");
  });
});

describe("redact", () => {
  it("removes emails and phone numbers", () => {
    expect(redact("mail me at a.b@example.com or call +91 98765 43210 about stress")).toBe("mail me at [removed] or call [removed] about stress");
  });
});

describe("provider", () => {
  it("picks a provider only when enabled and a key exists", () => {
    expect(activeProvider({})).toBeNull();
    expect(activeProvider({ AI_ENABLED: "true" })).toBeNull();
    expect(activeProvider({ AI_ENABLED: "false", GROQ_API_KEY: "k" })).toBeNull();
    expect(activeProvider(groqEnv)).toBe("groq");
    expect(activeProvider({ AI_ENABLED: "true", ANTHROPIC_API_KEY: "k" })).toBe("anthropic");
    expect(activeProvider({ AI_ENABLED: "true", AI_PROVIDER: "anthropic", GROQ_API_KEY: "k" })).toBeNull();
  });
  it("calls Groq with a bearer key and reads choices", async () => {
    const f = groqReply("hello");
    const out = await callModel({ system: "s", user: "u", maxTokens: 10 }, { env: groqEnv, fetchImpl: asFetch(f) });
    expect(out).toBe("hello");
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.groq.com/openai/v1/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer test-groq-key-not-real");
    expect(JSON.parse(String(init.body)).model).toBe("llama-3.3-70b-versatile");
  });
  it("returns null on errors", async () => {
    const bad = vi.fn(async () => new Response("no", { status: 401 }));
    expect(await callModel({ system: "s", user: "u", maxTokens: 10 }, { env: groqEnv, fetchImpl: asFetch(bad) })).toBeNull();
    const boom = vi.fn(async () => {
      throw new Error("down");
    });
    expect(await callModel({ system: "s", user: "u", maxTokens: 10 }, { env: groqEnv, fetchImpl: asFetch(boom) })).toBeNull();
  });
});

describe("answerQuestion", () => {
  const goodAnswer = JSON.stringify({
    answer: "Mayo Clinic notes that smoking may lower sperm count. The evidence is described as low quality, so please talk with a healthcare professional.",
    usedPassages: [1],
  });

  it("without consent or key it answers from sources and never calls the network", async () => {
    const f = groqReply(goodAnswer);
    const a = await answerQuestion("Does smoking affect sperm?", { aiConsent: false }, { env: groqEnv, fetchImpl: asFetch(f) });
    expect(a.mode).toBe("sources");
    expect(a.passages[0].id).toBe("insight-tobacco");
    const b = await answerQuestion("Does smoking affect sperm?", { aiConsent: true }, { env: {}, fetchImpl: asFetch(f) });
    expect(b.mode).toBe("sources");
    expect(f).not.toHaveBeenCalled();
  });

  it("uses a valid AI answer, with the sources it used", async () => {
    const f = groqReply(goodAnswer);
    const r = await answerQuestion("Does smoking affect sperm?", { aiConsent: true }, { env: groqEnv, fetchImpl: asFetch(f) });
    expect(r.mode).toBe("ai");
    expect(r.answer).toContain("smoking");
    expect(r.passages).toHaveLength(1);
    const body = JSON.parse(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body));
    expect(body.messages[1].content).toContain("Question: Does smoking affect sperm?");
  });

  it("removes an email from the question before sending it", async () => {
    const f = groqReply(goodAnswer);
    await answerQuestion("Does smoking affect sperm? mail me a@b.com", { aiConsent: true }, { env: groqEnv, fetchImpl: asFetch(f) });
    expect(String((f.mock.calls[0] as unknown as [string, RequestInit])[1].body)).not.toContain("a@b.com");
  });

  it("falls back to sources when the AI invents a number, breaks a rule, or cites nothing", async () => {
    const cases = [
      { answer: "About 40% of smokers have lower counts, so ask a healthcare professional soon.", usedPassages: [1] },
      { answer: "Smoking will cure itself if you stop, so there is no need to see a healthcare professional.", usedPassages: [1] },
      { answer: "Smoking may lower sperm count, so please talk with a healthcare professional soon.", usedPassages: [] },
      { answer: "Smoking may lower sperm count in 99 studies, so please talk with a healthcare professional.", usedPassages: [1] },
    ];
    for (const c of cases) {
      const r = await answerQuestion("Does smoking affect sperm?", { aiConsent: true }, { env: groqEnv, fetchImpl: asFetch(groqReply(JSON.stringify(c))) });
      expect(r.mode).toBe("sources");
    }
    const junk = await answerQuestion("Does smoking affect sperm?", { aiConsent: true }, { env: groqEnv, fetchImpl: asFetch(groqReply("not json")) });
    expect(junk.mode).toBe("sources");
  });

  it("never calls the AI for urgent, refused, or unanswerable questions", async () => {
    const f = groqReply(goodAnswer);
    const deps = { env: groqEnv, fetchImpl: asFetch(f) };
    expect((await answerQuestion("sudden severe pain in my testicle", { aiConsent: true }, deps)).kind).toBe("urgent");
    expect((await answerQuestion("Am I infertile?", { aiConsent: true }, deps)).kind).toBe("refused");
    expect((await answerQuestion("best pizza recipe in town", { aiConsent: true }, deps)).kind).toBe("no_answer");
    expect(f).not.toHaveBeenCalled();
  });
});
