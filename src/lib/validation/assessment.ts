import { z } from "zod";
import type { Field, Section } from "@/features/assessment/questions";

// Builds the server-side validation rules from the question list.
function fieldSchema(f: Field): z.ZodTypeAny {
  const values = (f.options ?? []).map((o) => o.value) as [string, ...string[]];

  switch (f.kind) {
    case "select":
    case "radio": {
      const base = z.enum(values, { error: "Choose one of the options." });
      return f.required ? base : base.optional();
    }
    case "checkboxes":
      return z.array(z.enum(values, { error: "Invalid choice." })).max(values.length);
    case "number": {
      let n = z.number({ error: "Enter a number." });
      if (f.min !== undefined) n = n.min(f.min, `Must be at least ${f.min}.`);
      if (f.max !== undefined) n = n.max(f.max, `Must be at most ${f.max}.`);
      return n.optional();
    }
    case "text":
      return z.string().trim().max(f.maxLength ?? 500, `Use at most ${f.maxLength ?? 500} characters.`).optional();
  }
}

export function sectionSchema(section: Section) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of section.fields) shape[f.name] = fieldSchema(f);
  // z.object drops any field we did not declare, so a user cannot sneak in extra data.
  return z.object(shape);
}

// Reads ONLY the declared fields from the submitted form.
export function formToObject(section: Section, formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of section.fields) {
    if (f.kind === "checkboxes") {
      out[f.name] = formData.getAll(f.name).filter((v): v is string => typeof v === "string");
      continue;
    }
    const v = formData.get(f.name);
    if (typeof v !== "string" || v.trim() === "") {
      out[f.name] = undefined;
    } else {
      out[f.name] = f.kind === "number" ? Number(v) : v;
    }
  }
  return out;
}

export const consentSchema = z.object({
  consentHealth: z.literal("on", { error: "Please agree to continue, or leave the assessment." }),
  consentAi: z.enum(["on"]).optional(),
});
