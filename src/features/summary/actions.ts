"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { parseQuestions } from "@/lib/validation/privacy";
import type { ActionState } from "@/lib/action-state";
import { hasHealthConsent } from "@/features/assessment/queries";
import { latestSubmitted } from "@/features/insights/queries";

// Saves the person's own questions for their clinician. The assessment is chosen on the server.
export async function saveQuestionsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!(await hasHealthConsent(user.id))) return { message: "Health consent is needed before saving questions." };

  const assessment = await latestSubmitted(user.id);
  if (!assessment) return { message: "Submit an assessment first." };

  const raw = formData.get("questions");
  const { questions, error } = parseQuestions(typeof raw === "string" ? raw : "");
  if (error) return { errors: { questions: error } };

  await db.transaction(async (tx) => {
    await tx
      .delete(schema.consultationSummaries)
      .where(and(eq(schema.consultationSummaries.userId, user.id), eq(schema.consultationSummaries.assessmentId, assessment.id)));
    await tx.insert(schema.consultationSummaries).values({ userId: user.id, assessmentId: assessment.id, questions });
  });
  await recordAudit(user.id, "summary.questions_saved");
  revalidatePath("/summary"); // the preview shows the saved questions straight away
  return { ok: true, message: questions.length === 0 ? "Saved. You have no questions listed." : "Questions saved." };
}
