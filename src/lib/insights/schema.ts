import { z } from "zod";
import { sourceById } from "@/data/evidence-library";

export const InsightSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1).max(120),
  // "educational" = general information, "professional" = worth discussing with a healthcare professional
  kind: z.enum(["educational", "professional"]),
  // true when the insight depends on the user's own answers
  personal: z.boolean(),
  reported: z.array(z.string().max(300)),
  explanation: z.string().min(1).max(1500),
  whyItMatters: z.string().min(1).max(800),
  nextSteps: z.array(z.string().min(1).max(300)).max(5),
  whenToConsult: z.string().min(1).max(500),
  strength: z.enum(["general", "mixed", "limited"]),
  sourceIds: z.array(z.string()),
  limitations: z.string().min(1).max(600),
});

export type Insight = z.infer<typeof InsightSchema>;

// The AI service may only add a short summary and questions. It may NOT add sources or risk numbers.
export const AiNotesSchema = z.object({
  summary: z.string().min(20).max(700),
  questions: z.array(z.string().min(5).max(200)).min(1).max(6),
});

export type AiNotes = z.infer<typeof AiNotesSchema>;

// Every insight must point only to sources that exist in our verified library.
export function validateInsights(items: unknown[]): Insight[] {
  const out: Insight[] = [];
  for (const item of items) {
    const parsed = InsightSchema.safeParse(item);
    if (!parsed.success) continue;
    const insight = parsed.data;
    const allKnown = insight.sourceIds.every((id) => {
      const s = sourceById(id);
      return s !== undefined && s.verified && s.url.startsWith("https://");
    });
    if (allKnown) out.push(insight);
  }
  return out;
}
