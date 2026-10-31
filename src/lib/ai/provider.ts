// One place that talks to an AI company. Two are supported: Groq and Anthropic.
// Keys come from the SERVER environment only. They are never sent to the browser or written to the database.
//
//   AI_ENABLED=true
//   AI_PROVIDER=groq            (optional; if missing we use whichever key is set, Groq first)
//   GROQ_API_KEY=...            ANTHROPIC_API_KEY=...
//   GROQ_MODEL / ANTHROPIC_MODEL (optional)

export type Env = Record<string, string | undefined>;
export type ProviderName = "groq" | "anthropic";

export type ModelRequest = {
  system: string;
  user: string;
  maxTokens: number;
  // The deadline for the whole request. Defaults to 15 seconds.
  timeoutMs?: number;
  // Ask the provider for a JSON-only reply (Groq supports this and it makes replies more reliable).
  json?: boolean;
};

// Why a call did not produce text. A short code only: never the question, the answer or the key.
export type ModelResult = { ok: true; text: string } | { ok: false; reason: string };

export type ModelDeps = { fetchImpl?: typeof fetch; env?: Env };

// Groq retires models from time to time. If this name stops working, set GROQ_MODEL in the .env file.
export const DEFAULT_GROQ_MODEL = "openai/gpt-oss-120b";
export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5-5";

// Which provider is usable right now? null means AI is off.
export function activeProvider(env: Env = process.env): ProviderName | null {
  if (env.AI_ENABLED !== "true") return null;
  const wanted = env.AI_PROVIDER?.toLowerCase();
  if (wanted === "groq") return env.GROQ_API_KEY ? "groq" : null;
  if (wanted === "anthropic") return env.ANTHROPIC_API_KEY ? "anthropic" : null;
  if (env.GROQ_API_KEY) return "groq";
  if (env.ANTHROPIC_API_KEY) return "anthropic";
  return null;
}

// Sends one question. Returns the model's text, or a short reason code when anything goes wrong.
export async function callModelDetailed(req: ModelRequest, deps: ModelDeps = {}): Promise<ModelResult> {
  const env = deps.env ?? process.env;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const provider = activeProvider(env);
  if (!provider) return { ok: false, reason: "ai_off" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? 15_000);
  try {
    if (provider === "groq") {
      const groqModel = env.GROQ_MODEL ?? DEFAULT_GROQ_MODEL;
      const thinkingModel = groqModel.startsWith("openai/gpt-oss");
      const res = await fetchImpl("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: groqModel,
          // "gpt-oss" models think before they answer, and that thinking uses up tokens too.
          // So they get more room and a low thinking effort, otherwise the answer can come back empty.
          max_tokens: thinkingModel ? Math.max(req.maxTokens, 1500) : req.maxTokens,
          temperature: 0.2, // low = steadier, less inventive answers
          ...(thinkingModel ? { reasoning_effort: "low" } : {}),
          ...(req.json ? { response_format: { type: "json_object" } } : {}),
          messages: [
            { role: "system", content: req.system },
            { role: "user", content: req.user },
          ],
        }),
      });
      if (!res.ok) return { ok: false, reason: `http_${res.status}` };
      const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
      const text = data.choices?.[0]?.message?.content;
      return text ? { ok: true, text } : { ok: false, reason: "empty_reply" };
    }

    const res = await fetchImpl("https://api.anthropic.com/v1/messages", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY as string,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: env.ANTHROPIC_MODEL ?? DEFAULT_ANTHROPIC_MODEL,
        max_tokens: req.maxTokens,
        system: req.system,
        messages: [{ role: "user", content: req.user }],
      }),
    });
    if (!res.ok) return { ok: false, reason: `http_${res.status}` };
    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((c) => c.type === "text")?.text;
    return text ? { ok: true, text } : { ok: false, reason: "empty_reply" };
  } catch (error) {
    return { ok: false, reason: error instanceof Error && error.name === "AbortError" ? "timeout" : "network" };
  } finally {
    clearTimeout(timer);
  }
}

// Same call, but returns only the text (or null on any problem). Used where the reason is not needed.
export async function callModel(req: ModelRequest, deps: ModelDeps = {}): Promise<string | null> {
  const result = await callModelDetailed(req, deps);
  return result.ok ? result.text : null;
}

// Pulls the outermost {...} out of a reply (models sometimes wrap JSON in a code fence).
export function extractJson(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}