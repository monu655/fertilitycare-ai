import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { sourceById } from "@/data/evidence-library";
import type { Insight } from "@/lib/insights/schema";

const STRENGTH_LABEL: Record<Insight["strength"], string> = {
  general: "General information",
  mixed: "Mixed evidence",
  limited: "Limited evidence",
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</h4>
      {children}
    </section>
  );
}

export function InsightCard({ insight }: { insight: Insight }) {
  const sources = insight.sourceIds.map((id) => sourceById(id)).filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <Card className="space-y-4" data-testid="insight-card">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={insight.kind === "professional" ? "warning" : "teal"}>
            {insight.kind === "professional" ? "Discuss With a Healthcare Professional" : "Educational Information"}
          </Badge>
          {insight.personal && <Badge tone="neutral">Based on Your Responses</Badge>}
          <Badge tone="neutral">{STRENGTH_LABEL[insight.strength]}</Badge>
        </div>
        <h3 className="text-lg font-semibold text-navy">{insight.topic}</h3>
      </header>

      {insight.reported.length > 0 && (
        <Section label="What you reported">
          <ul className="list-disc space-y-0.5 pl-5 text-sm">
            {insight.reported.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section label="Educational information">
        <p className="text-sm">{insight.explanation}</p>
      </Section>

      <Section label="Why it may matter">
        <p className="text-sm">{insight.whyItMatters}</p>
      </Section>

      <Section label="Suggested next step">
        <ul className="list-disc space-y-0.5 pl-5 text-sm">
          {insight.nextSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </Section>

      <Section label="Discuss with a healthcare professional">
        <p className="text-sm">{insight.whenToConsult}</p>
      </Section>

      {sources.length > 0 && (
        <Section label="Evidence reference">
          <ul className="space-y-1 text-sm">
            {sources.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1 font-medium text-teal-dark underline">
                  {s.title}
                  <ExternalLink className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
                <span className="block text-xs text-muted">
                  {s.organization}. {s.dateShown}. Link checked {s.checkedOn}.
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section label="Limitations and uncertainty">
        <p className="text-sm text-muted">{insight.limitations}</p>
      </Section>
    </Card>
  );
}
