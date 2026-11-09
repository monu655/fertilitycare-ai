import { cookies } from "next/headers";

// Gentle mode is a small display choice, kept in a cookie on this browser (not in the database).
// It hides the person's own test numbers and the "What you reported" lists. Safety information is never hidden.
export const GENTLE_COOKIE = "gentle_mode";

export async function isGentle(): Promise<boolean> {
  return (await cookies()).get(GENTLE_COOKIE)?.value === "1";
}
