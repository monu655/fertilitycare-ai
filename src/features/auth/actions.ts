"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { db, schema } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { fieldErrors, signInSchema, signUpSchema } from "@/lib/validation/auth";
import { rateLimit } from "@/lib/security/rate-limit";
import { recordAudit } from "@/lib/audit";

export type FormState = {
  errors?: Record<string, string>;
  message?: string;
  // Non-secret values sent back so the form does not go blank after an error.
  // Passwords are NEVER sent back.
  values?: { name?: string; email?: string };
};

async function clientKey() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

function text(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v : "";
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { name: text(formData, "name"), email: text(formData, "email") };

  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  // Max 5 sign-ups per IP per hour.
  if (!rateLimit(`signup:${await clientKey()}`, Number(process.env.SIGNUP_LIMIT_PER_HOUR ?? 5), 60 * 60 * 1000).ok) {
    return { message: "Too many attempts. Please try again later.", values };
  }

  const { name, email, password } = parsed.data;
  const [existing] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1);

  // Same message either way, so nobody can use this form to find out who has an account.
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    const [user] = await db.insert(schema.users).values({ name, email, passwordHash }).returning({ id: schema.users.id });
    await recordAudit(user.id, "account.created");
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        message: "We could not create or sign in to this account. If you already have an account, please sign in.",
        values,
      };
    }
    throw error; // Next.js uses a thrown redirect to navigate, so we must rethrow it.
  }
  return {};
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = { email: text(formData, "email") };

  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  try {
    await signIn("credentials", { ...parsed.data, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Email or password is incorrect, or too many attempts were made. Please try again.", values };
    }
    throw error;
  }
  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
