import { and, desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export const CONSENT_VERSION = "2026-10-v1";

// Every query here is filtered by userId. We never accept an assessment id from the browser.

export async function hasHealthConsent(userId: string): Promise<boolean> {
  const [row] = await db
    .select({ granted: schema.consentRecords.granted })
    .from(schema.consentRecords)
    .where(and(eq(schema.consentRecords.userId, userId), eq(schema.consentRecords.purpose, "HEALTH_ASSESSMENT")))
    .orderBy(desc(schema.consentRecords.createdAt))
    .limit(1);
  return row?.granted === true;
}

export async function latestAssessment(userId: string) {
  const [row] = await db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.userId, userId))
    .orderBy(desc(schema.assessments.updatedAt))
    .limit(1);
  return row;
}

export async function inProgressAssessment(userId: string) {
  const [row] = await db
    .select()
    .from(schema.assessments)
    .where(and(eq(schema.assessments.userId, userId), eq(schema.assessments.status, "IN_PROGRESS")))
    .orderBy(desc(schema.assessments.updatedAt))
    .limit(1);
  return row;
}

export async function getOrCreateInProgress(userId: string) {
  const existing = await inProgressAssessment(userId);
  if (existing) return existing;
  const [created] = await db.insert(schema.assessments).values({ userId }).returning();
  return created;
}

export async function responsesFor(userId: string, assessmentId: string) {
  const rows = await db
    .select()
    .from(schema.assessmentResponses)
    .where(and(eq(schema.assessmentResponses.assessmentId, assessmentId), eq(schema.assessmentResponses.userId, userId)));
  const map: Record<string, Record<string, unknown>> = {};
  for (const r of rows) map[r.section] = r.data as Record<string, unknown>;
  return map;
}
