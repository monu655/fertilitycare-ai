import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { SECTIONS } from "@/features/assessment/questions";
import { optionLabel } from "@/features/assessment/questions";
import { responsesFor } from "@/features/assessment/queries";

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" });

export type LifestyleRow = { label: string; cells: { text: string; changed: boolean }[] };
export type LabSeries = { name: string; label: string; unit: string; points: { date: string; value: number }[] };

export type ProgressData = {
  dates: string[];
  lifestyle: LifestyleRow[];
  lab: LabSeries[];
};

// Lines up the person's OWN submitted assessments side by side. It never says a change is good or bad.
// Only this user's rows are read, and the browser chooses nothing.
export async function loadProgress(userId: string): Promise<ProgressData> {
  const all = await db
    .select({ id: schema.assessments.id, submittedAt: schema.assessments.submittedAt })
    .from(schema.assessments)
    .where(and(eq(schema.assessments.userId, userId), eq(schema.assessments.status, "SUBMITTED")))
    .orderBy(asc(schema.assessments.submittedAt));
  const rows = all.slice(-12); // the most recent 12

  const entries: { date: string; responses: Record<string, Record<string, unknown>> }[] = [];
  for (const a of rows) {
    entries.push({
      date: a.submittedAt ? dateFormat.format(a.submittedAt) : "Unknown date",
      responses: await responsesFor(userId, a.id),
    });
  }

  const lifestyleSection = SECTIONS.find((s) => s.id === "lifestyle");
  const lifestyle: LifestyleRow[] = (lifestyleSection?.fields ?? []).map((field) => {
    const texts = entries.map((e) => optionLabel(field, e.responses.lifestyle?.[field.name]));
    return {
      label: field.label,
      cells: texts.map((text, i) => ({ text, changed: i > 0 && text !== texts[i - 1] })),
    };
  });

  const testFields = SECTIONS.find((s) => s.id === "tests")?.fields ?? [];
  const lab: LabSeries[] = ["concentration", "motility"].map((name) => {
    const field = testFields.find((f) => f.name === name);
    const points: LabSeries["points"] = [];
    for (const e of entries) {
      const v = e.responses.tests?.[name];
      if (typeof v === "number" && Number.isFinite(v)) points.push({ date: e.date, value: v });
    }
    return { name, label: field?.label ?? name, unit: field?.unit ?? "", points };
  });

  return { dates: entries.map((e) => e.date), lifestyle, lab };
}
