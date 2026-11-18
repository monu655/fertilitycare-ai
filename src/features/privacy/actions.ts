"use server";

import bcrypt from "bcryptjs";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { signOut } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { fieldErrors } from "@/lib/validation/auth";
import { deleteAccountSchema, deleteDataSchema } from "@/lib/validation/privacy";
import type { ActionState } from "@/lib/action-state";
import { CONSENT_VERSION } from "@/features/assessment/queries";
import { consentState } from "./queries";

// Every action starts with requireUser() and only touches rows where user_id = that user.

async function removeAiInsights(userId: string) {
  await db
    .delete(schema.healthInsights)
    .where(and(eq(schema.healthInsights.userId, userId), eq(schema.healthInsights.source, "ai")));
}

// Turn the separate AI-processing consent on or off. Consent history is append-only.
export async function setAiConsentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const grant = formData.get("grant") === "true";
  const state = await consentState(user.id);

  if (!state.health) {
    return { message: "Give health-assessment consent first (in the Health Assessment, step 1)." };
  }
  if (state.ai === grant) return { ok: true, message: "No change. This choice was already saved." };

  await db.insert(schema.consentRecords).values({
    userId: user.id,
    purpose: "AI_PROCESSING",
    granted: grant,
    version: CONSENT_VERSION,
  });
  if (!grant) await removeAiInsights(user.id);
  await recordAudit(user.id, grant ? "consent.ai_granted" : "consent.ai_withdrawn");
  revalidatePath("/privacy"); // refresh the page so the button and badge show the new state

  return {
    ok: true,
    message: grant
      ? "AI notes consent saved. It applies the next time you submit an assessment."
      : "AI notes consent withdrawn. Any stored AI notes were deleted.",
  };
}

// Separate consent for sending daily habit numbers (and, only when chosen each time, lab values) to an AI service.
export async function setAiTrackingConsentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const grant = formData.get("grant") === "true";
  const state = await consentState(user.id);

  if (!state.health) return { message: "Give health-assessment consent first (in the Health Assessment, step 1)." };
  if (state.aiTracking === grant) return { ok: true, message: "No change. This choice was already saved." };

  await db.insert(schema.consentRecords).values({
    userId: user.id,
    purpose: "AI_TRACKING_DATA",
    granted: grant,
    version: CONSENT_VERSION,
  });
  await recordAudit(user.id, grant ? "consent.ai_tracking_granted" : "consent.ai_tracking_withdrawn");
  revalidatePath("/privacy");
  revalidatePath("/intelligence");
  return {
    ok: true,
    message: grant
      ? "Saved. On the AI Intelligence page you can now ask for an AI summary. You choose what is included each time."
      : "AI tracking-data consent withdrawn. No habit or lab numbers will be sent to an AI service.",
  };
}

// Withdraw the main consent. It stops new health answers being saved. It does NOT delete what is stored:
// deletion is a separate, clearly confirmed choice.
export async function withdrawHealthConsentAction(): Promise<ActionState> {
  const user = await requireUser();
  const state = await consentState(user.id);
  if (!state.health) return { ok: true, message: "Consent was already withdrawn." };

  await db.insert(schema.consentRecords).values([
    { userId: user.id, purpose: "HEALTH_ASSESSMENT", granted: false, version: CONSENT_VERSION },
    { userId: user.id, purpose: "AI_PROCESSING", granted: false, version: CONSENT_VERSION },
    { userId: user.id, purpose: "AI_TRACKING_DATA", granted: false, version: CONSENT_VERSION },
  ]);
  await removeAiInsights(user.id);
  await recordAudit(user.id, "consent.withdrawn");
  revalidatePath("/privacy");

  return {
    ok: true,
    message:
      "Consent withdrawn. No new health answers can be saved. Data you already entered is still stored until you delete it below.",
  };
}

// Delete every assessment (answers, insights, saved questions) and every daily entry, lab value and weekly goal. The account stays.
export async function deleteAssessmentDataAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = deleteDataSchema.safeParse({ confirm: formData.get("confirm") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  // Cascade rules in the database remove answers, insights and summaries together with the assessment.
  const removed = await db
    .delete(schema.assessments)
    .where(eq(schema.assessments.userId, user.id))
    .returning({ id: schema.assessments.id });
  await removeAiInsights(user.id);
  await db.delete(schema.habitEntries).where(eq(schema.habitEntries.userId, user.id));
  await db.delete(schema.biomarkerRecords).where(eq(schema.biomarkerRecords.userId, user.id));
  await db.delete(schema.weeklyGoals).where(eq(schema.weeklyGoals.userId, user.id));
  await recordAudit(user.id, "assessments.deleted");
  revalidatePath("/privacy");
  revalidatePath("/tracker");
  revalidatePath("/reports");

  return {
    ok: true,
    message:
      removed.length === 0
        ? "Your assessments were already empty. Any daily entries, lab values and weekly goals were deleted too."
        : `Deleted ${removed.length} assessment${removed.length === 1 ? "" : "s"} with all answers, insights and saved questions.`,
  };
}

// Permanently delete the account and all of its data, then sign out.
export async function deleteAccountAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = deleteAccountSchema.safeParse({ confirm: formData.get("confirm"), password: formData.get("password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (!rateLimit(`delete-account:${user.id}`, 5, 15 * 60 * 1000).ok) {
    return { message: "Too many attempts. Please try again in a few minutes." };
  }

  // Re-check the password so a stolen open session cannot delete the account.
  const [row] = await db
    .select({ passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.id, user.id));
  if (!row || !(await bcrypt.compare(parsed.data.password, row.passwordHash))) {
    return { errors: { password: "That password is not correct." } };
  }

  // The audit row stays (user id, action, time, no health data) so deletion itself can be shown later.
  await recordAudit(user.id, "account.deleted");
  await db.delete(schema.users).where(eq(schema.users.id, user.id)); // cascades to all private tables

  await signOut({ redirectTo: "/" }); // throws a redirect, so the line below is only a fallback
  return { ok: true };
}
