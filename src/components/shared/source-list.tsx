import { ExternalLink } from "lucide-react";
import { sourceById } from "@/data/evidence-library";

// A list of reference links. Unknown ids are skipped, so an unverified source can never appear.
export function SourceList({ ids }: { ids: string[] }) {
  const sources = ids.map((id) => sourceById(id)).filter((s): s is NonNullable<typeof s> => Boolean(s && s.verified));
  if (sources.length === 0) return null;
  return (
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
  );
}
