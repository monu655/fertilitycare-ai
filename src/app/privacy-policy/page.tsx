import type { Metadata } from "next";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Privacy policy" };

// Describes what the prototype does TODAY. It has not had legal review.
export default function PrivacyPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 space-y-5 px-5 py-12">
        <h1 className="text-3xl font-bold text-navy">Privacy policy</h1>
        <Badge tone="warning">Draft for a prototype. Not legally reviewed.</Badge>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-navy">What is stored</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted">
            <li>Your name, email address, and a hashed (not readable) password.</li>
            <li>The assessment answers you choose to enter.</li>
            <li>A record of the consent you gave, with its version and date.</li>
            <li>Basic audit events (for example, account created). These never contain health answers.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-navy">Who can see it</h2>
          <p className="text-sm text-muted">
            Only you, when signed in. Nothing is shared automatically. There is no advertising or analytics tracking in
            this prototype.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-navy">AI processing</h2>
          <p className="text-sm text-muted">
            AI processing of your answers is not active in this version. If it is added, you will be asked for separate
            consent first.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold text-navy">Deletion and export</h2>
          <p className="text-sm text-muted">
            Self-service deletion and export are not built yet. They are planned for the Privacy Center.
          </p>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
