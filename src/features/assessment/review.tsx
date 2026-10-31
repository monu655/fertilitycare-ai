import Link from "next/link";
import { submitAssessmentAction } from "./actions";
import { SubmitButton } from "./submit-button";
import { SECTIONS, optionLabel } from "./questions";

// Read-only summary of everything the user entered, with an Edit link per section.
export function ReviewPanel({ responses }: { responses: Record<string, Record<string, unknown>> }) {
  const missingAge = !responses.context?.ageRange;

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => (
        <section key={section.id} aria-labelledby={`rev-${section.id}`} className="rounded-xl border border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 id={`rev-${section.id}`} className="font-semibold text-navy">
              {section.title}
            </h3>
            <Link href={`/assessment?step=${section.step}`} className="text-sm font-medium text-teal-dark underline">
              Edit<span className="sr-only"> {section.title}</span>
            </Link>
          </div>
          <dl className="mt-3 space-y-2 text-sm">
            {section.fields.map((f) => (
              <div key={f.name} className="grid gap-1 sm:grid-cols-[1.4fr_1fr]">
                <dt className="text-muted">{f.label}</dt>
                <dd className="font-medium text-text">{optionLabel(f, responses[section.id]?.[f.name])}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      {missingAge && (
        <p role="alert" className="rounded-lg bg-warning-bg p-3 text-sm font-medium text-warning">
          Your age range is required before you can submit. Please use Edit on Basic health context.
        </p>
      )}

      <form action={submitAssessmentAction} className="flex flex-wrap items-center gap-3">
        <Link
          href="/assessment?step=5"
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-5 text-sm font-semibold text-navy hover:bg-teal-light"
        >
          Back
        </Link>
        <SubmitButton>Submit assessment</SubmitButton>
        <p className="text-xs text-muted">Submitting does not share your answers with anyone.</p>
      </form>
    </div>
  );
}
