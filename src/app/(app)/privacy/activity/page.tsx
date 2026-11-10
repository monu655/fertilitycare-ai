import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { Card } from "@/components/ui/card";
import { recentActivity } from "@/features/privacy/queries";
import { ACTION_LABELS, dateTimeFormat } from "@/features/privacy/activity-labels";

export const metadata: Metadata = { title: "Account activity" };
export const instant = false;

export default async function ActivityPage() {
  const user = await requireUser();
  const events = await recentActivity(user.id, 100);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">Account activity</h1>
        <p className="mt-1 text-muted">A record of actions on your account: when, and what.</p>
      </header>

      <p role="note" className="rounded-lg bg-teal-light p-3 text-sm text-navy">
        Each line says only <strong>what happened and when</strong>. No health answers, questions or test values are ever written
        here. If you delete your account, these lines are kept without any health information. They are not shown to you
        afterwards, because the account is gone.
      </p>

      <Card className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-muted">Nothing recorded yet.</p>
        ) : (
          <>
            <p className="text-sm text-muted" data-testid="activity-count">
              Showing your latest {events.length} {events.length === 1 ? "event" : "events"}. Times are in UTC.
            </p>
            <table className="w-full text-sm" data-testid="activity-table">
              <caption className="sr-only">Actions on your account, newest first</caption>
              <thead>
                <tr className="text-left text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    What happened
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    When
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((e, i) => (
                  <tr key={`${e.action}-${i}`} className="border-t border-border">
                    <td className="py-2 pr-4">{ACTION_LABELS[e.action] ?? e.action}</td>
                    <td className="py-2 text-muted">{dateTimeFormat.format(e.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>

      <Link href="/privacy" className="inline-block text-sm font-medium text-teal-dark underline">
        Back to Privacy Center
      </Link>
    </div>
  );
}
