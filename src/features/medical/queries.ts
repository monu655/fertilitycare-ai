import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type Biomarker = {
  id: string;
  takenOn: string;
  marker: string;
  value: number;
  unit: string;
  refLow: number | null;
  refHigh: number | null;
  notes: string | null;
};

export async function loadBiomarkers(userId: string): Promise<Biomarker[]> {
  const rows = await db
    .select()
    .from(schema.biomarkerRecords)
    .where(eq(schema.biomarkerRecords.userId, userId))
    .orderBy(asc(schema.biomarkerRecords.takenOn));
  return rows.map((r) => ({
    id: r.id,
    takenOn: r.takenOn,
    marker: r.marker,
    value: r.value,
    unit: r.unit,
    refLow: r.refLow,
    refHigh: r.refHigh,
    notes: r.notes,
  }));
}

// Groups one marker's results (same unit) oldest to newest.
export function seriesFor(records: Biomarker[]): { marker: string; unit: string; rows: Biomarker[] }[] {
  const map = new Map<string, { marker: string; unit: string; rows: Biomarker[] }>();
  for (const r of records) {
    const key = `${r.marker}|${r.unit}`;
    const g = map.get(key) ?? { marker: r.marker, unit: r.unit, rows: [] };
    g.rows.push(r);
    map.set(key, g);
  }
  return [...map.values()];
}
