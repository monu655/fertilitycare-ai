import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { and, eq, lt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { generateAndStoreInsights } from "@/features/insights/queries";
import { CONSENT_VERSION } from "@/features/assessment/queries";
import { DEMO_ANSWERS } from "./synthetic-data";

const DEMO_LIFETIME_MS = 24 * 60 * 60 * 1000;

// Each click makes a NEW demo user, so judges never see each other's changes.
// The password is random, used once to sign in, and never shown to anyone.
export async function createDemoUser(): Promise<{ email: string; password: string; userId: string }> {
  // Remove demo users older than 24 hours. Cascade delete removes their rows too.
  await db
    .delete(schema.users)
    .where(and(eq(schema.users.isDemo, true), lt(schema.users.createdAt, new Date(Date.now() - DEMO_LIFETIME_MS))));

  const email = `demo-${randomBytes(8).toString("hex")}@demo.example.com`;
  const password = randomBytes(18).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(schema.users)
    .values({ name: "Demo visitor", email, passwordHash, isDemo: true })
    .returning({ id: schema.users.id });

  // Health consent is on (the data is synthetic). AI consent stays OFF: the visitor can switch it on in the Privacy Center.
  await db.insert(schema.consentRecords).values([
    { userId: user.id, purpose: "HEALTH_ASSESSMENT", granted: true, version: CONSENT_VERSION },
    { userId: user.id, purpose: "AI_PROCESSING", granted: false, version: CONSENT_VERSION },
  ]);

  const [assessment] = await db
    .insert(schema.assessments)
    .values({ userId: user.id, status: "SUBMITTED", currentStep: 6, submittedAt: new Date() })
    .returning({ id: schema.assessments.id });

  await db.insert(schema.assessmentResponses).values(
    Object.entries(DEMO_ANSWERS).map(([section, data]) => ({
      assessmentId: assessment.id,
      userId: user.id,
      section,
      data,
    })),
  );

  await generateAndStoreInsights(user.id, assessment.id);
  return { email, password, userId: user.id };
}
