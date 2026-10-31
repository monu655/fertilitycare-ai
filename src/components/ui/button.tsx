import * as React from "react";
import Link from "next/link";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
  {
    variants: {
      variant: {
        primary: "bg-teal-dark text-white hover:bg-[#0b6f64]",
        secondary: "border border-border bg-white text-navy hover:bg-teal-light",
        outlineLight: "border border-white/40 bg-transparent text-white hover:bg-white/10",
        ghost: "text-navy hover:bg-teal-light",
        danger: "bg-danger text-white hover:bg-[#912018]",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles> & { loading?: boolean };

export function Button({ className, variant, loading, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonStyles({ variant }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

type ButtonLinkProps = React.ComponentProps<typeof Link> & VariantProps<typeof buttonStyles>;

// A link that looks like a button (for navigation, not for form submits).
export function ButtonLink({ className, variant, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonStyles({ variant }), className)} {...props} />;
}
