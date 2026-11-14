"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type Props = {
  label: string;
  buttonClassName: string;
  panelClassName: string;
  className?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
};

// A native <details> menu that closes itself after a link is tapped, after the page changes, or when Escape is pressed.
// Without this, the menu stays open on top of the new page because the page frame is reused.
export function MobileMenu({ label, buttonClassName, panelClassName, className, icon, children }: Props) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  useEffect(() => {
    close();
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && ref.current?.open) {
        close();
        ref.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <details
      ref={ref}
      className={className}
      onClick={(e) => {
        // Links on the same page (for example /#privacy) do not change the path, so close on tap as well.
        if ((e.target as HTMLElement).closest("a")) close();
      }}
    >
      <summary aria-label={label} className={buttonClassName}>
        {icon}
      </summary>
      <div className={panelClassName}>{children}</div>
    </details>
  );
}
