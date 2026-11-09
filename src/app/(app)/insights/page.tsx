import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { InsightCard } from "@/features/insights/insight-card";
import { loadInsights } from "@/features/insights/queries";
import { isGentle } from "@/features/settings/gentle";
import { EVIDENCE_VERSION } from "@/data/evidence-library";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My insights" };
export const instant = false;

const FILTERS = [
  { id: "all", label: "All insights" },
  { id: "educational", label: "Educational" },
  { id: "professional", label: "Discuss with a professional" },
] as const;

export default async function InsightsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const user = await requireUser();
  const { filter: filterParam } = await searchParams;
  const filter = FILTERS.some((f) => f.id === filterParam) ? (filterParam as string) : "all";

  const bundle = await loadInsights(user.id);
  const gentle = await isGentle();

  if (!bundle) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-navy">My insights</h1>
        <Card className="space-y-3">
          <p className="font-semibold text-navy">No insights yet.</p>
          <p className="text-sm text-muted">Insights are created from a submitted assessment. Every question in it is optional.</p>
          <ButtonLink href="/assessment">Go to the assessment</ButtonLink>
        </Card>
      </div>
    );
  }

  const shown = bundle.insights.filter((i) => filter === "all" || i.kind === filter);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">My insights</h1>
        <p className="mt-1 text-muted">Based on your responses, here is educational information linked to its sources.</p>
      </header>

      <p role="note" className="rounded-lg bg-teal-light p-3 text-sm text-navy">
        These insights are educational. They are not a diagnosis, they do not predict fertility, and they do not replace a
        healthcare professional.
      </p>

      {gentle && (
        <p role="note" className="rounded-lg bg-[#eef1f6] p-3 text-sm text-navy" data-testid="gentle-note">
          Gentle mode is on: your own numbers and answers are hidden on these cards. Sources and advice stay visible.{" "}
          <Link href="/settings" className="font-medium text-teal-dark underline">
            Change in Settings
          </Link>
        </p>
      )}

      <nav aria-label="Insight filters" className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.id}
            href={f.id === "all" ? "/insights" : `/insights?filter=${f.id}`}
            aria-current={filter === f.id ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-medium",
              filter === f.id ? "border-teal-dark bg-teal-light text-navy" : "border-border bg-white text-navy hover:bg-teal-light",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {bundle.aiNotes && (
        <Card className="space-y-3" data-testid="ai-notes">
          <Badge tone="neutral">AI-generated, not medical advice</Badge>
          <p className="text-sm">{bundle.aiNotes.summary}</p>
          <div>
            <h3 className="text-sm font-semibold text-navy">Questions you could ask</h3>
            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
              {bundle.aiNotes.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {shown.length === 0 ? (
        <Card>
          <p className="text-sm text-muted">No insights in this group.</p>
        </Card>
      ) : (
        <div className="space-y-5">
          {shown.map((i) => (
            <InsightCard key={i.id} insight={i} gentle={gentle} />
          ))}
        </div>
      )}

      <p className="text-xs text-muted">
        Evidence library version {EVIDENCE_VERSION}. Links were opened and read on the date shown on each reference. Insights
        come from fixed rules matched to those sources, and AI notes appear only if you agreed to AI processing.
      </p>
    </div>
  );
}
