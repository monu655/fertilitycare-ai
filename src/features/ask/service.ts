import { z } from "zod";
import { callModelDetailed, activeProvider, extractJson, type ModelDeps } from "@/lib/ai/provider";
import { violatesSafety } from "@/lib/ai/service";
import { MAX_QUESTION_LENGTH } from "./constants";
import { knowledgeBase, type Passage } from "./knowledge-base";
import { retrieve } from "./retrieve";

// Answers questions ONLY from the knowledge base (named, verified sources).
//  - No key or no consent: the person gets the matching source passages, nothing leaves the server.
//  - With a key and the AI consent: the model rewrites an answer from those passages. We check the
//    answer, and if anything looks wrong we show the plain passages instead.

export type AskKind = "answer" | "no_answer" | "urgent" | "refused";

export type AskResult = {
  kind: AskKind;
  mode: "ai" | "sources" | "none";
  message: string;
  answer?: string;
  passages: Passage[];
  // Set when the AI was tried but its answer was not used. A short code, never any content.
  fallbackReason?: string;
};


// Sudden severe testicle pain is an emergency: no AI, just clear urgent guidance.
const URGENT = [
  /\btorsion\b/i,
  /\btwisted (?:testicle|testis|ball)/i,
  /(?:severe|sudden|intense|unbearable|sharp).{0,40}pain.{0,40}(?:testic|testis|scrot|\bball|groin)/i,
  /(?:testic|testis|scrot|\bball|groin).{0,40}(?:severe|sudden|intense|unbearable|sharp).{0,30}pain/i,
  /(?:chest pain|can'?t breathe|suicid|kill myself)/i,
];

// Diagnosis, predictions and treatment advice are not what this app does.
const REFUSE = [
  /\b(?:am i|do i have|do i suffer|could i be|might i be|is it possible (?:that )?i am)\b.{0,50}(?:infertil|sterile|azoosperm|oligosperm|low sperm|sperm problem)/i,
  /\bdiagnos/i,
  /what(?:'s| is) wrong with me/i,
  /\b(?:will|can|would) (?:i|we|my wife|my partner) (?:get|have|become|conceive|be able)/i,
  /\b(?:chance|chances|probability|odds) of (?:pregnan|conceiv|having a (?:baby|child))/i,
  /\b(?:how many|what) (?:mg|dose|dosage)\b/i,
  /\b(?:which|what) (?:medicine|medication|tablet|tablets|supplement|supplements|drug|drugs)\b.{0,30}\b(?:should i|to) (?:take|use|buy)/i,
  /\bprescri/i,
  /\b(?:cure|treat) my\b/i,
];

export function classifyQuestion(question: string): "urgent" | "refused" | "ok" {
  if (URGENT.some((re) => re.test(question))) return "urgent";
  if (REFUSE.some((re) => re.test(question))) return "refused";
  return "ok";
}

// People may type an email or phone number by mistake. Remove those before anything is sent to an AI company.
export function redact(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[removed]")
    .replace(/\+?\d[\d\s().-]{6,}\d/g, "[removed]");
}

// Models sometimes write passage numbers as "1" or "Passage 1". We accept both and ignore anything else.
const AnswerSchema = z.object({
  answer: z.string().trim().max(1200),
  usedPassages: z
    .array(z.union([z.number(), z.string()]))
    .max(10)
    .optional()
    .default([])
    .transform((items) =>
      items
        .map((item) => (typeof item === "number" ? item : Number.parseInt(String(item).replace(/\D/g, ""), 10)))
        .filter((n) => Number.isInteger(n)),
    ),
});

const SYSTEM_PROMPT = [
  "You answer a question from an adult about male reproductive health.",
  "Use ONLY the numbered passages you are given. If they do not answer the question, reply with an empty answer.",
  "Rules you must follow:",
  "- Do not diagnose. Never say the person is or may be infertile or has any condition.",
  "- Do not prescribe or suggest medicines, doses or supplements.",
  "- Do not promise or predict fertility or pregnancy outcomes.",
  "- Do not add facts, numbers, studies, authors or links that are not in the passages.",
  "- Say plainly when the passages show that evidence is limited or sources disagree.",
  "- Write in simple, calm language, in at most 6 sentences.",
  "- Finish by encouraging the person to speak with a qualified healthcare professional.",
  'Reply with JSON only: {"answer": string, "usedPassages": number[]} where usedPassages lists the passage numbers you used.',
].join("\n");

const numbersIn = (text: string) => text.match(/\d+(?:\.\d+)?/g) ?? [];

// Every number in the answer must already appear in the passages (stops invented statistics).
function numbersAreGrounded(answer: string, passages: Passage[]): boolean {
  const source = passages.map((p) => `${p.topic} ${p.text}`).join(" ");
  return numbersIn(answer).every((n) => source.includes(n));
}

export async function answerQuestion(
  question: string,
  options: { aiConsent: boolean },
  deps: ModelDeps = {},
  passagesOverride?: Passage[],
): Promise<AskResult> {
  const clean = question.trim().slice(0, MAX_QUESTION_LENGTH);
  const kind = classifyQuestion(clean);
  const kb = passagesOverride ?? knowledgeBase();

  if (kind === "urgent") {
    return {
      kind: "urgent",
      mode: "none",
      message:
        "This could be an emergency. Sudden, severe pain in a testicle needs urgent care: go to the nearest emergency department straight away, or call your local emergency number. If you feel unsafe or are thinking of harming yourself, contact your local emergency service now. Do not wait for an online answer.",
      passages: kb.filter((p) => p.id === "care-urgent"),
    };
  }

  if (kind === "refused") {
    return {
      kind: "refused",
      mode: "none",
      message:
        "This app cannot diagnose, predict fertility or pregnancy outcomes, or advise on medicines and doses. Only a qualified healthcare professional can do that after talking with you. I can explain general information from the sources, or help you prepare questions for an appointment.",
      passages: [],
    };
  }

  const found = retrieve(clean, kb, 3);
  if (found.length === 0) {
    return {
      kind: "no_answer",
      mode: "none",
      message:
        "I could not find this in the sources I have, so I will not guess. Try different words, browse the Health Resources, or ask a healthcare professional.",
      passages: [],
    };
  }

  // Try the AI only if it is switched on, a key exists, and the person gave the separate AI consent.
  let fallbackReason: string | undefined;
  if (options.aiConsent && activeProvider(deps.env ?? process.env)) {
    const numbered = found.map((p, i) => `[${i + 1}] ${p.topic}: ${p.text}`).join("\n");
    const reply = await callModelDetailed(
      { system: SYSTEM_PROMPT, user: `Question: ${redact(clean)}\n\nPassages:\n${numbered}`, maxTokens: 500, json: true },
      deps,
    );

    if (!reply.ok) {
      fallbackReason = reply.reason; // for example http_401, http_429, timeout, network
    } else {
      const json = extractJson(reply.text);
      if (json === null) {
        fallbackReason = "bad_json";
      } else {
        const parsed = AnswerSchema.safeParse(json);
        if (!parsed.success) fallbackReason = "bad_shape";
        else if (parsed.data.answer.length < 20) fallbackReason = "too_short";
        else if (violatesSafety(parsed.data.answer)) fallbackReason = "unsafe";
        else if (!numbersAreGrounded(parsed.data.answer, found)) fallbackReason = "invented_number";
        else {
          // If the model names valid passages we show those. If it names none, we show all that were searched.
          const used = [...new Set(parsed.data.usedPassages)].filter((n) => n >= 1 && n <= found.length);
          return {
            kind: "answer",
            mode: "ai",
            message: "AI-assisted answer, checked against the sources below.",
            answer: parsed.data.answer,
            passages: used.length > 0 ? used.map((n) => found[n - 1]) : found,
          };
        }
      }
    }
    // The reason is a short code. It is shown on screen and never contains the question or the answer.
  }

  return {
    kind: "answer",
    mode: "sources",
    message: "Here is what the sources say about your question.",
    passages: found,
    fallbackReason,
  };
}