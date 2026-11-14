import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { activeProvider } from "@/lib/ai/provider";
import { EVIDENCE_VERSION, SOURCES } from "@/data/evidence-library";
import { runGuardrails } from "@/features/trust/evaluate";

export const metadata: Metadata = { title: "Safety card" };
export const instant = false;

// Reads the server setting when the page is requested, so the card always matches how the server is set up right now.
async function AiStatus() {
  await connection();
  const provider = activeProvider();
  return (
    <p data-testid="ai-status" className="text-sm">
      <strong className="text-navy">AI on this server right now: </strong>
      {provider
        ? "Switched on. It is still used only for people who gave a separate AI consent, and every reply passes the four checks below."
        : "Switched off. Every answer comes straight from the source library, with no AI."}
    </p>
  );
}

export default function SafetyCardPage() {
  const results = runGuardrails();
  const normal = results.filter((r) => !r.knownGap);
  const gaps = results.filter((r) => r.knownGap);
  const passed = normal.filter((r) => r.passed).length;

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 space-y-6 px-5 py-12">
        <header>
          <h1 className="text-3xl font-bold text-navy">Safety card</h1>
          <p className="mt-1 text-muted">
            One page that says what FertilityCare AI is, what it is not, where data goes, and what has and has not been tested.
          </p>
          <div className="mt-3">
            <Badge tone="warning">Prototype. Not a medical device. No clinical validation yet.</Badge>
          </div>
        </header>

        <Card className="space-y-2" data-testid="card-purpose">
          <CardTitle>What it is for</CardTitle>
          <p className="text-sm text-muted">
            General education about male reproductive health, with links to named public-health sources, and help to prepare
            for a conversation with a healthcare professional. It is meant for adults.
          </p>
        </Card>

        <Card className="space-y-2" data-testid="card-not">
          <CardTitle>What it does not do</CardTitle>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>It does not diagnose any condition, and it does not say if a person is or is not infertile.</li>
            <li>It does not predict fertility or pregnancy outcomes.</li>
            <li>It does not recommend medicines, supplements or doses.</li>
            <li>It does not say a test number is normal or abnormal, and it draws no normal range.</li>
            <li>It is not for emergencies. Urgent symptoms get a message to seek urgent care first.</li>
          </ul>
        </Card>

        <Card className="space-y-3" data-testid="card-how">
          <CardTitle>How answers are made</CardTitle>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>
              <strong className="text-navy">Insight cards</strong> come from a fixed rules engine, not from AI. Each card links
              to its sources and states its limits.
            </li>
            <li>
              <strong className="text-navy">Ask a Question</strong> sorts each question as urgent, refused or ok. Ok questions
              are answered only from the source library ({SOURCES.length} source pages, checked on the dates shown on the
              Health Resources page; library version {EVIDENCE_VERSION}).
            </li>
            <li>
              <strong className="text-navy">AI is optional.</strong> It only rewrites the source passages it is given, and
              only if the server has it switched on and the person gave a separate AI consent.
            </li>
            <li>
              <strong className="text-navy">Four checks on every AI reply:</strong> expected format, long enough, no
              diagnosis, medicine, dosing or prediction wording, and no number that is not in the sources. If one fails, the
              plain source passages are shown instead.
            </li>
          </ul>
          <Suspense fallback={null}>
            <AiStatus />
          </Suspense>
        </Card>

        <Card className="space-y-2" data-testid="card-data">
          <CardTitle>Where your data goes</CardTitle>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Health answers are stored in the app&apos;s database, apart from identity data, and belong only to you.</li>
            <li>Consent is recorded per purpose. You can withdraw it, download your data, and delete your data or account.</li>
            <li>Questions typed into Ask a Question are not stored.</li>
            <li>
              If AI is used, only coded answers or the cleaned question plus source titles are sent. Names, emails and phone
              numbers are removed first. Under every answer you can see what was sent, or that nothing was.
            </li>
            <li>The activity log shows events such as sign-in and downloads. It never contains health answers.</li>
          </ul>
        </Card>

        <Card className="space-y-2" data-testid="card-tested">
          <CardTitle>What has been tested</CardTitle>
          <p className="text-sm text-muted" data-testid="card-live-count">
            {passed} of {normal.length} safety cases pass right now, worked out live against the real code, plus {gaps.length}{" "}
            known gap{gaps.length === 1 ? "" : "s"} listed openly.{" "}
            <Link href="/how-we-test" className="font-medium text-teal-dark underline">
              See every case
            </Link>
            .
          </p>
          <p className="text-sm text-muted">
            The developer also ran automated unit tests and end-to-end tests (desktop and phone sizes) in a development setup.
            AI was tried with the real service by hand only once.
          </p>
        </Card>

        <Card className="space-y-2" data-testid="card-limits">
          <CardTitle>What has not been done</CardTitle>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>No doctor has reviewed the wording yet, and there has been no study with real users.</li>
            <li>No legal or data-protection review, and no independent security review. No compliance with any law or standard is claimed.</li>
            <li>The safety rules do not catch misspelt questions or most other languages.</li>
            <li>Email verification and password reset are not built. The app sends no emails.</li>
            <li>The app is in English only and has not been checked across different groups of people.</li>
            <li>A full accessibility audit with assistive technology has not been done.</li>
          </ul>
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
