"use server";

import { and, eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { fieldErrors } from "@/lib/validation/auth";
import { consentSchema, formToObject, sectionSchema } from "@/lib/validation/assessment";
import { sectionByStep } from "./questions";
import { generateAndStoreInsights } from "@/features/insights/queries";
import {
  CONSENT_VERSION,
  getOrCreateInProgress,
  hasHealthConsent,
  inProgressAssessment,
  responsesFor,
} from "./queries";

export type AssessmentFormState = {
  errors?: Record<string, string>;
  message?: string;
  values?: Record<string, unknown>;
};

// Step 1: record consent, then open step 2.
export async function giveConsentAction(_prev: AssessmentFormState, formData: FormData): Promise<AssessmentFormState> {
  const user = await requireUser();

  const parsed = consentSchema.safeParse({
    consentHealth: formData.get("consentHealth") ?? undefined,
    consentAi: formData.get("consentAi") ?? undefined,
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  // Consent records are append-only: we keep the history of what was agreed and when.
  await db.insert(schema.consentRecords).values([
    { userId: user.id, purpose: "HEALTH_ASSESSMENT", granted: true, version: CONSENT_VERSION },
    { userId: user.id, purpose: "AI_PROCESSING", granted: parsed.data.consentAi === "on", version: CONSENT_VERSION },
  ]);

  const assessment = await getOrCreateInProgress(user.id);
  if (assessment.currentStep < 2) {
    await db
      .update(schema.assessments)
      .set({ currentStep: 2, updatedAt: new Date() })
      .where(and(eq(schema.assessments.id, assessment.id), eq(schema.assessments.userId, user.id)));
  }
  await recordAudit(user.id, "consent.granted");
  redirect("/assessment?step=2");
}

// Steps 2 to 5: validate on the server, save, go to the next step.
export async function saveStepAction(_prev: AssessmentFormState, formData: FormData): Promise<AssessmentFormState> {
  const user = await requireUser();

  const step = Number(formData.get("step"));
  const section = sectionByStep(step);
  if (!section) return { message: "That step does not exist." };

  // No consent, no health answers saved. The server enforces this, not the screen.
  if (!(await hasHealthConsent(user.id))) redirect("/assessment?step=1");

  const raw = formToObject(section, formData);
  const parsed = sectionSchema(section).safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values: raw };

  const assessment = await getOrCreateInProgress(user.id);

  await db
    .insert(schema.assessmentResponses)
    .values({ assessmentId: assessment.id, userId: user.id, section: section.id, data: parsed.data })
    .onConflictDoUpdate({
      target: [schema.assessmentResponses.assessmentId, schema.assessmentResponses.section],
      set: { data: parsed.data, updatedAt: new Date() },
    });

  await db
    .update(schema.assessments)
    .set({ currentStep: sql`GREATEST(${schema.assessments.currentStep}, ${step + 1})`, updatedAt: new Date() })
    .where(and(eq(schema.assessments.id, assessment.id), eq(schema.assessments.userId, user.id)));

  redirect(`/assessment?step=${step + 1}`);
}

// Step 6: final submit. Safe to press twice: only the first press changes anything.
export async function submitAssessmentAction(): Promise<void> {
  const user = await requireUser();
  if (!(await hasHealthConsent(user.id))) redirect("/assessment?step=1");

  const assessment = await inProgressAssessment(user.id);
  if (!assessment) redirect("/insights");

  const responses = await responsesFor(user.id, assessment.id);
  if (!responses.context?.ageRange) redirect("/assessment?step=2");

  const updated = await db
    .update(schema.assessments)
    .set({ status: "SUBMITTED", submittedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(schema.assessments.id, assessment.id),
        eq(schema.assessments.userId, user.id),
        eq(schema.assessments.status, "IN_PROGRESS"),
      ),
    )
    .returning({ id: schema.assessments.id });

  if (updated.length > 0) {
    await recordAudit(user.id, "assessment.submitted");
    try {
      await generateAndStoreInsights(user.id, assessment.id);
    } catch {
      // Submitting must not fail because insights failed. The insights page retries on first view.
    }
  }
  redirect("/insights");
}

// After a submitted assessment the user may start a fresh one.
export async function startNewAssessmentAction(): Promise<void> {
  const user = await requireUser();
  const consent = await hasHealthConsent(user.id);
  await getOrCreateInProgress(user.id);
  redirect(consent ? "/assessment?step=2" : "/assessment?step=1");
}
