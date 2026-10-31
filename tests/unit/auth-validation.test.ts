import { describe, expect, it } from "vitest";
import { fieldErrors, signInSchema, signUpSchema } from "@/lib/validation/auth";

const valid = { name: "Test User", email: "Test@Example.com ", password: "Good-pass-123", confirmPassword: "Good-pass-123" };

describe("signUpSchema", () => {
  it("accepts valid input and normalises the email", () => {
    const r = signUpSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("test@example.com");
  });

  it("rejects short passwords", () => {
    const r = signUpSchema.safeParse({ ...valid, password: "short1", confirmPassword: "short1" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).password).toMatch(/at least 10/);
  });

  it("rejects passwords without a number", () => {
    const r = signUpSchema.safeParse({ ...valid, password: "onlyletterspassword", confirmPassword: "onlyletterspassword" });
    expect(r.success).toBe(false);
  });

  it("rejects mismatched confirmation", () => {
    const r = signUpSchema.safeParse({ ...valid, confirmPassword: "Different-123" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).confirmPassword).toMatch(/do not match/);
  });

  it("rejects an invalid email", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("requires a password but does not enforce strength rules", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});
