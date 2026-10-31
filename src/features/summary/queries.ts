import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { SECTIONS, optionLabel, type SectionId } from "@/features/assessment/questions";
import { responsesFor } from "@/features/assessment/queries";
import { latestSubmitted, loadInsights } from "@/features/insights/queries";

export type SummaryRow = { label: string; value: string };
export type SummarySection = { id: SectionId; title: string; rows: SummaryRow[] };

export type SummaryData = {
  assessmentId: string;
  submittedAt: Date | null;
  sections: SummarySection[];
  topics: { topic: string; professional: boolean }[];
  userQuestions: string[];
};

// Suggested questions written for this app (the same ones as the Care Navigation page).
export const SUGGESTED_QUESTIONS = [
  "Which tests do you recommend first, and why?",
  "Should the semen analysis be repeated, and when?",
  "Could any medicine or supplement I take affect sperm?",
  "Are any of my habits worth changing, and how strong is the evidence?",
  "Should my partner be assessed at the same time?",
  "When would you refer me to a specialist?",
];

// Built only from the signed-in user's latest SUBMITTED assessment. Nothing from the browser picks the data.
export async function loadSummary(userId: string): Promise<SummaryData | null> {
  const assessment = await latestSubmitted(userId);
  if (!assessment) return null;

  const responses = await responsesFor(userId, assessment.id);
  const sections: SummarySection[] = SECTIONS.map((s) => ({
    id: s.id,
    title: s.title,
    // Only questions the person actually answered are listed.
    rows: s.fields
      .filter((f) => {
        const v = responses[s.id]?.[f.name];
        return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
      })
      .map((f) => ({ label: f.label, value: optionLabel(f, responses[s.id]?.[f.name]) })),
  }));

  const bundle = await loadInsights(userId);
  const topics = (bundle?.insights ?? [])
    .filter((i) => i.personal)
    .map((i) => ({ topic: i.topic, professional: i.kind === "professional" }));

  const [saved] = await db
    .select({ questions: schema.consultationSummaries.questions })
    .from(schema.consultationSummaries)
    .where(and(eq(schema.consultationSummaries.userId, userId), eq(schema.consultationSummaries.assessmentId, assessment.id)))
    .orderBy(desc(schema.consultationSummaries.createdAt))
    .limit(1);
  const userQuestions = Array.isArray(saved?.questions) ? (saved.questions as unknown[]).filter((q): q is string => typeof q === "string") : [];

  return { assessmentId: assessment.id, submittedAt: assessment.submittedAt, sections, topics, userQuestions };
}
