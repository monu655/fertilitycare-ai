import { z } from "zod";
import { callModelDetailed, extractJson, type ModelDeps } from "./provider";
import { violatesSafety } from "./service";

// The AI half of "AI Fertility Intelligence". It may only rewrite the numbers the rules engine already worked out.
// It is OFF unless the server has AI switched on AND the person gave the separate "AI tracking data" consent.
// Every reply is checked: right format, no diagnosis/medicine/prediction wording, no number that was not in the data it was given,
// and no good-or-bad wording about a change. If any check fails, the app shows the plain rules text instead.

export const IntelligenceSchema = z.object({
  overview: z.string().min(40).max(900),
  questions: z.array(z.string().min(8).max(220)).min(3).max(6),
});
export type IntelligenceNotes = z.infer<typeof IntelligenceSchema>;

// Wording that calls a change good or bad, or that grades a value. Not allowed in an AI reply.
const JUDGEMENT: RegExp[] = [
  /\b(improv\w*|worsen\w*|deteriorat\w*|better|worse|healthier|unhealthy|poor)\b/i,
  /\b(abnormal|within (?:the )?normal|outside (?:the )?normal|normal range|low sperm count|concerning|alarming|worrying)\b/i,
  /\b(you should|you must|you need to)\b/i,
];

export function violatesJudgement(text: string): boolean {
  return JUDGEMENT.some((re) => re.test(text));
}

export function numbersIn(text: string): number[] {
  return (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
}

// Every number in the reply must appear in the data that was sent.
export function inventedNumbers(reply: string, sentFacts: string[]): number[] {
  const allowed = new Set(sentFacts.flatMap((f) => numbersIn(f)));
  return numbersIn(reply).filter((n) => !allowed.has(n));
}

export type IntelligenceCheck = { id: string; label: string; status: "passed" | "failed" | "skipped" };

export type IntelligenceResult =
  | { ok: true; notes: IntelligenceNotes; checks: IntelligenceCheck[] }
  | { ok: false; reason: string; checks: IntelligenceCheck[] };

const LABELS = {
  format: "Reply is in the expected format",
  safety: "No diagnosis, medicine, dosing or prediction wording",
  numbers: "Every number comes from the data you chose to share",
  judgement: "No wording that calls a change good or bad",
};

// Runs the four checks on raw model text. Pure, so it can be tested without any AI service.
export function checkIntelligenceReply(text: string, sentFacts: string[]): IntelligenceResult {
  const checks: IntelligenceCheck[] = [
    { id: "format", label: LABELS.format, status: "skipped" },
    { id: "safety", label: LABELS.safety, status: "skipped" },
    { id: "numbers", label: LABELS.numbers, status: "skipped" },
    { id: "judgement", label: LABELS.judgement, status: "skipped" },
  ];
  const set = (id: string, ok: boolean) => {
    const c = checks.find((x) => x.id === id)!;
    c.status = ok ? "passed" : "failed";
  };

  const json = extractJson(text);
  const parsed = json === null ? null : IntelligenceSchema.safeParse(json);
  if (!parsed || !parsed.success) {
    set("format", false);
    return { ok: false, reason: json === null ? "bad_json" : "bad_shape", checks };
  }
  set("format", true);

  const all = [parsed.data.overview, ...parsed.data.questions].join(" ");
  const safe = !violatesSafety(all);
  set("safety", safe);
  if (!safe) return { ok: false, reason: "unsafe", checks };

  const invented = inventedNumbers(all, sentFacts);
  set("numbers", invented.length === 0);
  if (invented.length > 0) return { ok: false, reason: "invented_number", checks };

  const judged = violatesJudgement(all);
  set("judgement", !judged);
  if (judged) return { ok: false, reason: "judgement", checks };

  return { ok: true, notes: parsed.data, checks };
}

export const INTELLIGENCE_SYSTEM_PROMPT = [
  "You help an adult prepare to talk with a healthcare professional about male reproductive health.",
  "You are given a short list of facts that the person recorded themselves. They contain no names, dates or notes.",
  "Rules you must follow:",
  "- Only describe patterns in the facts you are given. Use the numbers exactly as written. Never add, round, convert or calculate any other number.",
  "- Do not diagnose. Never say the person is or may be infertile or has any condition. Do not predict fertility or pregnancy outcomes.",
  "- Never call any change good, bad, better, worse, improved, normal or abnormal. Say a number changed or stayed the same, nothing more.",
  "- Do not say one habit causes a result. These are only things recorded around the same time.",
  "- Do not suggest medicines, supplements or doses. Do not tell the person what they must do.",
  "- Do not cite studies or links. Say plainly that a healthcare professional should interpret everything.",
  'Reply with JSON only, in exactly this shape: {"overview": string (60 to 800 characters, plain language), "questions": string[] (3 to 6 questions the person could ask a healthcare professional)}.',
].join("\n");

export async function generateIntelligence(
  input: { facts: string[]; consent: boolean },
  deps: ModelDeps = {},
): Promise<IntelligenceResult | { ok: false; reason: string; checks: IntelligenceCheck[] }> {
  const skipped = (reason: string) => ({
    ok: false as const,
    reason,
    checks: Object.entries(LABELS).map(([id, label]) => ({ id, label, status: "skipped" as const })),
  });
  // No consent, no call. The provider layer also says "ai_off" when AI is not switched on or has no key.
  if (!input.consent) return skipped("no_consent");
  if (input.facts.length === 0) return skipped("no_data");

  const result = await callModelDetailed(
    {
      system: INTELLIGENCE_SYSTEM_PROMPT,
      user: `Facts the person recorded and chose to share:\n${input.facts.map((f) => `- ${f}`).join("\n")}`,
      maxTokens: 900,
      json: true,
    },
    deps,
  );
  if (!result.ok) return skipped(result.reason);
  return checkIntelligenceReply(result.text, input.facts);
}
