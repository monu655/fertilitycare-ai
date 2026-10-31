"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { fieldErrors } from "@/lib/validation/auth";
import { changePasswordSchema, updateNameSchema } from "@/lib/validation/privacy";
import type { ActionState } from "@/lib/action-state";

export async function updateNameAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = updateNameSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  await db.update(schema.users).set({ name: parsed.data.name }).where(eq(schema.users.id, user.id));
  await recordAudit(user.id, "profile.updated");
  return { ok: true, message: "Name saved." };
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  if (!rateLimit(`password-change:${user.id}`, 5, 15 * 60 * 1000).ok) {
    return { message: "Too many attempts. Please try again in a few minutes." };
  }

  const [row] = await db
    .select({ passwordHash: schema.users.passwordHash })
    .from(schema.users)
    .where(eq(schema.users.id, user.id));
  if (!row || !(await bcrypt.compare(parsed.data.currentPassword, row.passwordHash))) {
    return { errors: { currentPassword: "That password is not correct." } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  await db.update(schema.users).set({ passwordHash }).where(eq(schema.users.id, user.id));
  await recordAudit(user.id, "password.changed");
  return { ok: true, message: "Password changed." };
}
