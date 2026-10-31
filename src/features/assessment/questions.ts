// All assessment questions live here as plain data.
// The form screens AND the server validation are both built from this one file,
// so what the user sees and what the server accepts can never drift apart.

export type Option = { value: string; label: string };

export type Field = {
  name: string;
  label: string;
  kind: "select" | "radio" | "checkboxes" | "number" | "text";
  options?: Option[];
  required?: boolean;
  hint?: string;
  min?: number;
  max?: number;
  unit?: string;
  maxLength?: number;
};

export type SectionId = "context" | "lifestyle" | "history" | "tests";

export type Section = {
  id: SectionId;
  step: number; // 2..5 (step 1 is consent, step 6 is review)
  title: string;
  intro: string;
  fields: Field[];
};

export const TOTAL_STEPS = 6;
export const STEP_TITLES = ["Consent", "Health context", "Lifestyle", "Medical history", "Existing tests", "Review"];

const PREFER_NOT: Option = { value: "prefer_not", label: "Prefer not to answer" };
const YES_NO: Option[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  PREFER_NOT,
];

export const SECTIONS: Section[] = [
  {
    id: "context",
    step: 2,
    title: "Basic health context",
    intro: "Only the age range is required. Everything else is optional and you can skip it.",
    fields: [
      {
        name: "ageRange",
        label: "Age range",
        kind: "select",
        required: true,
        options: [
          { value: "18-24", label: "18 to 24" },
          { value: "25-29", label: "25 to 29" },
          { value: "30-34", label: "30 to 34" },
          { value: "35-39", label: "35 to 39" },
          { value: "40-44", label: "40 to 44" },
          { value: "45-49", label: "45 to 49" },
          { value: "50+", label: "50 or older" },
        ],
        hint: "This service is for adults (18 or older).",
      },
      {
        name: "generalHealth",
        label: "How would you describe your general health?",
        kind: "radio",
        options: [
          { value: "excellent", label: "Excellent" },
          { value: "good", label: "Good" },
          { value: "fair", label: "Fair" },
          { value: "poor", label: "Poor" },
          PREFER_NOT,
        ],
      },
      {
        name: "underCare",
        label: "Are you currently seeing a healthcare professional about reproductive health?",
        kind: "radio",
        options: YES_NO,
      },
    ],
  },
  {
    id: "lifestyle",
    step: 3,
    title: "Lifestyle factors",
    intro: "Everything here is optional. These are general factors that health organizations discuss, not a judgement.",
    fields: [
      {
        name: "tobacco",
        label: "Tobacco or nicotine use",
        kind: "radio",
        options: [
          { value: "never", label: "Never" },
          { value: "former", label: "Used to, not now" },
          { value: "current", label: "Currently" },
          PREFER_NOT,
        ],
      },
      {
        name: "alcohol",
        label: "Alcohol, drinks per week",
        kind: "radio",
        options: [
          { value: "none", label: "None" },
          { value: "1-7", label: "1 to 7" },
          { value: "8-14", label: "8 to 14" },
          { value: "15+", label: "15 or more" },
          PREFER_NOT,
        ],
      },
      {
        name: "activity",
        label: "Physical activity",
        kind: "radio",
        options: [
          { value: "mostly_sitting", label: "Mostly sitting" },
          { value: "light", label: "Light (walking, some activity)" },
          { value: "moderate", label: "Moderate (regular exercise)" },
          { value: "high", label: "High (frequent intense exercise)" },
          PREFER_NOT,
        ],
      },
      {
        name: "sleep",
        label: "Typical sleep per night",
        kind: "radio",
        options: [
          { value: "under_6", label: "Under 6 hours" },
          { value: "6-7", label: "6 to 7 hours" },
          { value: "7-9", label: "7 to 9 hours" },
          { value: "over_9", label: "Over 9 hours" },
          PREFER_NOT,
        ],
      },
      {
        name: "stress",
        label: "Stress level lately",
        kind: "radio",
        options: [
          { value: "low", label: "Low" },
          { value: "moderate", label: "Moderate" },
          { value: "high", label: "High" },
          PREFER_NOT,
        ],
      },
      {
        name: "exposures",
        label: "Any of these apply regularly? (choose all that apply)",
        kind: "checkboxes",
        options: [
          { value: "heat", label: "Frequent hot tubs, saunas or other heat exposure" },
          { value: "chemicals", label: "Work or hobbies involving chemicals, pesticides or solvents" },
          { value: "long_sitting", label: "Many hours of sitting each day" },
          { value: "none", label: "None of these" },
        ],
      },
    ],
  },
  {
    id: "history",
    step: 4,
    title: "Relevant medical history",
    intro: "Every question is optional. Share only what you are comfortable with.",
    fields: [
      { name: "previousConcern", label: "Have you had a reproductive health concern before?", kind: "radio", options: YES_NO },
      { name: "surgeryInjury", label: "Any relevant surgery or injury in the past?", kind: "radio", options: YES_NO },
      { name: "chronicCondition", label: "Do you have a long-term medical condition?", kind: "radio", options: YES_NO },
      { name: "medications", label: "Do you take regular medication?", kind: "radio", options: YES_NO },
      { name: "previousAssessment", label: "Have you had a professional assessment for this before?", kind: "radio", options: YES_NO },
      {
        name: "notes",
        label: "Anything else you want to remember to ask a professional?",
        kind: "text",
        maxLength: 500,
        hint: "Up to 500 characters. Please do not include names or ID numbers.",
      },
    ],
  },
  {
    id: "tests",
    step: 5,
    title: "Existing tests",
    intro:
      "Optional. If you have a report from a laboratory or clinician you can note values here. Entering a result does not create a diagnosis, and leaving a value empty is never treated as abnormal.",
    fields: [
      {
        name: "semenAnalysisDone",
        label: "Have you had a semen analysis?",
        kind: "radio",
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not_sure", label: "Not sure" },
          PREFER_NOT,
        ],
      },
      {
        name: "concentration",
        label: "Sperm concentration from your report",
        kind: "number",
        min: 0,
        max: 1000,
        unit: "million per mL",
        hint: "Leave empty if you do not have it.",
      },
      {
        name: "motility",
        label: "Motility from your report",
        kind: "number",
        min: 0,
        max: 100,
        unit: "percent",
        hint: "Leave empty if you do not have it.",
      },
      {
        name: "testNotes",
        label: "Other notes from the report",
        kind: "text",
        maxLength: 500,
        hint: "Up to 500 characters.",
      },
    ],
  },
];

export function sectionByStep(step: number) {
  return SECTIONS.find((s) => s.step === step);
}

export function optionLabel(field: Field, value: unknown): string {
  if (value === undefined || value === null || value === "") return "Not answered";
  if (Array.isArray(value)) {
    if (value.length === 0) return "Not answered";
    return value.map((v) => field.options?.find((o) => o.value === v)?.label ?? String(v)).join(", ");
  }
  if (field.kind === "number") return `${value} ${field.unit ?? ""}`.trim();
  return field.options?.find((o) => o.value === value)?.label ?? String(value);
}
