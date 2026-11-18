import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/field";
import { shortDate, todayIso, weekStart } from "@/lib/dates";
import { hasHealthConsent, responsesFor } from "@/features/assessment/queries";
import { latestSubmitted } from "@/features/insights/queries";
import { loadHabitEntries } from "@/features/tracker/queries";
import { buildPatternInsights } from "@/features/intelligence/engine";
import { GOALS, goalByKey, suggestGoals } from "@/features/coach/goals";
import { addGoalAction, deleteGoalAction, stepGoalAction } from "@/features/coach/actions";

export const metadata: Metadata = { title: "Weekly goals" };
export const instant = false;

export default async function CoachPage() {
  const user = await requireUser();
  const thisWeek = weekStart(todayIso());
  const [consent, entries, assessment, rows] = await Promise.all([
    hasHealthConsent(user.id),
    loadHabitEntries(user.id),
    latestSubmitted(user.id),
    db.select().from(schema.weeklyGoals).where(eq(schema.weeklyGoals.userId, user.id)).orderBy(desc(schema.weeklyGoals.weekStart)).limit(60),
  ]);
  const responses = assessment ? await responsesFor(user.id, assessment.id) : null;
  const out = buildPatternInsights({ entries, today: todayIso(), responses, biomarkers: [] });

  const current = rows.filter((g) => g.weekStart === thisWeek);
  const past = rows.filter((g) => g.weekStart !== thisWeek);
  const suggestions = suggestGoals(out.insights.map((i) => i.id), current.map((g) => g.goalKey));

  // Past weeks: how many days were done out of the days planned. A count, not a grade.
  const weeks = [...new Set(past.map((g) => g.weekStart))].slice(0, 6);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-navy">Weekly goals</h1>
        <p className="mt-1 text-muted">Pick one to three small habit goals for this week and count the days you do them.</p>
      </header>
      <p role="note" className="rounded-lg bg-teal-light p-3 text-sm text-navy">
        These are everyday habit ideas, not medical targets or treatment. Skipping a day is normal. They cannot promise any
        change in fertility.
      </p>

      {!consent && (
        <Card className="space-y-2" data-testid="coach-needs-consent">
          <p className="text-sm">Health consent is needed before you can save goals. You give it at step 1 of the Health Assessment.</p>
          <Link href="/assessment" className="text-sm font-medium text-teal-dark underline">
            Go to the assessment
          </Link>
        </Card>
      )}

      <Card className="space-y-3">
        <CardTitle>Ideas for this week</CardTitle>
        <p className="text-sm text-muted">
          {out.daysLogged > 0
            ? "Picked from the topics in your tracker observations. You choose what, if anything, to try."
            : "Starter ideas. Log a few days in the tracker to get ideas that match your own habits."}
        </p>
        <ul className="space-y-2" data-testid="goal-suggestions">
          {suggestions.map((g) => (
            <li key={g.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3">
              <div>
                <p className="font-medium text-navy">{g.label}</p>
                <p className="text-sm text-muted">{g.hint}</p>
              </div>
              <form action={addGoalAction} className="flex items-center gap-2">
                <input type="hidden" name="goalKey" value={g.key} />
                <label className="text-sm">
                  <span className="sr-only">Days this week</span>
                  <Select name="targetDays" defaultValue="3" aria-label={`Days this week for ${g.label}`}>
                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                      <option key={n} value={n}>
                        {n} day{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </Select>
                </label>
                <Button type="submit" disabled={!consent}>
                  Add
                </Button>
              </form>
            </li>
          ))}
        </ul>
        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-teal-dark">All goal ideas</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {GOALS.map((g) => (
              <li key={g.key}>
                <span className="font-medium">{g.label}.</span> {g.hint}
              </li>
            ))}
          </ul>
          <form action={addGoalAction} className="mt-3 flex flex-wrap items-center gap-2">
            <Select name="goalKey" aria-label="Choose a goal" defaultValue={GOALS[0].key}>
              {GOALS.map((g) => (
                <option key={g.key} value={g.key}>
                  {g.label}
                </option>
              ))}
            </Select>
            <Select name="targetDays" aria-label="Days this week" defaultValue="3">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <option key={n} value={n}>
                  {n} day{n > 1 ? "s" : ""}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary" disabled={!consent}>
              Add chosen goal
            </Button>
          </form>
        </details>
      </Card>

      <Card className="space-y-3">
        <CardTitle>This week (from {shortDate(thisWeek)})</CardTitle>
        {current.length === 0 && <p className="text-sm text-muted" data-testid="no-goals">No goals chosen for this week yet.</p>}
        <ul className="space-y-2" data-testid="goal-list">
          {current.map((g) => {
            const meta = goalByKey(g.goalKey);
            return (
              <li key={g.id} className="space-y-2 rounded-lg border border-border p-3" data-testid="goal-item">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-navy">{meta?.label ?? g.goalKey}</p>
                    <p className="text-sm text-muted">{meta?.hint}</p>
                  </div>
                  <p className="text-sm font-semibold" data-testid="goal-progress">
                    {g.daysDone} of {g.targetDays} days
                  </p>
                </div>
                <progress className="h-2 w-full" max={g.targetDays} value={g.daysDone} aria-label={`${g.daysDone} of ${g.targetDays} days done`} />
                <div className="flex flex-wrap gap-2">
                  <form action={stepGoalAction}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="delta" value="1" />
                    <Button type="submit" variant="secondary">
                      Done today (+1)
                    </Button>
                  </form>
                  <form action={stepGoalAction}>
                    <input type="hidden" name="id" value={g.id} />
                    <input type="hidden" name="delta" value="-1" />
                    <Button type="submit" variant="secondary">
                      Undo (-1)
                    </Button>
                  </form>
                  <form action={deleteGoalAction}>
                    <input type="hidden" name="id" value={g.id} />
                    <Button type="submit" variant="secondary">
                      Remove
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      {weeks.length > 0 && (
        <Card className="space-y-2" data-testid="goal-history">
          <CardTitle>Earlier weeks</CardTitle>
          {weeks.map((w) => (
            <div key={w}>
              <p className="text-sm font-medium text-navy">Week of {shortDate(w)}</p>
              <ul className="list-disc pl-5 text-sm">
                {past
                  .filter((g) => g.weekStart === w)
                  .map((g) => (
                    <li key={g.id}>
                      {goalByKey(g.goalKey)?.label ?? g.goalKey}: {g.daysDone} of {g.targetDays} days
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
