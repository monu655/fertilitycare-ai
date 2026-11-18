import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { activeProvider } from "@/lib/ai/provider";
import { SOURCES } from "@/data/evidence-library";
import { todayIso } from "@/lib/dates";
import { responsesFor, hasHealthConsent } from "@/features/assessment/queries";
import { latestSubmitted } from "@/features/insights/queries";
import { consentState } from "@/features/privacy/queries";
import { loadHabitEntries } from "@/features/tracker/queries";
import { loadBiomarkers } from "@/features/medical/queries";
import { isGentle } from "@/features/settings/gentle";
import { buildPatternInsights } from "@/features/intelligence/engine";
import { SummaryForm } from "@/features/intelligence/summary-form";

export const metadata: Metadata = { title: "AI Fertility Intelligence" };
export const instant = false;

export default async function IntelligencePage() {
  const user = await requireUser();
  const [health, consent, entries, assessment, labs, gentle] = await Promise.all([
    hasHealthConsent(user.id),
    consentState(user.id),
    loadHabitEntries(user.id),
    latestSubmitted(user.id),
    loadBiomarkers(user.id),
    isGentle(),
  ]);
  const responses = assessment ? await responsesFor(user.id, assessment.id) : null;
  const out = buildPatternInsights({ entries, today: todayIso(), responses, biomarkers: labs });
  const aiOn = Boolean(activeProvider()) && consent.aiTracking;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">AI Fertility Intelligence</h1>
        <p className="mt-1 text-muted">
          Patterns in what you have recorded, explained in simple words. Fixed rules do the analysis. An AI model can only
          rewrite those facts, and only if you allow it.
        </p>
      </header>

      <p role="note" className="rounded-lg bg-teal-light p-3 text-sm text-navy">
        Educational only. These observations do not diagnose anything, predict anything or say a number is good or bad. A
        healthcare professional should interpret your results.
      </p>

      {!health && (
        <Card className="space-y-2" data-testid="intelligence-needs-consent">
          <p className="text-sm">Health consent is needed first. You give it at step 1 of the Health Assessment.</p>
          <Link href="/assessment" className="text-sm font-medium text-teal-dark underline">
            Go to the assessment
          </Link>
        </Card>
      )}

      <Card className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Observations from your data</CardTitle>
          <Badge tone="neutral">Fixed rules, always available</Badge>
        </div>
        <p className="text-sm text-muted" data-testid="days-logged">
          Last {out.windowDays} days: {out.daysLogged} day{out.daysLogged === 1 ? "" : "s"} with entries.{" "}
          <Link href="/tracker" className="font-medium text-teal-dark underline">
            Open the tracker
          </Link>
        </p>
        {out.notes.map((n) => (
          <p key={n} className="text-sm text-muted">
            {n}
          </p>
        ))}
      </Card>

      {gentle && out.insights.length > 0 && (
        <p className="rounded-lg bg-teal-light p-3 text-sm text-navy" data-testid="gentle-hidden">
          Gentle mode is on, so the numbers behind each observation are hidden. Turn it off in Settings to see them.
        </p>
      )}

      <div className="space-y-4">
        {out.insights.map((i) => (
          <Card key={i.id} className="space-y-3" data-testid="pattern-insight">
            <h2 className="text-lg font-semibold text-navy">{i.topic}</h2>
            <p className="text-sm">{i.observation}</p>
            {!gentle && (
              <div>
                <h3 className="text-sm font-semibold text-navy">Your data</h3>
                <ul className="list-disc space-y-0.5 pl-5 text-sm">
                  {i.supportingData.map((f) => (
                    <li key={f.text}>{f.text}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-navy">What this means in general</h3>
              <p className="text-sm">{i.explanation}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-navy">Practical ideas</h3>
              <ul className="list-disc space-y-0.5 pl-5 text-sm">
                {i.suggestions.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <p className="text-sm">
              <span className="font-semibold text-navy">Limits: </span>
              {i.limitations}
            </p>
            <p className="text-sm">
              <span className="font-semibold text-navy">When to talk to a professional: </span>
              {i.whenToConsult}
            </p>
            <p className="text-xs text-muted">
              Sources:{" "}
              {i.sourceIds.map((id, n) => {
                const s = SOURCES.find((x) => x.id === id);
                return s ? (
                  <span key={id}>
                    {n > 0 && ", "}
                    <a href={s.url} className="underline" target="_blank" rel="noreferrer">
                      {s.organization}
                    </a>
                  </span>
                ) : null;
              })}
            </p>
          </Card>
        ))}
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Summary and questions for a professional</CardTitle>
          <Badge tone={aiOn ? "teal" : "neutral"}>{aiOn ? "AI can rewrite, with checks" : "Rules only"}</Badge>
        </div>
        {!consent.aiTracking && (
          <p className="text-sm text-muted">
            AI is off for your tracking data. You can still create a rules-based summary. To allow AI, give separate consent in the{" "}
            <Link href="/privacy" className="font-medium text-teal-dark underline">
              Privacy Center
            </Link>
            .
          </p>
        )}
        <SummaryForm consent={consent.aiTracking} aiOn={Boolean(activeProvider())} hasLabs={labs.length > 0} />
      </Card>
    </div>
  );
}
