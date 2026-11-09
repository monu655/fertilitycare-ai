"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/session";
import type { ActionState } from "@/lib/action-state";
import { GENTLE_COOKIE } from "./gentle";

export async function setGentleModeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const on = formData.get("gentle") === "on";
  const jar = await cookies();
  if (on) {
    jar.set(GENTLE_COOKIE, "1", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 365 });
  } else {
    jar.delete(GENTLE_COOKIE);
  }
  revalidatePath("/insights");
  revalidatePath("/progress");
  revalidatePath("/settings");
  return { ok: true, message: on ? "Gentle mode is on." : "Gentle mode is off." };
}
