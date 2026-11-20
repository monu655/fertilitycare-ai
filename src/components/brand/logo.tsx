import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 font-bold", className)} aria-label="FertilityCare AI home">
      <ShieldCheck className={cn("h-7 w-7", light ? "text-teal" : "text-teal-dark")} aria-hidden="true" />
      <span className={light ? "text-white" : "text-navy"}>
        FertilityCare <span className={light ? "text-teal" : "text-teal-dark"}>AI</span>
      </span>
    </Link>
  );
}
