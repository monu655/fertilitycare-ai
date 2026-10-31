import { Suspense } from "react";
import { AppShell } from "@/components/app/app-shell";
import { requireUser } from "@/lib/session";

// Reading the session uses cookies, so it must run inside Suspense (Cache Components).
async function Shell({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppShell userName={user.name ?? "there"} isDemo={user.isDemo}>
      {children}
    </AppShell>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-muted">Loading…</p>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
