import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeStyles = cva("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", {
  variants: {
    tone: {
      teal: "bg-teal-light text-[#0b6f64]",
      neutral: "bg-[#eef1f6] text-navy-2",
      warning: "bg-warning-bg text-warning",
      danger: "bg-danger-bg text-danger",
      success: "bg-success-bg text-success",
    },
  },
  defaultVariants: { tone: "teal" },
});

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeStyles>;

// Badges always contain text, so status is never shown by color alone.
export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeStyles({ tone }), className)} {...props} />;
}
