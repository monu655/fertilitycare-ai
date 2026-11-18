"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { fieldErrors } from "@/lib/validation/auth";
import { biomarkerSchema, deleteByIdSchema } from "@/lib/validation/tracker";
import type { ActionState } from "@/lib/action-state";
import { hasHealthConsent } from "@/features/assessment/queries";

const val = (f: FormData, n: string) => (typeof f.get(n) === "string" ? (f.get(n) as string) : "");

export async function addBiomarkerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!(await hasHealthConsent(user.id))) {
    return { message: "Please give health consent first (Health Assessment, step 1). Then you can record lab values." };
  }
  if (!rateLimit(`biomarker:${user.id}`, 60, 60 * 60 * 1000).ok) {
    return { message: "Too many saves in a short time. Please try again later." };
  }

  const parsed = biomarkerSchema.safeParse({
    takenOn: val(formData, "takenOn"),
    marker: val(formData, "marker"),
    unit: val(formData, "unit"),
    value: val(formData, "value"),
    refLow: val(formData, "refLow"),
    refHigh: val(formData, "refHigh"),
    notes: val(formData, "notes"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const d = parsed.data;
  await db.insert(schema.biomarkerRecords).values({
    userId: user.id,
    takenOn: d.takenOn,
    marker: d.marker,
    value: d.value as number,
    unit: d.unit,
    refLow: d.refLow ?? null,
    refHigh: d.refHigh ?? null,
    notes: d.notes ? d.notes : null,
  });
  await recordAudit(user.id, "biomarker.added");
  revalidatePath("/reports");
  revalidatePath("/intelligence");
  return { ok: true, message: "Saved. Please keep your original laboratory report as well." };
}

export async function deleteBiomarkerAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = deleteByIdSchema.safeParse({ id: val(formData, "id") });
  if (!parsed.success) return;
  const removed = await db
    .delete(schema.biomarkerRecords)
    .where(and(eq(schema.biomarkerRecords.id, parsed.data.id), eq(schema.biomarkerRecords.userId, user.id)))
    .returning({ id: schema.biomarkerRecords.id });
  if (removed.length > 0) await recordAudit(user.id, "biomarker.deleted");
  revalidatePath("/reports");
  revalidatePath("/intelligence");
}
