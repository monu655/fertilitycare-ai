"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { todayIso, weekStart } from "@/lib/dates";
import { hasHealthConsent } from "@/features/assessment/queries";
import { GOAL_KEYS } from "./goals";

const addSchema = z.object({ goalKey: z.enum(GOAL_KEYS), targetDays: z.coerce.number().int().min(1).max(7) });
const idSchema = z.object({ id: z.string().trim().min(1).max(64) });
const stepSchema = z.object({ id: z.string().trim().min(1).max(64), delta: z.enum(["1", "-1"]) });

const str = (f: FormData, n: string) => {
  const v = f.get(n);
  return typeof v === "string" ? v : "";
};

export async function addGoalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  if (!(await hasHealthConsent(user.id))) return;
  if (!rateLimit(`goal:${user.id}`, 60, 60 * 60 * 1000).ok) return;
  const parsed = addSchema.safeParse({ goalKey: str(formData, "goalKey"), targetDays: str(formData, "targetDays") });
  if (!parsed.success) return;
  const inserted = await db
    .insert(schema.weeklyGoals)
    .values({ userId: user.id, weekStart: weekStart(todayIso()), goalKey: parsed.data.goalKey, targetDays: parsed.data.targetDays })
    .onConflictDoNothing()
    .returning({ id: schema.weeklyGoals.id });
  if (inserted.length > 0) await recordAudit(user.id, "goal.added");
  revalidatePath("/coach");
}

// +1 or -1 day done, kept between 0 and the target. The row must belong to the signed-in user.
export async function stepGoalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = stepSchema.safeParse({ id: str(formData, "id"), delta: str(formData, "delta") });
  if (!parsed.success) return;
  const delta = Number(parsed.data.delta);
  const changed = await db
    .update(schema.weeklyGoals)
    .set({ daysDone: sql`greatest(0, least(${schema.weeklyGoals.targetDays}, ${schema.weeklyGoals.daysDone} + ${delta}))` })
    .where(and(eq(schema.weeklyGoals.id, parsed.data.id), eq(schema.weeklyGoals.userId, user.id)))
    .returning({ id: schema.weeklyGoals.id });
  if (changed.length > 0) await recordAudit(user.id, "goal.updated");
  revalidatePath("/coach");
}

export async function deleteGoalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = idSchema.safeParse({ id: str(formData, "id") });
  if (!parsed.success) return;
  const removed = await db
    .delete(schema.weeklyGoals)
    .where(and(eq(schema.weeklyGoals.id, parsed.data.id), eq(schema.weeklyGoals.userId, user.id)))
    .returning({ id: schema.weeklyGoals.id });
  if (removed.length > 0) await recordAudit(user.id, "goal.deleted");
  revalidatePath("/coach");
}
