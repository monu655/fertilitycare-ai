import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type ConsentSummary = {
  health: boolean;
  ai: boolean;
  healthAt: Date | null;
  aiAt: Date | null;
  version: string | null;
};

// The newest record for each purpose decides the current choice. Older records are kept as history.
export async function consentState(userId: string): Promise<ConsentSummary> {
  const rows = await db
    .select()
    .from(schema.consentRecords)
    .where(eq(schema.consentRecords.userId, userId))
    .orderBy(desc(schema.consentRecords.createdAt));
  const health = rows.find((r) => r.purpose === "HEALTH_ASSESSMENT");
  const ai = rows.find((r) => r.purpose === "AI_PROCESSING");
  return {
    health: health?.granted === true,
    ai: ai?.granted === true,
    healthAt: health?.createdAt ?? null,
    aiAt: ai?.createdAt ?? null,
    version: health?.version ?? null,
  };
}

// Only the user's own activity. Audit rows hold an action name and a time, never health content.
export async function recentActivity(userId: string, limit = 8) {
  return db
    .select({ action: schema.auditEvents.action, createdAt: schema.auditEvents.createdAt })
    .from(schema.auditEvents)
    .where(eq(schema.auditEvents.userId, userId))
    .orderBy(desc(schema.auditEvents.createdAt))
    .limit(limit);
}

// Everything we hold about this user, as plain data. The password hash is never included.
export async function buildExport(userId: string) {
  const [account] = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      name: schema.users.name,
      createdAt: schema.users.createdAt,
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId));

  const consents = await db
    .select({
      purpose: schema.consentRecords.purpose,
      granted: schema.consentRecords.granted,
      version: schema.consentRecords.version,
      createdAt: schema.consentRecords.createdAt,
    })
    .from(schema.consentRecords)
    .where(eq(schema.consentRecords.userId, userId))
    .orderBy(schema.consentRecords.createdAt);

  const assessments = await db.select().from(schema.assessments).where(eq(schema.assessments.userId, userId));
  const responses = await db.select().from(schema.assessmentResponses).where(eq(schema.assessmentResponses.userId, userId));
  const insights = await db.select().from(schema.healthInsights).where(eq(schema.healthInsights.userId, userId));
  const summaries = await db.select().from(schema.consultationSummaries).where(eq(schema.consultationSummaries.userId, userId));
  const activity = await db
    .select({ action: schema.auditEvents.action, createdAt: schema.auditEvents.createdAt })
    .from(schema.auditEvents)
    .where(eq(schema.auditEvents.userId, userId))
    .orderBy(schema.auditEvents.createdAt);

  return {
    exportedAt: new Date().toISOString(),
    note: "This file contains your personal health information. Keep it somewhere private.",
    account,
    consents,
    assessments: assessments.map((a) => ({
      id: a.id,
      status: a.status,
      createdAt: a.createdAt,
      submittedAt: a.submittedAt,
      answers: Object.fromEntries(responses.filter((r) => r.assessmentId === a.id).map((r) => [r.section, r.data])),
    })),
    insights: insights.map((i) => ({ assessmentId: i.assessmentId, topic: i.topic, source: i.source, content: i.content })),
    consultationQuestions: summaries.map((s) => ({ assessmentId: s.assessmentId, questions: s.questions })),
    activityLog: activity,
  };
}
