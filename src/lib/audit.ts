import { db, schema } from "@/lib/db";

// Audit events store only WHO did WHAT. Never put health answers in here.
export async function recordAudit(userId: string | null, action: string) {
  try {
    await db.insert(schema.auditEvents).values({ userId, action });
  } catch {
    // Audit failure must not break the user's request, and we never log health data.
  }
}
