import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  deleteAccountSchema,
  deleteDataSchema,
  parseQuestions,
  updateNameSchema,
} from "@/lib/validation/privacy";

describe("delete confirmation", () => {
  it("needs the exact word DELETE", () => {
    expect(deleteDataSchema.safeParse({ confirm: "DELETE" }).success).toBe(true);
    expect(deleteDataSchema.safeParse({ confirm: " DELETE " }).success).toBe(true);
    expect(deleteDataSchema.safeParse({ confirm: "delete" }).success).toBe(false);
    expect(deleteDataSchema.safeParse({ confirm: "" }).success).toBe(false);
  });

  it("account deletion also needs a password", () => {
    expect(deleteAccountSchema.safeParse({ confirm: "DELETE", password: "" }).success).toBe(false);
    expect(deleteAccountSchema.safeParse({ confirm: "DELETE", password: "x" }).success).toBe(true);
  });
});

describe("settings validation", () => {
  it("name must not be empty or too long", () => {
    expect(updateNameSchema.safeParse({ name: "  " }).success).toBe(false);
    expect(updateNameSchema.safeParse({ name: "a".repeat(81) }).success).toBe(false);
    expect(updateNameSchema.safeParse({ name: "Asha" }).success).toBe(true);
  });

  it("new password follows the sign-up rule, matches, and differs from the old one", () => {
    const ok = { currentPassword: "Old-password-1", newPassword: "New-password-22", confirmPassword: "New-password-22" };
    expect(changePasswordSchema.safeParse(ok).success).toBe(true);
    expect(changePasswordSchema.safeParse({ ...ok, newPassword: "short1", confirmPassword: "short1" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...ok, confirmPassword: "different-123" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...ok, newPassword: ok.currentPassword, confirmPassword: ok.currentPassword }).success).toBe(false);
  });
});

describe("parseQuestions", () => {
  it("splits lines, trims and drops empty lines", () => {
    expect(parseQuestions("  One?  \n\nTwo?\r\n").questions).toEqual(["One?", "Two?"]);
  });
  it("rejects more than 5 questions or a very long one", () => {
    expect(parseQuestions("1\n2\n3\n4\n5\n6").error).toBeTruthy();
    expect(parseQuestions("a".repeat(201)).error).toBeTruthy();
    expect(parseQuestions("").error).toBeUndefined();
  });
});
