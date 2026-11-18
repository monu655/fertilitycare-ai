import { z } from "zod";
import { addDays, isIsoDate, todayIso } from "@/lib/dates";
import { MEAL_PATTERNS, METRICS, bedtimeToMinutes } from "@/features/tracker/metrics";

// An empty box means "not recorded". It is never turned into a zero.
const optionalNumber = (min: number, max: number, whole: boolean, label: string) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : Number(v)))
    .pipe(
      z
        .number({ message: `${label}: enter a number.` })
        .min(min, `${label}: use ${min} or more.`)
        .max(max, `${label}: use ${max} or less.`)
        .refine((n) => !whole || Number.isInteger(n), `${label}: use a whole number.`)
        .optional(),
    );

const dateField = z
  .string()
  .trim()
  .refine(isIsoDate, "Choose a valid date.")
  .refine((d) => d <= addDays(todayIso(), 1), "The date cannot be in the future.")
  .refine((d) => d >= addDays(todayIso(), -800), "That date is too far in the past.");

const [sleep, stress, exercise, fruitVeg, heat, sitting] = METRICS;

export const habitEntrySchema = z
  .object({
    entryDate: dateField,
    sleepHours: optionalNumber(sleep.min, sleep.max, false, "Sleep"),
    bedtime: z
      .string()
      .trim()
      .refine((v) => v === "" || bedtimeToMinutes(v) !== null, "Bedtime: use the format 23:30.")
      .transform((v) => (v === "" ? undefined : (bedtimeToMinutes(v) as number))),
    stress: optionalNumber(stress.min, stress.max, true, "Stress"),
    mealPattern: z
      .string()
      .trim()
      .refine((v) => v === "" || MEAL_PATTERNS.some((m) => m.value === v), "Choose one of the listed meal patterns.")
      .transform((v) => (v === "" ? undefined : v)),
    fruitVeg: optionalNumber(fruitVeg.min, fruitVeg.max, true, "Fruit and vegetables"),
    exerciseMinutes: optionalNumber(exercise.min, exercise.max, true, "Exercise"),
    heatMinutes: optionalNumber(heat.min, heat.max, true, "Heat exposure"),
    sittingHours: optionalNumber(sitting.min, sitting.max, false, "Sitting"),
  })
  .refine(
    (v) =>
      [v.sleepHours, v.bedtime, v.stress, v.mealPattern, v.fruitVeg, v.exerciseMinutes, v.heatMinutes, v.sittingHours].some(
        (x) => x !== undefined,
      ),
    { path: ["form"], message: "Fill in at least one value for this day." },
  );

export const deleteByIdSchema = z.object({ id: z.string().trim().min(1).max(64) });

// ---- Medical reports (optional lab values typed from the person's own report) ----
import { markerByKey } from "@/features/medical/markers";

const numberText = (label: string, required: boolean) =>
  z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : Number(v)))
    .pipe(
      required
        ? z.number({ message: `${label}: enter a number.` }).min(0, `${label}: use 0 or more.`).max(1_000_000, `${label}: that number is too large.`)
        : z.number({ message: `${label}: enter a number.` }).min(0, `${label}: use 0 or more.`).max(1_000_000, `${label}: that number is too large.`).optional(),
    );

export const biomarkerSchema = z
  .object({
    takenOn: dateField,
    marker: z.string().trim().refine((v) => Boolean(markerByKey(v)), "Choose a value from the list."),
    unit: z.string().trim().min(1, "Choose a unit."),
    value: numberText("Value", true),
    refLow: numberText("Lower end of your lab's range", false),
    refHigh: numberText("Upper end of your lab's range", false),
    notes: z.string().trim().max(200, "Keep notes under 200 characters.").optional(),
  })
  .superRefine((v, ctx) => {
    const def = markerByKey(v.marker);
    if (def && !def.units.includes(v.unit)) ctx.addIssue({ code: "custom", path: ["unit"], message: "That unit is not offered for this value." });
    if (v.refLow !== undefined && v.refHigh !== undefined && v.refLow > v.refHigh)
      ctx.addIssue({ code: "custom", path: ["refHigh"], message: "The upper end must not be lower than the lower end." });
  });
