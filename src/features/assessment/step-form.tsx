"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveStepAction, type AssessmentFormState } from "./actions";
import { SubmitButton } from "./submit-button";
import { Field, Input, Select } from "@/components/ui/field";
import { inputStyles } from "@/components/ui/field";
import type { Field as QuestionField, Section } from "./questions";

type Props = { section: Section; saved: Record<string, unknown> | undefined };

const initial: AssessmentFormState = {};

export function StepForm({ section, saved }: Props) {
  const [state, action] = useActionState(saveStepAction, initial);
  const valueOf = (name: string) => state.values?.[name] ?? saved?.[name];

  return (
    <form action={action} className="space-y-6" noValidate>
      <input type="hidden" name="step" value={section.step} />
      {state.message && (
        <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm font-medium text-danger">
          {state.message}
        </p>
      )}

      {section.fields.map((f) => (
        <QuestionInput key={`${section.id}-${f.name}`} field={f} value={valueOf(f.name)} error={state.errors?.[f.name]} />
      ))}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
        <Link
          href={`/assessment?step=${section.step - 1}`}
          className="inline-flex min-h-11 items-center rounded-lg border border-border bg-white px-5 text-sm font-semibold text-navy hover:bg-teal-light"
        >
          Back
        </Link>
        <SubmitButton>Save and continue</SubmitButton>
        <p className="text-xs text-muted">Your progress is saved at every step, so you can come back later.</p>
      </div>
    </form>
  );
}

function QuestionInput({ field, value, error }: { field: QuestionField; value: unknown; error?: string }) {
  const id = `f-${field.name}`;
  const hintId = field.hint ? `${id}-hint` : undefined;
  const errId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(" ") || undefined;

  if (field.kind === "radio" || field.kind === "checkboxes") {
    const isRadio = field.kind === "radio";
    const selected = Array.isArray(value) ? (value as string[]) : value !== undefined ? [String(value)] : [];
    return (
      <fieldset className="space-y-2" aria-describedby={describedBy}>
        <legend className="text-sm font-medium text-navy">
          {field.label} {field.required ? <span className="sr-only">(required)</span> : <span className="font-normal text-muted">(optional)</span>}
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {field.options!.map((o) => (
            <label key={o.value} className="flex min-h-11 items-center gap-3 rounded-lg border border-border bg-white px-3 text-sm">
              <input
                type={isRadio ? "radio" : "checkbox"}
                name={field.name}
                value={o.value}
                defaultChecked={selected.includes(o.value)}
                className="h-5 w-5 accent-[#0e8a7c]"
              />
              {o.label}
            </label>
          ))}
        </div>
        {field.hint && (
          <p id={hintId} className="text-xs text-muted">
            {field.hint}
          </p>
        )}
        {error && (
          <p id={errId} role="alert" className="text-xs font-medium text-danger">
            {error}
          </p>
        )}
      </fieldset>
    );
  }

  return (
    <Field id={id} label={field.unit ? `${field.label} (${field.unit})` : field.label} optional={!field.required} hint={field.hint} error={error}>
      {(aria) => {
        if (field.kind === "select") {
          return (
            <Select {...aria} name={field.name} defaultValue={value === undefined ? "" : String(value)}>
              <option value="">Choose…</option>
              {field.options!.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          );
        }
        if (field.kind === "number") {
          return (
            <Input
              {...aria}
              name={field.name}
              type="number"
              inputMode="decimal"
              step="any"
              min={field.min}
              max={field.max}
              defaultValue={value === undefined ? "" : String(value)}
            />
          );
        }
        return (
          <textarea
            {...aria}
            name={field.name}
            rows={3}
            maxLength={field.maxLength}
            className={inputStyles + " py-2"}
            defaultValue={value === undefined ? "" : String(value)}
          />
        );
      }}
    </Field>
  );
}
