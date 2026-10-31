import { z } from "zod";
import { passwordRule } from "./auth";

const confirmDelete = z
  .string()
  .trim()
  .refine((v) => v === "DELETE", "Type the word DELETE in capital letters to confirm.");

export const deleteDataSchema = z.object({ confirm: confirmDelete });

export const deleteAccountSchema = z.object({
  confirm: confirmDelete,
  password: z.string().min(1, "Enter your password.").max(128),
});

export const updateNameSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80, "Name is too long."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password.").max(128),
    newPassword: passwordRule,
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((v) => v.newPassword !== v.currentPassword, {
    path: ["newPassword"],
    message: "Choose a password different from the current one.",
  });

// The user's own questions for the clinician: one per line, at most 5, each up to 200 characters.
export const MAX_QUESTIONS = 5;
export const MAX_QUESTION_LENGTH = 200;

export function parseQuestions(raw: string): { questions: string[]; error?: string } {
  const questions = raw
    .split(/\r?\n/)
    .map((q) => q.trim())
    .filter(Boolean);
  if (questions.length > MAX_QUESTIONS) return { questions, error: `Add at most ${MAX_QUESTIONS} questions.` };
  if (questions.some((q) => q.length > MAX_QUESTION_LENGTH))
    return { questions, error: `Keep each question under ${MAX_QUESTION_LENGTH} characters.` };
  return { questions };
}
