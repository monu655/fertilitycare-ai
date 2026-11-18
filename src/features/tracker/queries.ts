import { and, asc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { addDays, todayIso } from "@/lib/dates";
import type { HabitEntry } from "./analysis";

function toEntry(r: typeof schema.habitEntries.$inferSelect): HabitEntry {
  return {
    id: r.id,
    date: r.entryDate,
    sleepHours: r.sleepHours,
    bedtimeMinutes: r.bedtimeMinutes,
    stress: r.stress,
    mealPattern: r.mealPattern,
    fruitVeg: r.fruitVeg,
    exerciseMinutes: r.exerciseMinutes,
    sittingHours: r.sittingHours,
    heatMinutes: r.heatMinutes,
  };
}

// Only the signed-in user's rows. The browser never chooses a user id.
export async function loadHabitEntries(userId: string, days = 180): Promise<HabitEntry[]> {
  const since = addDays(todayIso(), -days);
  const rows = await db
    .select()
    .from(schema.habitEntries)
    .where(and(eq(schema.habitEntries.userId, userId), gte(schema.habitEntries.entryDate, since)))
    .orderBy(asc(schema.habitEntries.entryDate));
  return rows.map(toEntry);
}
