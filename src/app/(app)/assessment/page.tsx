import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { AssessmentProgress } from "@/features/assessment/progress";
import { ConsentForm } from "@/features/assessment/consent-form";
import { StepForm } from "@/features/assessment/step-form";
import { ReviewPanel } from "@/features/assessment/review";
import { startNewAssessmentAction } from "@/features/assessment/actions";
import { hasHealthConsent, latestAssessment, responsesFor } from "@/features/assessment/queries";
import { TOTAL_STEPS, sectionByStep } from "@/features/assessment/questions";

export const metadata: Metadata = { title: "Health assessment" };
export const instant = false;

export default async function AssessmentPage({ searchParams }: { searchParams: Promise<{ step?: string }> }) {
  const user = await requireUser();
  const { step: stepParam } = await searchParams;

  const [latest, consent] = await Promise.all([latestAssessment(user.id), hasHealthConsent(user.id)]);

  // Already submitted: offer to view insights or start a new one.
  if (latest?.status === "SUBMITTED") {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">Health assessment</h1>
        <Card className="space-y-4">
          <p className="font-semibold text-navy">Your assessment has been submitted.</p>
          <p className="text-sm text-muted">You can read your insights, or start a new assessment if things have changed.</p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/insights">View insights</ButtonLink>
            <form action={startNewAssessmentAction}>
              <Button type="submit" variant="secondary">
                Start a new assessment
              </Button>
            </form>
          </div>
        </Card>
      </div>
    );
  }

  // The furthest step the user may open. Without consent that is only step 1.
  const maxStep = consent ? Math.min(TOTAL_STEPS, Math.max(2, latest?.currentStep ?? 2)) : 1;
  const wanted = Number.parseInt(stepParam ?? "", 10);
  const step = Number.isFinite(wanted) ? Math.min(Math.max(wanted, 1), maxStep) : maxStep;

  const responses = latest ? await responsesFor(user.id, latest.id) : {};
  const section = sectionByStep(step);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">Health assessment</h1>
        <p className="mt-1 text-muted">Private and optional. Stop at any time, your progress is kept.</p>
      </header>

      <AssessmentProgress current={step} maxStep={maxStep} />

      <Card>
        {step === 1 && (
          <>
            <h2 className="mb-4 text-xl font-semibold text-navy">Introduction and consent</h2>
            <ConsentForm />
          </>
        )}
        {section && (
          <>
            <h2 className="text-xl font-semibold text-navy">{section.title}</h2>
            <p className="mb-5 mt-1 text-sm text-muted">{section.intro}</p>
            <StepForm key={section.id} section={section} saved={responses[section.id]} />
          </>
        )}
        {step === TOTAL_STEPS && (
          <>
            <h2 className="mb-1 text-xl font-semibold text-navy">Review your answers</h2>
            <p className="mb-5 text-sm text-muted">Check everything. You can edit any section before you submit.</p>
            <ReviewPanel responses={responses} />
          </>
        )}
      </Card>

      <p className="text-xs text-muted">
        Educational information only. See the{" "}
        <Link href="/privacy-policy" className="underline">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}
