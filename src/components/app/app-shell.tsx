import { LogOut, Menu } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { NavLinks } from "./nav-links";
import { signOutAction } from "@/features/auth/actions";

type Props = { userName: string; isDemo: boolean; children: React.ReactNode };

function SignOutButton({ className }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" className={className}>
        <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
      </Button>
    </form>
  );
}

export function AppShell({ userName, isDemo, children }: Props) {
  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr] print:block">
      {/* Desktop sidebar */}
      <aside className="hidden bg-navy p-5 md:flex md:flex-col print:hidden">
        <Logo light />
        <nav aria-label="App" className="mt-8 flex-1">
          <NavLinks onDark />
        </nav>
        <form action={signOutAction}>
          <Button type="submit" variant="outlineLight" className="w-full">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
          </Button>
        </form>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Mobile top bar with a native <details> menu (keyboard and screen-reader friendly) */}
        <header className="flex items-center justify-between border-b border-border bg-white px-4 py-3 md:hidden print:hidden">
          <Logo />
          <details className="relative">
            <summary
              aria-label="Open navigation"
              className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-lg border border-border"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </summary>
            <div className="absolute right-0 z-40 mt-2 w-72 rounded-xl border border-border bg-white p-3 shadow-lg">
              <nav aria-label="App mobile">
                <NavLinks />
              </nav>
              <div className="mt-2 border-t border-border pt-2">
                <SignOutButton className="w-full" />
              </div>
            </div>
          </details>
        </header>

        {isDemo && (
          <p className="bg-warning-bg px-4 py-2 text-center text-sm font-medium text-warning print:hidden">
            Demo account: all data here is synthetic. Hello, {userName}.
          </p>
        )}

        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
