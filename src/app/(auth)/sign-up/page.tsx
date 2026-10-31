import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/features/auth/sign-up-form";

export const metadata: Metadata = { title: "Create account" };

export default function SignUpPage() {
  return (
    <AuthShell title="Create your account" subtitle="Start privately. You control what you share.">
      <SignUpForm />
    </AuthShell>
  );
}
