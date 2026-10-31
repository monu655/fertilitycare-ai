import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { hasHealthConsent } from "@/features/assessment/queries";
import { SUGGESTED_QUESTIONS, loadSummary } from "@/features/summary/queries";
import { QuestionsForm } from "@/features/summary/questions-form";
import { PrintButton } from "@/features/summary/print-button";

export const metadata: Metadata = { title: "Consultation summary" };
export const instant = false;

const CHOICES = [
  { id: "context", label: "Health context" },
  { id: "lifestyle", label: "Lifestyle" },
  { id: "history", label: "Medical history" },
  { id: "tests", label: "Existing test values" },
  { id: "topics", label: "Topics to discuss" },
  { id: "questions", label: "Questions to ask" },
] as const;

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" });

export default async function SummaryPage({ searchParams }: { searchParams: Promise<{ include?: string | string[]; custom?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;

  if (!(await hasHealthConsent(user.id))) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">Consultation summary</h1>
        <Card className="space-y-3">
          <p className="text-sm">A summary uses your health answers, and health consent is currently not given.</p>
          <ButtonLink href="/privacy" variant="secondary">
            Open Privacy Center
          </ButtonLink>
        </Card>
      </div>
    );
  }

  const data = await loadSummary(user.id);
  if (!data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">Consultation summary</h1>
        <Card className="space-y-3">
          <p className="text-sm">Submit your health assessment first. Your summary is built from it.</p>
          <ButtonLink href="/assessment">Go to the assessment</ButtonLink>
        </Card>
      </div>
    );
  }

  // First visit: everything is included. After "Update preview": only what the person ticked.
  const picked = Array.isArray(params.include) ? params.include : params.include ? [params.include] : [];
  const included = new Set<string>(params.custom === "1" ? picked : CHOICES.map((c) => c.id));

  return (
    <div className="space-y-6">
      <header className="print:hidden">
        <h1 className="text-3xl font-bold text-navy">Consultation summary</h1>
        <p className="mt-1 text-muted">
          A one-page summary you can take to a healthcare professional. Nothing is shared or sent anywhere. You choose what to
          include, then print it yourself.
        </p>
      </header>

      <Card className="space-y-4 print:hidden">
        <CardTitle>1. Choose what to include</CardTitle>
        <form method="get" action="/summary" className="space-y-3">
          <input type="hidden" name="custom" value="1" />
          <fieldset className="grid gap-2 sm:grid-cols-2">
            <legend className="sr-only">Sections to include</legend>
            {CHOICES.map((c) => (
              <label key={c.id} className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm">
                <input type="checkbox" name="include" value={c.id} defaultChecked={included.has(c.id)} className="h-5 w-5 accent-[#0e8a7c]" />
                {c.label}
              </label>
            ))}
          </fieldset>
          <Button type="submit" variant="secondary">
            Update preview
          </Button>
        </form>
      </Card>

      <Card className="space-y-3 print:hidden">
        <CardTitle>2. Add your own questions</CardTitle>
        <QuestionsForm saved={data.userQuestions} />
      </Card>

      <section aria-labelledby="preview-title" className="space-y-4">
        <h2 id="preview-title" className="text-lg font-semibold text-navy print:hidden">
          3. Preview
        </h2>
        <article className="space-y-5 rounded-[14px] border border-border bg-white p-6 print:border-0 print:p-0" data-testid="summary-preview">
          <header className="space-y-1 border-b border-border pb-3">
            <h2 className="text-2xl font-bold text-navy">Consultation preparation summary</h2>
            <p className="text-sm text-muted">
              Prepared by the patient using FertilityCare AI on {dateFormat.format(new Date())}
              {data.submittedAt ? `, from an assessment submitted ${dateFormat.format(data.submittedAt)}` : ""}.
            </p>
            <p className="text-sm font-medium text-text">
              Self-reported and not verified. This is not a diagnosis and not a medical record.
            </p>
          </header>

          {data.sections
            .filter((s) => included.has(s.id))
            .map((s) => (
              <section key={s.id} className="space-y-1">
                <h3 className="font-semibold text-navy">{s.title}</h3>
                {s.rows.length === 0 ? (
                  <p className="text-sm text-muted">Nothing answered in this section.</p>
                ) : (
                  <dl className="divide-y divide-border text-sm">
                    {s.rows.map((r) => (
                      <div key={r.label} className="grid gap-1 py-1.5 sm:grid-cols-[2fr_1fr]">
                        <dt className="text-muted">{r.label}</dt>
                        <dd className="font-medium">{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {s.id === "tests" && s.rows.length > 0 && (
                  <p className="text-xs text-muted">Values were typed by the patient. Please see the original laboratory report.</p>
                )}
              </section>
            ))}

          {included.has("topics") && (
            <section className="space-y-1">
              <h3 className="font-semibold text-navy">Topics the patient may wish to discuss</h3>
              {data.topics.length === 0 ? (
                <p className="text-sm text-muted">None listed.</p>
              ) : (
                <ul className="list-disc space-y-0.5 pl-5 text-sm">
                  {data.topics.map((t) => (
                    <li key={t.topic}>{t.topic}</li>
                  ))}
                </ul>
              )}
              <p className="text-xs text-muted">These come from general educational information, not from an assessment of the patient.</p>
            </section>
          )}

          {included.has("questions") && (
            <section className="space-y-1">
              <h3 className="font-semibold text-navy">Questions to ask</h3>
              <ul className="list-disc space-y-0.5 pl-5 text-sm">
                {[...data.userQuestions, ...SUGGESTED_QUESTIONS].map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </section>

      <Card className="space-y-3 print:hidden">
        <div className="flex items-center gap-2">
          <CardTitle>4. Print or save</CardTitle>
          <Badge tone="neutral">Only you can do this</Badge>
        </div>
        <PrintButton />
        <p className="text-xs text-muted">In the print window, choose &quot;Save as PDF&quot; if you want a file.</p>
      </Card>
    </div>
  );
}
