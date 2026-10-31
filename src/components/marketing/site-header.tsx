import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";

const links = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/resources", label: "Health Resources" },
  { href: "/#privacy", label: "Privacy" },
  { href: "/#about", label: "About" },
];

export function SiteHeader() {
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logo light />

        <nav aria-label="Main" className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-white/85 hover:text-white">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ButtonLink href="/sign-in" variant="outlineLight">
            Sign In
          </ButtonLink>
          <ButtonLink href="/sign-up">Get Started</ButtonLink>
        </div>

        {/* Mobile menu: native <details>, works with keyboard and screen readers without JavaScript */}
        <details className="relative md:hidden">
          <summary
            className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-white/30"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </summary>
          <div className="absolute right-0 z-40 mt-2 w-64 rounded-xl border border-border bg-white p-3 text-navy shadow-lg">
            <nav aria-label="Mobile" className="flex flex-col">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-teal-light">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="mt-2 grid gap-2 border-t border-border pt-3">
              <ButtonLink href="/sign-in" variant="secondary">
                Sign In
              </ButtonLink>
              <ButtonLink href="/sign-up">Get Started</ButtonLink>
            </div>
          </div>
        </details>
      </div>
    </header>
  );
}
