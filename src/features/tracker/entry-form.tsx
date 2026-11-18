"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import type { ActionState } from "@/lib/action-state";
import { MEAL_PATTERNS, METRICS, minutesToBedtime } from "./metrics";
import type { HabitEntry } from "./analysis";
import { saveHabitEntryAction } from "./actions";

const initial: ActionState = {};

const text = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function EntryForm({ date, entry, maxDate }: { date: string; entry: HabitEntry | null; maxDate: string }) {
  const [state, action, pending] = useActionState(saveHabitEntryAction, initial);
  const m = Object.fromEntries(METRICS.map((x) => [x.key, x]));

  return (
    <form action={action} className="space-y-4" noValidate data-testid="habit-form">
      <Field id="habit-date" label="Day" error={state.errors?.entryDate} hint="Pick a day to add it or change it.">
        {(aria) => <Input {...aria} name="entryDate" type="date" defaultValue={date} max={maxDate} />}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="habit-sleep" label={`${m.sleepHours.label} (${m.sleepHours.unit})`} optional error={state.errors?.sleepHours}>
          {(aria) => <Input {...aria} name="sleepHours" type="number" inputMode="decimal" min={0} max={24} step={0.25} defaultValue={text(entry?.sleepHours)} />}
        </Field>
        <Field id="habit-bedtime" label="Bedtime" optional hint="For example 23:30. Used to see how much it varies." error={state.errors?.bedtime}>
          {(aria) => <Input {...aria} name="bedtime" type="time" defaultValue={minutesToBedtime(entry?.bedtimeMinutes)} />}
        </Field>
        <Field id="habit-stress" label={`${m.stress.label} (1 to 5)`} optional hint={m.stress.hint} error={state.errors?.stress}>
          {(aria) => <Input {...aria} name="stress" type="number" inputMode="numeric" min={1} max={5} step={1} defaultValue={text(entry?.stress)} />}
        </Field>
        <Field id="habit-exercise" label={`${m.exerciseMinutes.label} (${m.exerciseMinutes.unit})`} optional error={state.errors?.exerciseMinutes}>
          {(aria) => <Input {...aria} name="exerciseMinutes" type="number" inputMode="numeric" min={0} max={600} step={5} defaultValue={text(entry?.exerciseMinutes)} />}
        </Field>
        <Field id="habit-meals" label="Meals today" optional error={state.errors?.mealPattern}>
          {(aria) => (
            <Select {...aria} name="mealPattern" defaultValue={entry?.mealPattern ?? ""}>
              <option value="">Not recorded</option>
              {MEAL_PATTERNS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="habit-fruitveg" label={`${m.fruitVeg.label}`} optional error={state.errors?.fruitVeg}>
          {(aria) => <Input {...aria} name="fruitVeg" type="number" inputMode="numeric" min={0} max={20} step={1} defaultValue={text(entry?.fruitVeg)} />}
        </Field>
        <Field id="habit-heat" label={`${m.heatMinutes.label} (${m.heatMinutes.unit})`} optional error={state.errors?.heatMinutes}>
          {(aria) => <Input {...aria} name="heatMinutes" type="number" inputMode="numeric" min={0} max={600} step={5} defaultValue={text(entry?.heatMinutes)} />}
        </Field>
        <Field id="habit-sitting" label={`${m.sittingHours.label} (${m.sittingHours.unit})`} optional error={state.errors?.sittingHours}>
          {(aria) => <Input {...aria} name="sittingHours" type="number" inputMode="decimal" min={0} max={24} step={0.5} defaultValue={text(entry?.sittingHours)} />}
        </Field>
      </div>

      {state.errors?.form && (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.errors.form}
        </p>
      )}
      <Button type="submit" loading={pending}>
        {entry ? "Save changes to this day" : "Save this day"}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
