import { redirect } from "next/navigation";
import { connection } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";

// Call this at the top of EVERY private page and server action.
// Hiding a link in the UI is not security; this server-side check is.
export async function requireUser() {
  // Session reading is per-request work. This tells Next.js not to try to prerender it
  // (Auth.js creates a random CSRF token internally, which Next.js rejects at prerender time).
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  // A sign-in cookie can outlive the account (for example after "Delete account" on another device).
  // So we confirm the user still exists. This also gives us the current name after a rename.
  const [row] = await db
    .select({ id: schema.users.id, name: schema.users.name })
    .from(schema.users)
    .where(eq(schema.users.id, session.user.id))
    .limit(1);
  if (!row) redirect("/sign-in");
  return { ...session.user, name: row.name };
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
