"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { FormMessage } from "@/components/ui/form-message";
import type { ActionState } from "@/lib/action-state";
import { CATEGORY_LABEL, MARKERS, markerByKey } from "./markers";
import { addBiomarkerAction } from "./actions";

const initial: ActionState = {};

export function ReportForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(addBiomarkerAction, initial);
  const [marker, setMarker] = useState(MARKERS[0].key);
  const def = markerByKey(marker)!;

  return (
    <form action={action} className="space-y-4" noValidate data-testid="report-form">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="rep-date" label="Test date" error={state.errors?.takenOn}>
          {(aria) => <Input {...aria} name="takenOn" type="date" defaultValue={today} max={today} />}
        </Field>
        <Field id="rep-marker" label="What was measured" error={state.errors?.marker}>
          {(aria) => (
            <Select {...aria} name="marker" value={marker} onChange={(e) => setMarker(e.target.value)}>
              {(["semen", "hormone"] as const).map((cat) => (
                <optgroup key={cat} label={CATEGORY_LABEL[cat]}>
                  {MARKERS.filter((m) => m.category === cat).map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </Select>
          )}
        </Field>
        <Field id="rep-value" label="Value from your report" error={state.errors?.value}>
          {(aria) => <Input {...aria} name="value" type="number" inputMode="decimal" step="any" min={0} />}
        </Field>
        <Field id="rep-unit" label="Unit" hint="Use the unit printed on your report." error={state.errors?.unit}>
          {(aria) => (
            <Select {...aria} name="unit" key={marker}>
              {def.units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field id="rep-low" label="Your lab's range, lower end" optional hint="Copy it from your report if it shows one." error={state.errors?.refLow}>
          {(aria) => <Input {...aria} name="refLow" type="number" inputMode="decimal" step="any" min={0} />}
        </Field>
        <Field id="rep-high" label="Your lab's range, upper end" optional error={state.errors?.refHigh}>
          {(aria) => <Input {...aria} name="refHigh" type="number" inputMode="decimal" step="any" min={0} />}
        </Field>
      </div>
      <Field id="rep-notes" label="Notes" optional hint="Up to 200 characters. Please do not include names or ID numbers. Notes are never sent to an AI service." error={state.errors?.notes}>
        {(aria) => <Input {...aria} name="notes" maxLength={200} autoComplete="off" />}
      </Field>
      <p className="text-xs text-muted">{def.meaning}</p>
      <Button type="submit" loading={pending}>
        Save this value
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
