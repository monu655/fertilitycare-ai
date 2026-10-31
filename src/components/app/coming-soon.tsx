import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Honest placeholder for screens that are planned but NOT built yet.
export function ComingSoon({ title, text, backHref = "/dashboard" }: { title: string; text: string; backHref?: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-navy">{title}</h1>
      <Card className="space-y-3">
        <Badge tone="warning">Not built yet</Badge>
        <p className="text-sm text-muted">{text}</p>
        <ButtonLink href={backHref} variant="secondary">
          Back
        </ButtonLink>
      </Card>
    </div>
  );
}
