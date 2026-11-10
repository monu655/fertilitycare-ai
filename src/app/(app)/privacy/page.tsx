import type { Metadata } from "next";
import { Download } from "lucide-react";
import { requireUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { consentState, recentActivity } from "@/features/privacy/queries";
import { ACTION_LABELS } from "@/features/privacy/activity-labels";
import { AiConsentForm, DeleteAccountForm, DeleteAssessmentsForm, WithdrawConsentForm } from "@/features/privacy/forms";

export const metadata: Metadata = { title: "Privacy Center" };
export const instant = false;

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });

export default async function PrivacyPage() {
  const user = await requireUser();
  const consent = await consentState(user.id);
  const activity = await recentActivity(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">Privacy Center</h1>
        <p className="mt-1 text-muted">See what you agreed to, download your data, or delete it. You stay in control.</p>
      </header>

      <Card className="space-y-4">
        <CardTitle>Your consent</CardTitle>
        <div className="space-y-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-navy">Health assessment:</strong>
            <Badge tone={consent.health ? "success" : "neutral"}>{consent.health ? "Given" : "Not given"}</Badge>
            {consent.healthAt && <span className="text-muted">Last changed {dateFormat.format(consent.healthAt)} UTC</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-navy">AI-generated notes:</strong>
            <Badge tone={consent.ai ? "success" : "neutral"}>{consent.ai ? "Allowed" : "Off"}</Badge>
            {consent.aiAt && <span className="text-muted">Last changed {dateFormat.format(consent.aiAt)} UTC</span>}
          </div>
          <p className="text-muted">
            AI notes are optional and also need the server to have AI switched on. When allowed, only coded answers are sent
            (no name, email or free text).
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <AiConsentForm granted={consent.ai} />
          <WithdrawConsentForm granted={consent.health} />
        </div>
        {consent.health && (
          <p className="text-xs text-muted">
            Withdrawing stops new answers from being saved. It does not delete data you already entered. Use the delete
            options below for that. You can agree again later at step 1 of the Health Assessment.
          </p>
        )}
      </Card>

      <Card className="space-y-3">
        <CardTitle>Download your data</CardTitle>
        <p className="text-sm text-muted">
          Get a copy of what we hold about you: account details, consent history, answers, insights, saved questions and
          activity log. It never includes your password. The file contains health information, so keep it somewhere private.
        </p>
        <div className="flex flex-wrap gap-3">
          <form method="post" action="/api/privacy/export">
            <input type="hidden" name="format" value="text" />
            <Button type="submit" variant="secondary">
              <Download className="h-4 w-4" aria-hidden="true" /> Download readable copy (.txt)
            </Button>
          </form>
          <form method="post" action="/api/privacy/export">
            <input type="hidden" name="format" value="json" />
            <Button type="submit" variant="ghost">
              Technical copy (.json)
            </Button>
          </form>
        </div>
        <p className="text-xs text-muted">
          The readable copy opens in Notepad and uses plain sentences. The technical copy has the same data in a format
          that other software can read.
        </p>
      </Card>

      <Card className="space-y-3">
        <CardTitle>Delete assessment data</CardTitle>
        <p className="text-sm text-muted">
          Permanently removes all your assessments, answers, insights and saved consultation questions. Your account and
          consent history stay.
        </p>
        <DeleteAssessmentsForm />
      </Card>

      <Card className="space-y-3 border-danger">
        <CardTitle>Delete account</CardTitle>
        <p className="text-sm text-muted">
          Permanently removes your account and every record linked to it, then signs you out. We keep one small log entry
          (an anonymous id, the action name and the time, with no health content) to show that the deletion happened.
        </p>
        <DeleteAccountForm />
      </Card>

      <Card className="space-y-3">
        <CardTitle>Recent activity on your account</CardTitle>
        {activity.length === 0 ? (
          <p className="text-sm text-muted">Nothing recorded yet.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {activity.map((a, i) => (
              <li key={`${a.action}-${i}`} className="flex justify-between gap-4">
                <span>{ACTION_LABELS[a.action] ?? a.action}</span>
                <span className="text-muted">{dateFormat.format(a.createdAt)} UTC</span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-sm">
          <Link href="/privacy/activity" className="font-medium text-teal-dark underline">
            See all activity
          </Link>
        </p>
        <p className="text-xs text-muted">
          This demo keeps no separate backup copies. A real deployment must define how long backups are kept, and that
          must be reviewed before launch.
        </p>
      </Card>
    </div>
  );
}
