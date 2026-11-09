"use server";

import { z } from "zod";
import { requireUser } from "@/lib/session";
import { rateLimit } from "@/lib/security/rate-limit";
import { fieldErrors } from "@/lib/validation/auth";
import { sourceById } from "@/data/evidence-library";
import { consentState } from "@/features/privacy/queries";
import { MAX_QUESTION_LENGTH } from "./constants";
import { answerQuestion, type AskKind, type DataReceipt, type SafetyCheck } from "./service";

// What the browser receives. Source links are built on the server from the evidence library.
export type AskView = {
  kind: AskKind;
  mode: "ai" | "sources" | "none";
  message: string;
  answer?: string;
  fallbackReason?: string;
  checks?: SafetyCheck[];
  receipt?: DataReceipt;
  passages: {
    id: string;
    topic: string;
    text: string;
    sources: { id: string; title: string; organization: string; url: string }[];
  }[];
};

export type AskState = {
  errors?: Record<string, string>;
  message?: string;
  question?: string;
  result?: AskView;
};

const questionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(5, "Write a little more, at least 5 characters.")
    .max(MAX_QUESTION_LENGTH, `Keep your question under ${MAX_QUESTION_LENGTH} characters.`),
});

export async function askAction(_prev: AskState, formData: FormData): Promise<AskState> {
  const user = await requireUser();
  const raw = formData.get("question");
  const question = typeof raw === "string" ? raw : "";

  const parsed = questionSchema.safeParse({ question });
  if (!parsed.success) return { errors: fieldErrors(parsed.error), question };

  if (!rateLimit(`ask:${user.id}`, 20, 60 * 60 * 1000).ok) {
    return { message: "You have asked many questions in a short time. Please try again later.", question };
  }

  // The question itself is never saved. Only the answer shown on screen exists, and it disappears on reload.
  const consent = await consentState(user.id);
  const result = await answerQuestion(parsed.data.question, { aiConsent: consent.ai });

  return {
    question,
    result: {
      kind: result.kind,
      mode: result.mode,
      message: result.message,
      answer: result.answer,
      fallbackReason: result.fallbackReason,
      checks: result.checks,
      receipt: result.receipt,
      passages: result.passages.map((p) => ({
        id: p.id,
        topic: p.topic,
        text: p.text,
        sources: p.sourceIds
          .map((id) => sourceById(id))
          .filter((s): s is NonNullable<typeof s> => Boolean(s && s.verified))
          .map((s) => ({ id: s.id, title: s.title, organization: s.organization, url: s.url })),
      })),
    },
  };
}
