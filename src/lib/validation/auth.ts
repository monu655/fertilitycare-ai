import { z } from "zod";

// These rules run on the SERVER. The browser form only mirrors them for convenience.
const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254, "Email address is too long.");

const password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128, "Password is too long.")
  .refine((v) => /[a-z]/i.test(v) && /\d/.test(v), "Include at least one letter and one number.");

export const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name.").max(80, "Name is too long."),
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const signInSchema = z.object({
  email,
  // No strength rules on sign-in: we only check it against the stored hash.
  password: z.string().min(1, "Enter your password.").max(128),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

// Turns zod issues into { fieldName: "message" } for the form.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

// Same password rule as sign-up, reused by "change password" in Settings.
export const passwordRule = password;
