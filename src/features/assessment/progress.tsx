import Link from "next/link";
import { cn } from "@/lib/utils";
import { STEP_TITLES, TOTAL_STEPS } from "./questions";

type Props = { current: number; maxStep: number };

// Step list + progress bar. Steps the user has already reached are links, so they can go back and edit.
export function AssessmentProgress({ current, maxStep }: Props) {
  const percent = Math.round(((current - 1) / (TOTAL_STEPS - 1)) * 100);
  return (
    <nav aria-label="Assessment progress" className="space-y-4">
      <p className="text-sm font-medium text-muted">
        Step {current} of {TOTAL_STEPS}: {STEP_TITLES[current - 1]}
      </p>
      <div
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-valuenow={current}
        aria-label="Assessment progress"
        className="h-2 w-full overflow-hidden rounded-full bg-[#e3e8f0]"
      >
        <div className="h-full bg-teal-dark transition-all" style={{ width: `${percent}%` }} />
      </div>
      <ol className="hidden gap-2 text-xs sm:grid sm:grid-cols-6">
        {STEP_TITLES.map((title, i) => {
          const n = i + 1;
          const reachable = n <= maxStep;
          const isCurrent = n === current;
          const body = (
            <span
              className={cn(
                "block rounded-lg border px-2 py-2 text-center font-medium",
                isCurrent ? "border-teal-dark bg-teal-light text-navy" : "border-border bg-white text-muted",
                reachable && !isCurrent && "text-navy hover:bg-teal-light",
              )}
            >
              {n}. {title}
            </span>
          );
          return (
            <li key={title} aria-current={isCurrent ? "step" : undefined}>
              {reachable && !isCurrent ? <Link href={`/assessment?step=${n}`}>{body}</Link> : body}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
