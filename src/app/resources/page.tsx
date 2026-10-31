import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { auth } from "@/lib/auth";
import { requireUser } from "@/lib/session";
import { AppShell } from "@/components/app/app-shell";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import { CATEGORIES, EVIDENCE_VERSION, SOURCES, type CategoryId } from "@/data/evidence-library";

export const metadata: Metadata = { title: "Health resources" };
export const instant = false;

// Public page: no sign-in needed. Every entry links to the original page and was read on the date shown.
// Signed-out visitors see the website header and footer. Signed-in users see the page inside the app
// (sidebar only), so the website menu never gets mixed into the app.
export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const { q = "", category = "" } = await searchParams;
  const query = q.trim().slice(0, 80).toLowerCase();
  const activeCategory = CATEGORIES.find((c) => c.id === category)?.id as CategoryId | undefined;

  const results = SOURCES.filter((s) => s.verified)
    .filter((s) => !activeCategory || s.categories.includes(activeCategory))
    .filter((s) => !query || `${s.title} ${s.summary} ${s.organization}`.toLowerCase().includes(query));

  const content = (
    <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-navy">Health resources</h1>
          <p className="mt-1 text-muted">
            Educational pages from public-health agencies and professional medical organizations. You do not need an account.
          </p>
        </header>

        <form method="get" action="/resources" role="search" className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <Field id="q" label="Search" optional>
            {(aria) => <Input {...aria} name="q" type="search" defaultValue={q} placeholder="for example: semen analysis" maxLength={80} />}
          </Field>
          <Field id="category" label="Topic" optional>
            {(aria) => (
              <Select {...aria} name="category" defaultValue={activeCategory ?? ""}>
                <option value="">All topics</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Button type="submit">Search</Button>
        </form>

        <p role="status" className="text-sm text-muted">
          {results.length} {results.length === 1 ? "resource" : "resources"} found.
        </p>

        {results.length === 0 ? (
          <Card>
            <p className="text-sm text-muted">Nothing matched. Try a shorter search or choose All topics.</p>
          </Card>
        ) : (
          <ul className="space-y-4">
            {results.map((s) => (
              <li key={s.id}>
                <Card className="space-y-2" data-testid="resource">
                  <div className="flex flex-wrap gap-2">
                    {s.categories.map((c) => (
                      <Badge key={c} tone="neutral">
                        {CATEGORIES.find((x) => x.id === c)?.label}
                      </Badge>
                    ))}
                  </div>
                  <h2 className="text-lg font-semibold text-navy">{s.title}</h2>
                  <p className="text-sm">{s.summary}</p>
                  <p className="text-xs text-muted">
                    {s.organization}. {s.dateShown}. Link checked {s.checkedOn}.
                  </p>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-teal-dark underline">
                    Read the original page
                    <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                  <p className="text-xs text-muted">Educational information only. It is not medical advice.</p>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted">
          Evidence library version {EVIDENCE_VERSION}. We only list pages we opened and read. Pages can change after the date
          shown, so check the original for the latest version.
        </p>
    </div>
  );

  if ((await auth())?.user?.id) {
    const user = await requireUser();
    return (
      <AppShell userName={user.name ?? "there"} isDemo={user.isDemo}>
        {content}
      </AppShell>
    );
  }

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
        {content}
      </main>
      <SiteFooter />
    </>
  );
}
