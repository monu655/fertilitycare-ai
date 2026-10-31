import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { NameForm, PasswordForm } from "@/features/settings/forms";

export const metadata: Metadata = { title: "Settings" };
export const instant = false;

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">Settings</h1>
        <p className="mt-1 text-muted">Manage your account details and password.</p>
      </header>

      <Card className="space-y-4">
        <CardTitle>Profile</CardTitle>
        <p className="text-sm">
          <span className="font-medium text-navy">Email:</span> {user.email}
        </p>
        <p className="text-xs text-muted">
          Changing the email address and email verification are not available yet, because this demo does not send email.
        </p>
        <NameForm currentName={user.name ?? ""} />
      </Card>

      <Card className="space-y-4">
        <CardTitle>Password</CardTitle>
        <PasswordForm />
        <p className="text-xs text-muted">
          Sign-in sessions last 8 hours. After a password change, a session already open on another device keeps working
          until it expires.
        </p>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Privacy and data</CardTitle>
        <p className="text-sm text-muted">Consent choices, data download and deletion are in the Privacy Center.</p>
        <ButtonLink href="/privacy" variant="secondary">
          Open Privacy Center
        </ButtonLink>
      </Card>
    </div>
  );
}
