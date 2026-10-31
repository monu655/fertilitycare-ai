import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { AiNotesSchema, InsightSchema, type AiNotes, type Insight } from "@/lib/insights/schema";
import { buildInsights } from "@/lib/insights/rules";
import { validateInsights } from "@/lib/insights/schema";
import { generateAiNotes, minimalAnswers } from "@/lib/ai/service";
import { responsesFor } from "@/features/assessment/queries";

// All queries are filtered by userId. An assessment id from the browser is never trusted.

export async function latestSubmitted(userId: string) {
  const [row] = await db
    .select()
    .from(schema.assessments)
    .where(and(eq(schema.assessments.userId, userId), eq(schema.assessments.status, "SUBMITTED")))
    .orderBy(desc(schema.assessments.submittedAt))
    .limit(1);
  return row;
}

async function hasAiConsent(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ granted: schema.consentRecords.granted })
    .from(schema.consentRecords)
    .where(and(eq(schema.consentRecords.userId, userId), eq(schema.consentRecords.purpose, "AI_PROCESSING")))
    .orderBy(desc(schema.consentRecords.createdAt))
    .limit(1);
  return row?.granted === true;
}

// Safe to call twice: row ids are fixed, so a second call does nothing.
export async function generateAndStoreInsights(userId: string, assessmentId: string): Promise<void> {
  const responses = await responsesFor(userId, assessmentId);
  const insights = validateInsights(buildInsights(responses));

  if (insights.length > 0) {
    await db
      .insert(schema.healthInsights)
      .values(
        insights.map((i) => ({
          id: `${assessmentId}-${i.id}`,
          assessmentId,
          userId,
          topic: i.topic,
          content: i,
          source: "rules",
        })),
      )
      .onConflictDoNothing();
  }

  const ai = await generateAiNotes({ answers: minimalAnswers(responses), aiConsent: await hasAiConsent(userId) });
  if (ai) {
    await db
      .insert(schema.healthInsights)
      .values({ id: `${assessmentId}-ai`, assessmentId, userId, topic: "AI-generated educational notes", content: ai, source: "ai" })
      .onConflictDoNothing();
  }
}

export type InsightBundle = { insights: Insight[]; aiNotes: AiNotes | null; submittedAt: Date | null };

export async function loadInsights(userId: string): Promise<InsightBundle | null> {
  const assessment = await latestSubmitted(userId);
  if (!assessment) return null;

  const read = () =>
    db
      .select()
      .from(schema.healthInsights)
      .where(and(eq(schema.healthInsights.userId, userId), eq(schema.healthInsights.assessmentId, assessment.id)));

  let rows = await read();
  if (rows.length === 0) {
    // For assessments submitted before insights existed, or if generation failed earlier.
    await generateAndStoreInsights(userId, assessment.id);
    rows = await read();
  }

  const insights: Insight[] = [];
  let aiNotes: AiNotes | null = null;
  for (const row of rows) {
    if (row.source === "ai") {
      const p = AiNotesSchema.safeParse(row.content);
      if (p.success) aiNotes = p.data;
    } else {
      const p = InsightSchema.safeParse(row.content);
      if (p.success) insights.push(p.data);
    }
  }
  // Personal insights first, then general guidance.
  insights.sort((a, b) => Number(b.personal) - Number(a.personal));
  return { insights, aiNotes, submittedAt: assessment.submittedAt };
}
