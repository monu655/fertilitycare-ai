"use client";

import { useActionState } from "react";
import { Check, Minus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { explainFallback } from "@/features/ask/constants";
import { intelligenceAction, type IntelligenceState } from "./actions";

const initial: IntelligenceState = {};

export function SummaryForm({ consent, aiOn, hasLabs }: { consent: boolean; aiOn: boolean; hasLabs: boolean }) {
  const [state, action, pending] = useActionState(intelligenceAction, initial);
  const r = state.result;

  return (
    <div className="space-y-4">
      <form action={action} className="space-y-3" data-testid="intelligence-form">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-navy">Choose what may be included</legend>
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm">
            <input type="checkbox" name="include" value="habits" defaultChecked className="h-5 w-5 accent-[#0e8a7c]" />
            My daily tracker numbers (averages and counts, no dates)
          </label>
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm">
            <input type="checkbox" name="include" value="assessment" defaultChecked className="h-5 w-5 accent-[#0e8a7c]" />
            My assessment answers (coded choices only)
          </label>
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-border px-3 text-sm">
            <input type="checkbox" name="include" value="labs" className="h-5 w-5 accent-[#0e8a7c]" />
            My lab values{hasLabs ? "" : " (you have none saved)"}. Off unless you tick it.
          </label>
        </fieldset>
        <p className="text-xs text-muted">
          {consent && aiOn
            ? "Only the ticked groups are sent, and you will see exactly what was sent below. Names, emails, notes and dates are never sent."
            : "Without both the AI switch on the server and your AI tracking-data consent, nothing is sent and you get the rules-based summary."}
        </p>
        <Button type="submit" loading={pending}>
          {consent && aiOn ? "Create AI summary" : "Create summary"}
        </Button>
        {state.message && (
          <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm font-medium text-danger">
            {state.message}
          </p>
        )}
      </form>

      {r && (
        <section aria-live="polite" aria-label="Summary" className="space-y-4" data-testid="intelligence-result" data-mode={r.mode}>
          <div className="space-y-2 rounded-[14px] border border-border bg-white p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-navy">Summary</h3>
              <Badge tone={r.mode === "ai" ? "success" : "neutral"}>{r.mode === "ai" ? "AI-assisted, checked" : "Built by fixed rules"}</Badge>
            </div>
            {r.fallbackReason && <p className="text-xs text-muted">{explainFallback(r.fallbackReason)}</p>}
            <p className="text-sm">{r.overview}</p>
            <h4 className="pt-2 text-sm font-semibold text-navy">Questions you could ask a healthcare professional</h4>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              {r.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
            <p className="text-xs text-muted">Educational only. This is not a diagnosis and says nothing about your fertility. A healthcare professional should interpret everything.</p>
          </div>

          <details className="rounded-lg border border-border bg-white p-3 text-sm" data-testid="intelligence-checks">
            <summary className="cursor-pointer font-medium text-navy">Safety checks on the AI reply</summary>
            <ul className="mt-2 space-y-1">
              {r.checks.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  {c.status === "passed" ? (
                    <Check className="h-4 w-4 text-success" aria-hidden="true" />
                  ) : c.status === "failed" ? (
                    <X className="h-4 w-4 text-danger" aria-hidden="true" />
                  ) : (
                    <Minus className="h-4 w-4 text-muted" aria-hidden="true" />
                  )}
                  <span>
                    {c.label}: <span className="font-medium">{c.status === "passed" ? "passed" : c.status === "failed" ? "failed" : "not run"}</span>
                  </span>
                </li>
              ))}
            </ul>
          </details>

          <details className="rounded-lg border border-border bg-white p-3 text-sm" data-testid="intelligence-receipt" open>
            <summary className="cursor-pointer font-medium text-navy">What was sent to an AI service</summary>
            {r.receipt.sent ? (
              <div className="mt-2 space-y-2">
                <p>Groups included: {r.receipt.included.join(", ") || "none"}. These exact lines were sent:</p>
                <ul className="list-disc space-y-0.5 pl-5">
                  {r.receipt.facts.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted">Not sent: your name, email, notes, exact dates, or anything you did not tick.</p>
              </div>
            ) : (
              <p className="mt-2" data-testid="receipt-nothing-sent">
                Nothing was sent to any AI service.
              </p>
            )}
          </details>
        </section>
      )}
    </div>
  );
}
