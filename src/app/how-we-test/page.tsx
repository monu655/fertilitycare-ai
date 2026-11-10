import type { Metadata } from "next";
import { Check, X } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/app/app-shell";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Card, CardTitle } from "@/components/ui/card";
import { runGuardrails, type GuardrailResult } from "@/features/trust/evaluate";

export const metadata: Metadata = { title: "How we test safety" };
export const instant = false;

const QUESTION_TEXT: Record<string, string> = {
  urgent: "Emergency guidance, no AI",
  refused: "Politely refused",
  ok: "Answered from the sources",
};
const CHECK_TEXT: Record<string, string> = {
  none: "Accepted",
  format: "Rejected: wrong format",
  length: "Rejected: too short or empty",
  safety: "Rejected: unsafe wording",
  numbers: "Rejected: number not in the sources",
};

function describe(r: GuardrailResult, value: string): string {
  if (r.kind === "question") return QUESTION_TEXT[value] ?? value;
  if (r.kind === "reply") return CHECK_TEXT[value] ?? value;
  return value === "removed" ? "Removed before sending" : "Still present";
}

export default async function HowWeTestPage() {
  // These run on every page load, against the same functions the app uses on each question.
  const results = runGuardrails();
  const normal = results.filter((r) => !r.knownGap);
  const gaps = results.filter((r) => r.knownGap);
  const passed = normal.filter((r) => r.passed).length;
  const groups = [...new Set(normal.map((r) => r.group))];

  const content = (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">How we test safety</h1>
        <p className="mt-1 text-muted">
          Health apps should show their safety checks, not only say they are safe. Below are the test cases we run on our own
          rules, with the real result of each one.
        </p>
      </header>

      <Card className="space-y-2" data-testid="guardrail-summary">
        <p className="text-2xl font-bold text-navy">
          {passed} of {normal.length} checks passed
        </p>
        <p className="text-sm text-muted">
          These results are worked out live when you open this page, by the same code the app runs on every question. The same
          list is also run as automated tests before each release, so a failing case would stop the release.
        </p>
      </Card>

      <p role="note" className="rounded-lg bg-warning-bg p-3 text-sm text-warning">
        <strong>What this does not prove.</strong> It tests our own rules and checks, using made-up questions and made-up AI
        replies. It does not test the AI model itself, and a short list of cases cannot cover every sentence a person might
        type. It is not a clinical or regulatory test.
      </p>

      {groups.map((group) => (
        <Card key={group} className="space-y-3">
          <CardTitle>{group}</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <caption className="sr-only">{group}</caption>
              <thead>
                <tr className="text-left text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    What was tried
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    What should happen
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    What happened
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {normal
                  .filter((r) => r.group === group)
                  .map((r) => (
                    <tr key={r.id} className="border-t border-border align-top" data-testid="guardrail-row" data-passed={r.passed}>
                      <td className="py-2 pr-4">
                        {r.note && <span className="block text-xs text-muted">{r.note}</span>}
                        <q>{r.input.length > 140 ? `${r.input.slice(0, 140)}…` : r.input}</q>
                      </td>
                      <td className="py-2 pr-4">{describe(r, r.expected)}</td>
                      <td className="py-2 pr-4">{describe(r, r.actual)}</td>
                      <td className="py-2">
                        {r.passed ? (
                          <span className="inline-flex items-center gap-1 font-medium text-success">
                            <Check className="h-4 w-4" aria-hidden="true" /> Pass
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-medium text-danger">
                            <X className="h-4 w-4" aria-hidden="true" /> Fail
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}

      {gaps.length > 0 && (
        <Card className="space-y-3" data-testid="known-gaps">
          <CardTitle>Known gaps (not caught yet)</CardTitle>
          <p className="text-sm text-muted">
            We list what our simple rules still miss. Misspellings and many ways of asking in other languages are not covered.
            AI replies still pass through the safety checks above, and nobody is told they have or do not have a condition.
          </p>
          <ul className="space-y-2 text-sm">
            {gaps.map((r) => (
              <li key={r.id}>
                <q>{r.input}</q>: should be &quot;{describe(r, r.expected)}&quot;, but today the result is &quot;
                {describe(r, r.actual)}&quot;.
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );

  if ((await auth())?.user?.id) {
    const user = await requireUser();
    return (
      <AppShell userName={user.name ?? "there"} isDemo={user.isDemo}>
        {content}
      </AppShell>
    );
  }

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-5 py-12">
        {content}
      </main>
      <SiteFooter />
    </>
  );
}
