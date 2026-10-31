import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/features/auth/sign-in-form";
import { DemoSection } from "@/features/demo/demo-section";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue your health journey.">
      <SignInForm />
      <Suspense fallback={null}>
        <DemoSection />
      </Suspense>
    </AuthShell>
  );
}
