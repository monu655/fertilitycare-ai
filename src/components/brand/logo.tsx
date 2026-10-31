import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-bold", className)} aria-label="FertilityCare AI home">
      <ShieldCheck className="h-7 w-7 text-teal" aria-hidden="true" />
      <span className={light ? "text-white" : "text-navy"}>
        FertilityCare <span className="text-teal">AI</span>
      </span>
    </Link>
  );
}
