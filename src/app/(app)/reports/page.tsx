import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { longDate, shortDate, todayIso } from "@/lib/dates";
import { hasHealthConsent } from "@/features/assessment/queries";
import { isGentle } from "@/features/settings/gentle";
import { LineChart } from "@/features/progress/line-chart";
import { loadBiomarkers, seriesFor } from "@/features/medical/queries";
import { deleteBiomarkerAction } from "@/features/medical/actions";
import { ReportForm } from "@/features/medical/report-form";
import { CATEGORY_LABEL, MARKERS, markerByKey } from "@/features/medical/markers";

export const metadata: Metadata = { title: "Medical reports" };
export const instant = false;

export default async function ReportsPage() {
  const user = await requireUser();
  const [consent, records, gentle] = await Promise.all([hasHealthConsent(user.id), loadBiomarkers(user.id), isGentle()]);
  const series = seriesFor(records);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">Medical reports</h1>
        <p className="mt-1 text-muted">Optionally keep the values from your own semen analysis and hormone blood tests, and see them side by side over time.</p>
      </header>

      <p role="note" className="rounded-lg bg-teal-light p-3 text-sm text-navy" data-testid="report-warning">
        Laboratory results need to be interpreted by a qualified healthcare professional. This page does not diagnose anything, does not
        say if a value is normal or abnormal, and does not decide anything about fertility. Results from one sample can vary and may
        need repeating (MedlinePlus). Every box here is optional.
      </p>

      {!consent && (
        <Card className="space-y-3" data-testid="reports-needs-consent">
          <p className="text-sm">Health consent is needed before you can save lab values. You give it at step 1 of the Health Assessment.</p>
          <ButtonLink href="/assessment">Go to the assessment</ButtonLink>
        </Card>
      )}

      <Card className="space-y-3">
        <CardTitle>Add a value</CardTitle>
        <ReportForm today={todayIso()} />
      </Card>

      <Card className="space-y-3">
        <CardTitle>Your saved values</CardTitle>
        {records.length === 0 ? (
          <p className="text-sm text-muted">Nothing saved yet. That is fine. You can add values whenever you have a report.</p>
        ) : gentle ? (
          <p className="text-sm text-muted" data-testid="gentle-hidden">
            Gentle mode is on, so your lab numbers are hidden here. {records.length} value{records.length === 1 ? "" : "s"} saved. Turn it off in Settings to see them.
          </p>
        ) : (
          <div className="space-y-6">
            {series.map((s) => {
              const def = markerByKey(s.marker);
              const prev = s.rows.length > 1 ? s.rows[s.rows.length - 2] : null;
              const last = s.rows[s.rows.length - 1];
              return (
                <section key={`${s.marker}-${s.unit}`} className="space-y-3 border-t border-border pt-4 first:border-0 first:pt-0" data-testid="report-series">
                  <h3 className="font-semibold text-navy">
                    {def?.label ?? s.marker} <span className="font-normal text-muted">({s.unit})</span>
                  </h3>
                  {prev && (
                    <p className="text-sm text-muted">
                      Latest value {last.value} on {shortDate(last.takenOn)}. The one before was {prev.value} on {shortDate(prev.takenOn)}. This only shows the numbers.
                    </p>
                  )}
                  {s.rows.length > 1 && <LineChart title={def?.label ?? s.marker} unit={s.unit} points={s.rows.map((r) => ({ date: shortDate(r.takenOn), value: r.value }))} />}
                  <ul className="divide-y divide-border text-sm">
                    {[...s.rows].reverse().map((r) => (
                      <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                        <div>
                          <p className="font-medium">
                            {r.value} {r.unit} <span className="font-normal text-muted">on {longDate(r.takenOn)}</span>
                          </p>
                          {(r.refLow !== null || r.refHigh !== null) && (
                            <p className="text-muted">
                              Range printed on your lab report (as you typed it): {r.refLow ?? "–"} to {r.refHigh ?? "–"} {r.unit}
                            </p>
                          )}
                          {r.notes && <p className="text-muted">Note: {r.notes}</p>}
                        </div>
                        <form action={deleteBiomarkerAction}>
                          <input type="hidden" name="id" value={r.id} />
                          <Button type="submit" variant="danger" aria-label={`Delete ${def?.label ?? r.marker} from ${shortDate(r.takenOn)}`}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                          </Button>
                        </form>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="space-y-3">
        <CardTitle>What the terms mean</CardTitle>
        {(["semen", "hormone"] as const).map((cat) => (
          <div key={cat} className="space-y-1">
            <h3 className="text-sm font-semibold text-navy">{CATEGORY_LABEL[cat]}</h3>
            <dl className="divide-y divide-border text-sm">
              {MARKERS.filter((m) => m.category === cat).map((m) => (
                <div key={m.key} className="grid gap-1 py-1.5 sm:grid-cols-[2fr_3fr]">
                  <dt className="font-medium">{m.label}</dt>
                  <dd className="text-muted">{m.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        <p className="text-xs text-muted">
          About reference ranges: laboratories and clinicians use different ranges, so this app shows no range of its own. If your report
          prints one, you can type it next to the value, and it is shown back to you exactly as typed. Our source library does not yet
          contain a page on hormone blood tests, so hormone terms are only named, not explained further.
        </p>
      </Card>
    </div>
  );
}
