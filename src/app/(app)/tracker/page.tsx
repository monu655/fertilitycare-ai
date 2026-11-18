import type { Metadata } from "next";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/session";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { addDays, isIsoDate, longDate, shortDate, todayIso, weekStart } from "@/lib/dates";
import { hasHealthConsent } from "@/features/assessment/queries";
import { isGentle } from "@/features/settings/gentle";
import { loadHabitEntries } from "@/features/tracker/queries";
import { deleteHabitEntryAction } from "@/features/tracker/actions";
import { EntryForm } from "@/features/tracker/entry-form";
import { TrendChart } from "@/features/tracker/trend-chart";
import { bedtimeSpread, comparePeriods, inRange, monthlySummaries, weeklySummaries } from "@/features/tracker/analysis";
import { METRICS, mealLabel } from "@/features/tracker/metrics";

export const metadata: Metadata = { title: "Lifestyle tracker" };
export const instant = false;

const fmt = (v: number | null) => (v === null ? "–" : String(v));

export default async function TrackerPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await requireUser();
  const { date: dateParam } = await searchParams;
  const today = todayIso();
  const date = dateParam && isIsoDate(dateParam) && dateParam <= addDays(today, 1) ? dateParam : today;

  const [consent, entries, gentle] = await Promise.all([hasHealthConsent(user.id), loadHabitEntries(user.id), isGentle()]);
  const entry = entries.find((e) => e.date === date) ?? null;
  const byDate = new Map(entries.map((e) => [e.date, e]));

  // A five-week calendar: Monday to Sunday rows, ending with the current week.
  const firstDay = addDays(weekStart(today), -28);
  const days = Array.from({ length: 35 }, (_, i) => addDays(firstDay, i));

  const comparison = comparePeriods(entries, today, 14);
  const weekly = weeklySummaries(entries, today, 8);
  const monthly = monthlySummaries(entries, today, 6);
  const spread = bedtimeSpread(inRange(entries, addDays(today, -29), today));
  const recent = [...entries].reverse().slice(0, 14);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">Lifestyle tracker</h1>
        <p className="mt-1 text-muted">
          Record sleep, stress, food, exercise and heat exposure day by day, and see how they change over weeks and months.
        </p>
      </header>

      <p role="note" className="rounded-lg bg-teal-light p-3 text-sm text-navy">
        This tracker only records and lines up what you enter. It does not say a number is good or bad, and it cannot tell you
        about your fertility. A healthcare professional can explain what your habits and results mean for you.
      </p>

      {!consent && (
        <Card className="space-y-3" data-testid="tracker-needs-consent">
          <p className="text-sm">Health consent is needed before you can save daily entries. You give it at step 1 of the Health Assessment.</p>
          <ButtonLink href="/assessment">Go to the assessment</ButtonLink>
        </Card>
      )}

      <Card className="space-y-4">
        <CardTitle>{entry ? `Edit ${longDate(date)}` : `Add ${longDate(date)}`}</CardTitle>
        <p className="text-sm text-muted">Every box is optional. Leave a box empty if you did not track it. An empty box is never counted as zero.</p>
        <EntryForm key={date} date={date} entry={entry} maxDate={addDays(today, 1)} />
      </Card>

      <Card className="space-y-3">
        <CardTitle>Calendar</CardTitle>
        <p className="text-sm text-muted">Days with an entry are filled. Choose a day to add or change it.</p>
        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted" aria-hidden="true">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <ol className="grid grid-cols-7 gap-1" data-testid="calendar">
          {days.map((d) => {
            const has = byDate.has(d);
            const future = d > today;
            const label = `${longDate(d)}${has ? ", has an entry" : ", no entry"}${d === today ? ", today" : ""}`;
            const cls = `flex min-h-11 items-center justify-center rounded-lg border text-sm ${
              has ? "border-teal-dark bg-teal-light font-semibold text-navy" : "border-border bg-white text-muted"
            } ${d === date ? "ring-2 ring-navy" : ""}`;
            return (
              <li key={d}>
                {future ? (
                  <span className={`${cls} opacity-40`} aria-label={label}>
                    {Number(d.slice(8))}
                  </span>
                ) : (
                  <Link href={`/tracker?date=${d}`} className={cls} aria-label={label} aria-current={d === date ? "date" : undefined}>
                    {Number(d.slice(8))}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </Card>

      <Card className="space-y-3" id="charts">
        <CardTitle>Charts</CardTitle>
        {gentle ? (
          <p className="text-sm text-muted" data-testid="gentle-hidden">
            Gentle mode is on, so your numbers and charts are hidden here. You can still add entries. Turn it off in Settings.
          </p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted">Charts appear after your first entries.</p>
        ) : (
          <TrendChart entries={entries} today={today} />
        )}
      </Card>

      {!gentle && entries.length > 0 && (
        <>
          <Card className="space-y-3" data-testid="period-compare">
            <CardTitle>Latest 14 days compared with the 14 days before</CardTitle>
            <p className="text-sm text-muted">
              Averages of the days you recorded. This only shows the numbers. It does not say if a change is good or bad.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] text-sm">
                <caption className="sr-only">Average per measure, earlier 14 days and latest 14 days</caption>
                <thead>
                  <tr className="text-left text-muted">
                    <th scope="col" className="py-2 pr-4 font-medium">Measure</th>
                    <th scope="col" className="py-2 pr-4 font-medium">Earlier 14 days</th>
                    <th scope="col" className="py-2 font-medium">Latest 14 days</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((c) => (
                    <tr key={c.key} className="border-t border-border">
                      <th scope="row" className="py-2 pr-4 text-left font-normal">
                        {c.label} <span className="text-muted">({c.unit})</span>
                      </th>
                      <td className="py-2 pr-4">{c.enough ? `${fmt(c.previous)} (${c.previousRecorded} days)` : "Not enough entries"}</td>
                      <td className="py-2">{c.enough ? `${fmt(c.current)} (${c.currentRecorded} days)` : "Not enough entries"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">&quot;Not enough entries&quot; means fewer than 3 recorded days in one of the periods.</p>
            {spread && (
              <p className="text-sm" data-testid="bedtime-spread">
                Over the last 30 days your recorded bedtimes were spread over {spread.minutes} minutes ({spread.nights} nights recorded).
              </p>
            )}
          </Card>

          <Card className="space-y-3" data-testid="weekly-summary">
            <CardTitle>Weekly summary</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <caption className="sr-only">Weekly averages</caption>
                <thead>
                  <tr className="text-left text-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">Week</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Days logged</th>
                    {METRICS.map((m) => (
                      <th key={m.key} scope="col" className="py-2 pr-3 font-medium">{m.short}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weekly.map((w) => (
                    <tr key={w.from} className="border-t border-border">
                      <th scope="row" className="py-2 pr-3 text-left font-normal">{w.label}</th>
                      <td className="py-2 pr-3">{w.daysLogged}</td>
                      {METRICS.map((m) => (
                        <td key={m.key} className="py-2 pr-3">{fmt(w.stats[m.key])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted">Averages per measure of the days you recorded (hours, 1 to 5, minutes, portions).</p>
          </Card>

          <Card className="space-y-3" data-testid="monthly-summary">
            <CardTitle>Monthly summary</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <caption className="sr-only">Monthly averages</caption>
                <thead>
                  <tr className="text-left text-muted">
                    <th scope="col" className="py-2 pr-3 font-medium">Month</th>
                    <th scope="col" className="py-2 pr-3 font-medium">Days logged</th>
                    {METRICS.map((m) => (
                      <th key={m.key} scope="col" className="py-2 pr-3 font-medium">{m.short}</th>
                    ))}
                    <th scope="col" className="py-2 font-medium">Days with heat</th>
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((w) => (
                    <tr key={w.from} className="border-t border-border">
                      <th scope="row" className="py-2 pr-3 text-left font-normal">{w.label}</th>
                      <td className="py-2 pr-3">{w.daysLogged}</td>
                      {METRICS.map((m) => (
                        <td key={m.key} className="py-2 pr-3">{fmt(w.stats[m.key])}</td>
                      ))}
                      <td className="py-2">{w.heatDays}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Card className="space-y-3" data-testid="recent-entries">
        <CardTitle>Recent entries</CardTitle>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">No entries yet. Add your first day above.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="space-y-0.5">
                  <p className="font-semibold text-navy">{longDate(e.date)}</p>
                  {gentle ? (
                    <p className="text-muted">Numbers hidden (gentle mode)</p>
                  ) : (
                    <p className="text-muted">
                      {[
                        e.sleepHours !== null ? `sleep ${e.sleepHours} h` : null,
                        e.stress !== null ? `stress ${e.stress}/5` : null,
                        e.exerciseMinutes !== null ? `exercise ${e.exerciseMinutes} min` : null,
                        e.fruitVeg !== null ? `${e.fruitVeg} fruit and veg` : null,
                        e.mealPattern ? mealLabel(e.mealPattern).toLowerCase() : null,
                        e.heatMinutes !== null ? `heat ${e.heatMinutes} min` : null,
                        e.sittingHours !== null ? `sitting ${e.sittingHours} h` : null,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <ButtonLink href={`/tracker?date=${e.date}`} variant="secondary" aria-label={`Edit ${shortDate(e.date)}`}>
                    Edit
                  </ButtonLink>
                  <form action={deleteHabitEntryAction}>
                    <input type="hidden" name="id" value={e.id} />
                    <Button type="submit" variant="danger" aria-label={`Delete ${shortDate(e.date)}`}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                    </Button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3">
        <CardTitle>What next?</CardTitle>
        <p className="text-sm text-muted">
          When you have a few weeks of entries, the AI Intelligence page lines them up with your assessment and any lab values you
          chose to record, and explains the patterns with sources.
        </p>
        <ButtonLink href="/intelligence" variant="secondary">
          Open AI Intelligence
        </ButtonLink>
      </Card>
    </div>
  );
}
