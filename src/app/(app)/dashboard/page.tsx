import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { ArrowRight, ClipboardList, FileText, Lightbulb } from "lucide-react";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Overview" };
export const instant = false;

export default async function DashboardPage() {
  const user = await requireUser();

  // Always filter by the signed-in user's id. Never trust an id from the URL here.
  const [assessment] = await db
    .select()
    .from(schema.assessments)
    .where(eq(schema.assessments.userId, user.id))
    .orderBy(desc(schema.assessments.updatedAt))
    .limit(1);

  const [consent] = await db
    .select()
    .from(schema.consentRecords)
    .where(and(eq(schema.consentRecords.userId, user.id), eq(schema.consentRecords.purpose, "HEALTH_ASSESSMENT")))
    .orderBy(desc(schema.consentRecords.createdAt))
    .limit(1);

  const hasConsent = consent?.granted === true;
  const submitted = assessment?.status === "SUBMITTED";
  const inProgress = assessment?.status === "IN_PROGRESS";

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-navy">Welcome, {user.name ?? "there"}</h1>
        <p className="mt-1 text-muted">Your health journey matters. Take the next step at your own pace.</p>
      </header>

      <section aria-labelledby="next-step" className="rounded-[14px] border border-border bg-white p-6">
        <h2 id="next-step" className="text-sm font-semibold uppercase tracking-wide text-muted">
          Your next step
        </h2>
        <p className="mt-2 text-lg font-semibold text-navy">
          {submitted
            ? "Review your insights and prepare for a conversation with a healthcare professional."
            : inProgress
              ? `Continue your assessment (step ${assessment.currentStep} of 6).`
              : "Start your private assessment when you are ready. Every sensitive question is optional."}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href={submitted ? "/insights" : "/assessment"}>
            {submitted ? "View insights" : inProgress ? "Continue assessment" : "Start assessment"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        <Card>
          <ClipboardList className="h-6 w-6 text-teal-dark" aria-hidden="true" />
          <CardTitle className="mt-3">Assessment</CardTitle>
          <p className="mt-1 text-sm text-muted">
            {submitted ? "Completed" : inProgress ? "In progress" : "Not started"}
          </p>
          <Badge tone={submitted ? "success" : inProgress ? "warning" : "neutral"} className="mt-3">
            {submitted ? "Completed" : inProgress ? "In progress" : "Not started"}
          </Badge>
        </Card>
        <Card>
          <Lightbulb className="h-6 w-6 text-teal-dark" aria-hidden="true" />
          <CardTitle className="mt-3">Insights</CardTitle>
          <p className="mt-1 text-sm text-muted">
            {submitted ? "Educational insights are ready to read." : "Available after you submit an assessment."}
          </p>
        </Card>
        <Card>
          <FileText className="h-6 w-6 text-teal-dark" aria-hidden="true" />
          <CardTitle className="mt-3">Consultation summary</CardTitle>
          <p className="mt-1 text-sm text-muted">
            {submitted ? "Preview a summary before you export or share anything." : "Available after you submit an assessment."}
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle>Privacy and consent</CardTitle>
        <p className="mt-2 text-sm text-muted">
          {hasConsent
            ? "You have given consent for health assessment processing. You can withdraw it at any time in the Privacy Center."
            : "You have not given consent yet. You will be asked before any sensitive question is processed."}
        </p>
        <Badge tone={hasConsent ? "success" : "neutral"} className="mt-3">
          {hasConsent ? "Consent given" : "No consent on record"}
        </Badge>
      </Card>
    </div>
  );
}
