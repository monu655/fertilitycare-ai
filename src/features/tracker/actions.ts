"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { fieldErrors } from "@/lib/validation/auth";
import { deleteByIdSchema, habitEntrySchema } from "@/lib/validation/tracker";
import type { ActionState } from "@/lib/action-state";
import { hasHealthConsent } from "@/features/assessment/queries";

function formValue(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

// Save one day. Saving the same date again replaces that day (this is how "edit" works).
export async function saveHabitEntryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  // Same rule as the assessment: no health consent, no health data saved. The server enforces it.
  if (!(await hasHealthConsent(user.id))) {
    return { message: "Please give health consent first (Health Assessment, step 1). Then you can log your days." };
  }
  if (!rateLimit(`habit:${user.id}`, 120, 60 * 60 * 1000).ok) {
    return { message: "Too many saves in a short time. Please try again later." };
  }

  const parsed = habitEntrySchema.safeParse({
    entryDate: formValue(formData, "entryDate"),
    sleepHours: formValue(formData, "sleepHours"),
    bedtime: formValue(formData, "bedtime"),
    stress: formValue(formData, "stress"),
    mealPattern: formValue(formData, "mealPattern"),
    fruitVeg: formValue(formData, "fruitVeg"),
    exerciseMinutes: formValue(formData, "exerciseMinutes"),
    heatMinutes: formValue(formData, "heatMinutes"),
    sittingHours: formValue(formData, "sittingHours"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const d = parsed.data;
  const values = {
    sleepHours: d.sleepHours ?? null,
    bedtimeMinutes: d.bedtime ?? null,
    stress: d.stress ?? null,
    mealPattern: d.mealPattern ?? null,
    fruitVeg: d.fruitVeg ?? null,
    exerciseMinutes: d.exerciseMinutes ?? null,
    heatMinutes: d.heatMinutes ?? null,
    sittingHours: d.sittingHours ?? null,
  };
  await db
    .insert(schema.habitEntries)
    .values({ userId: user.id, entryDate: d.entryDate, ...values })
    .onConflictDoUpdate({
      target: [schema.habitEntries.userId, schema.habitEntries.entryDate],
      set: { ...values, updatedAt: new Date() },
    });

  await recordAudit(user.id, "habit.saved");
  revalidatePath("/tracker");
  revalidatePath("/intelligence");
  return { ok: true, message: "Saved. You can change this day again at any time." };
}

// Delete one day. The row must belong to the signed-in user, whatever id the browser sends.
export async function deleteHabitEntryAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = deleteByIdSchema.safeParse({ id: formValue(formData, "id") });
  if (!parsed.success) return;
  const removed = await db
    .delete(schema.habitEntries)
    .where(and(eq(schema.habitEntries.id, parsed.data.id), eq(schema.habitEntries.userId, user.id)))
    .returning({ id: schema.habitEntries.id });
  if (removed.length > 0) await recordAudit(user.id, "habit.deleted");
  revalidatePath("/tracker");
  revalidatePath("/intelligence");
}
