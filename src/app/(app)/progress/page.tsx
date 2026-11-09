import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { startNewAssessmentAction } from "@/features/assessment/actions";
import { isGentle } from "@/features/settings/gentle";
import { loadProgress } from "@/features/progress/queries";
import { LineChart } from "@/features/progress/line-chart";

export const metadata: Metadata = { title: "My progress" };
export const instant = false;

export default async function ProgressPage() {
  const user = await requireUser();
  const [data, gentle] = await Promise.all([loadProgress(user.id), isGentle()]);

  if (data.dates.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">My progress</h1>
        <Card className="space-y-3">
          <p className="text-sm">Submit your health assessment first. This page lines up your answers over time.</p>
          <ButtonLink href="/assessment">Go to the assessment</ButtonLink>
        </Card>
      </div>
    );
  }

  const seriesWithData = data.lab.filter((s) => s.points.length > 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">My progress</h1>
        <p className="mt-1 text-muted">Your own answers from each submitted assessment, side by side.</p>
      </header>

      <p role="note" className="rounded-lg bg-teal-light p-3 text-sm text-navy">
        This page only lines your answers up. It does not say whether a change is good or bad, and it does not judge any
        number. A healthcare professional can explain what your results mean.
      </p>

      {data.dates.length === 1 && (
        <Card className="space-y-3" data-testid="progress-single">
          <p className="text-sm">
            You have one submitted assessment so far. Start a new one later to see what has changed. Your earlier answers are kept.
          </p>
        </Card>
      )}

      <Card className="space-y-3">
        <CardTitle>Lifestyle answers over time</CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm" data-testid="lifestyle-table">
            <caption className="sr-only">Lifestyle answers for each submitted assessment</caption>
            <thead>
              <tr className="text-left text-muted">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Question
                </th>
                {data.dates.map((d, i) => (
                  <th key={`${d}-${i}`} scope="col" className="py-2 pr-4 font-medium">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.lifestyle.map((row) => (
                <tr key={row.label} className="border-t border-border align-top">
                  <th scope="row" className="py-2 pr-4 text-left font-normal text-muted">
                    {row.label}
                  </th>
                  {row.cells.map((c, i) => (
                    <td key={i} className="py-2 pr-4">
                      {c.text}
                      {c.changed && (
                        <>
                          {" "}
                          <Badge tone="neutral">Changed</Badge>
                        </>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-4">
        <CardTitle>Test values you entered</CardTitle>
        {gentle ? (
          <p className="text-sm text-muted" data-testid="gentle-hidden">
            Gentle mode is on, so your test numbers are hidden here. You can turn it off in Settings.
          </p>
        ) : seriesWithData.length === 0 ? (
          <p className="text-sm text-muted">You have not entered any test values. That is fine, every question is optional.</p>
        ) : (
          <>
            {seriesWithData.map((s) => (
              <LineChart key={s.name} title={s.label} unit={s.unit} points={s.points} />
            ))}
            <p className="text-xs text-muted">
              These are only the numbers you typed from your own report. No normal range is drawn, because different
              laboratories and clinicians use different ones.
            </p>
          </>
        )}
      </Card>

      <Card className="space-y-3">
        <CardTitle>Update your answers</CardTitle>
        <p className="text-sm text-muted">Start a new assessment when something has changed. Your earlier ones stay here.</p>
        <form action={startNewAssessmentAction}>
          <Button type="submit" variant="secondary">
            Start a new assessment
          </Button>
        </form>
      </Card>
    </div>
  );
}
