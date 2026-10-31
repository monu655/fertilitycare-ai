import { AiNotesSchema, type AiNotes } from "@/lib/insights/schema";
import { callModel, extractJson, type ModelDeps } from "./provider";

// Server-side AI service. It is OFF unless all of these are true:
//  - AI_ENABLED=true and a Groq or Anthropic key is set (server environment only, never sent to the browser)
//  - the user gave the separate AI-processing consent
// On any failure it returns null and the page shows the fixed, source-based insights instead.

export type AiAnswers = Record<string, string | string[]>;

type Deps = ModelDeps;

// Things the model must never say. Checked on the way out as well as stated in the prompt.
const FORBIDDEN: RegExp[] = [
  /\byou(?:'re| are| have)\s+(?:infertile|sterile|azoosperm\w*|oligosperm\w*)/i,
  /\bguarantee/i,
  /\b(?:will|can)\s+(?:cure|fix|restore)\b/i,
  /\bprescrib/i,
  /\b(?:take|start|stop|increase|reduce|decrease)\s+(?:\d+\s?(?:mg|mcg|iu)\b|your (?:medication|medicine|tablets))/i,
  /\d+\s?%/,
  /https?:\/\//i,
  /\bet al\b/i,
];

// True when the text contains something the model must never say.
export function violatesSafety(text: string): boolean {
  return FORBIDDEN.some((re) => re.test(text));
}

export function passesSafetyChecks(notes: AiNotes): boolean {
  return !violatesSafety([notes.summary, ...notes.questions].join(" "));
}

const SYSTEM_PROMPT = [
  "You write short educational notes for an adult about male reproductive health.",
  "Rules you must follow:",
  "- Do not diagnose. Never say the person is or may be infertile or has any condition.",
  "- Do not prescribe or suggest medicines, doses or supplements.",
  "- Do not promise or predict fertility or pregnancy outcomes, and give no statistics, percentages or risk scores.",
  "- Do not cite studies, authors or links. Sources are added separately by the application.",
  "- Say plainly when information is missing or evidence is uncertain.",
  "- Encourage speaking with a qualified healthcare professional.",
  'Reply with JSON only, in exactly this shape: {"summary": string (under 600 characters), "questions": string[] (2 to 5 questions the person could ask a healthcare professional)}.',
].join("\n");

export async function generateAiNotes(
  input: { answers: AiAnswers; aiConsent: boolean },
  deps: Deps = {},
): Promise<AiNotes | null> {
  // No consent, no call. The provider layer also returns null when AI is off or no key is set.
  if (!input.aiConsent) return null;

  const text = await callModel(
    {
      system: SYSTEM_PROMPT,
      user: `Coded answers from an optional self-reported assessment (no names or free text):\n${JSON.stringify(input.answers)}`,
      maxTokens: 600,
    },
    deps,
  );
  if (!text) return null;

  const json = extractJson(text);
  if (json === null) return null;
  const parsed = AiNotesSchema.safeParse(json);
  if (!parsed.success) return null;
  if (!passesSafetyChecks(parsed.data)) return null;
  return parsed.data;
}

// Only coded choices are sent. Free-text notes, test values, name and email never leave the server.
export function minimalAnswers(responses: Record<string, Record<string, unknown>>): AiAnswers {
  const out: AiAnswers = {};
  const take = (section: string, keys: string[]) => {
    for (const k of keys) {
      const v = responses[section]?.[k];
      if (typeof v === "string") out[k] = v;
      else if (Array.isArray(v)) out[k] = v.filter((x): x is string => typeof x === "string");
    }
  };
  take("context", ["ageRange", "generalHealth", "underCare"]);
  take("lifestyle", ["tobacco", "alcohol", "activity", "sleep", "stress", "exposures"]);
  take("history", ["previousConcern", "surgeryInjury", "chronicCondition", "medications", "previousAssessment"]);
  take("tests", ["semenAnalysisDone"]);
  return out;
}
