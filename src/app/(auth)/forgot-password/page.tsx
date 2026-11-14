import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = { title: "Forgot password" };

// Password reset by email is not built yet (the app sends no emails). This page says so plainly instead of showing a 404.
export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot your password?" subtitle="Password reset by email is not available yet.">
      <div className="space-y-4 text-sm text-muted" data-testid="forgot-password-note">
        <p>
          This prototype does not send emails, so it cannot send you a reset link. Nothing is wrong with your account.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>If you remember your password, go back and sign in.</li>
          <li>If you are signed in on another device, you can change your password in Settings.</li>
          <li>Otherwise you can create a new account. The old account&apos;s answers cannot be recovered.</li>
          <li>Just looking around? Use &quot;Try the demo&quot; on the sign-in page. It needs no password.</li>
        </ul>
        <p className="flex flex-wrap gap-4">
          <Link href="/sign-in" className="font-medium text-teal-dark underline">
            Back to sign in
          </Link>
          <Link href="/sign-up" className="font-medium text-teal-dark underline">
            Create a new account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
