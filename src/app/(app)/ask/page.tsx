import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { Badge } from "@/components/ui/badge";
import { Card, CardTitle } from "@/components/ui/card";
import { activeProvider } from "@/lib/ai/provider";
import { consentState } from "@/features/privacy/queries";
import { AskForm } from "@/features/ask/ask-form";

export const metadata: Metadata = { title: "Ask a question" };
export const instant = false;

const EXAMPLES = [
  "Does smoking affect sperm?",
  "What is a semen analysis?",
  "When should I see a doctor?",
  "How should I prepare for an appointment?",
];

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const { q = "" } = await searchParams;
  const consent = await consentState(user.id);
  const aiOn = Boolean(activeProvider()) && consent.ai;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">Ask a question</h1>
        <p className="mt-1 text-muted">
          Ask about male reproductive health. Answers come only from the named sources in our library. If we cannot find it
          there, we say so.
        </p>
      </header>

      <Card className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>How answers are made</CardTitle>
          <Badge tone={aiOn ? "teal" : "neutral"}>{aiOn ? "AI-assisted" : "Sources only"}</Badge>
        </div>
        <p className="text-sm text-muted">
          {aiOn
            ? "An AI model rewrites the matching source passages into a short answer. We check the answer against the sources and show the plain passages if anything looks wrong. Your question (with emails and phone numbers removed) is sent to the AI provider. It is not saved by us."
            : "Nothing leaves our server. You see the matching passages from the sources. AI-assisted answers can be turned on by the site owner, and need your separate consent in the Privacy Center."}
        </p>
        {!consent.ai && (
          <p className="text-sm">
            <Link href="/privacy" className="font-medium text-teal-dark underline">
              Open Privacy Center
            </Link>
          </p>
        )}
      </Card>

      <div className="flex flex-wrap gap-2" aria-label="Example questions">
        {EXAMPLES.map((e) => (
          <Link key={e} href={`/ask?q=${encodeURIComponent(e)}`} className="rounded-full border border-border bg-white px-3 py-1.5 text-sm text-navy hover:bg-teal-light">
            {e}
          </Link>
        ))}
      </div>

      <AskForm defaultQuestion={q.slice(0, 300)} />
    </div>
  );
}
