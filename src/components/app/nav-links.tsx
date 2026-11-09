"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  LibraryBig,
  Lightbulb,
  MessageCircleQuestion,
  Settings,
  ShieldCheck,
  Stethoscope,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const appLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/assessment", label: "Health Assessment", icon: ClipboardList },
  { href: "/insights", label: "My Insights", icon: Lightbulb },
  { href: "/progress", label: "My Progress", icon: TrendingUp },
  { href: "/ask", label: "Ask a Question", icon: MessageCircleQuestion },
  { href: "/care", label: "Care Navigation", icon: Stethoscope },
  { href: "/summary", label: "Consultation Summary", icon: FileText },
  { href: "/resources", label: "Health Resources", icon: LibraryBig },
  { href: "/privacy", label: "Privacy Center", icon: ShieldCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function NavLinks({ onDark = false }: { onDark?: boolean }) {
  const pathname = usePathname();
  return (
    <ul className="space-y-1">
      {appLinks.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                onDark
                  ? active
                    ? "bg-teal-dark text-white"
                    : "text-white/80 hover:bg-navy-2 hover:text-white"
                  : active
                    ? "bg-teal-light text-navy"
                    : "text-navy hover:bg-teal-light",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
