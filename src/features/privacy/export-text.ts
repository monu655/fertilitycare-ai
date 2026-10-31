import { SECTIONS, optionLabel } from "@/features/assessment/questions";
import { AiNotesSchema, InsightSchema } from "@/lib/insights/schema";
import type { buildExport } from "./queries";

type ExportData = Awaited<ReturnType<typeof buildExport>>;

const when = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeStyle: "short", timeZone: "UTC" });
const fmt = (d: Date | string | null | undefined) => (d ? `${when.format(new Date(d))} UTC` : "not recorded");

const PURPOSE: Record<string, string> = {
  HEALTH_ASSESSMENT: "Health assessment consent",
  AI_PROCESSING: "AI notes consent",
  RESEARCH: "Research consent",
};

const ACTIONS: Record<string, string> = {
  "account.created": "Account created",
  "consent.granted": "Health consent given",
  "consent.withdrawn": "Health consent withdrawn",
  "consent.ai_granted": "AI notes consent given",
  "consent.ai_withdrawn": "AI notes consent withdrawn",
  "assessment.submitted": "Assessment submitted",
  "assessments.deleted": "Assessment data deleted",
  "data.exported": "Data downloaded",
  "summary.questions_saved": "Consultation questions saved",
  "password.changed": "Password changed",
  "profile.updated": "Name updated",
};

// The same data as the JSON file, written as plain sentences that a non-technical person can read.
export function exportAsText(data: ExportData): string {
  const out: string[] = [];
  const heading = (t: string) => out.push("", t.toUpperCase(), "-".repeat(t.length));

  out.push("FERTILITYCARE AI - YOUR DATA", `Downloaded on ${fmt(data.exportedAt)}`);
  out.push("This file contains your personal health information. Keep it somewhere private.");

  heading("Your account");
  out.push(`Name: ${data.account?.name ?? "not set"}`, `Email: ${data.account?.email ?? ""}`, `Account created: ${fmt(data.account?.createdAt)}`);
  out.push("Your password is never included in this file.");

  heading("Your consent choices (oldest first)");
  if (data.consents.length === 0) out.push("No consent choices recorded.");
  for (const c of data.consents) {
    out.push(`${fmt(c.createdAt)}: ${PURPOSE[c.purpose] ?? c.purpose} - ${c.granted ? "Given" : "Withdrawn"} (version ${c.version})`);
  }

  heading("Your health assessments");
  if (data.assessments.length === 0) out.push("No assessments stored.");
  data.assessments.forEach((a, i) => {
    out.push("", `Assessment ${i + 1}: ${a.status === "SUBMITTED" ? `submitted ${fmt(a.submittedAt)}` : `still in progress, started ${fmt(a.createdAt)}`}`);
    for (const s of SECTIONS) {
      const answers = (a.answers as Record<string, Record<string, unknown>>)[s.id];
      if (!answers) continue;
      out.push("", `  ${s.title}`);
      for (const f of s.fields) {
        if (answers[f.name] === undefined) continue;
        out.push(`    ${f.label} ${optionLabel(f, answers[f.name])}`);
      }
    }
  });

  heading("Educational insights created for you");
  if (data.insights.length === 0) out.push("No insights stored.");
  for (const row of data.insights) {
    const insight = InsightSchema.safeParse(row.content);
    const ai = AiNotesSchema.safeParse(row.content);
    out.push("", `* ${row.topic}${row.source === "ai" ? " (AI-generated, educational only)" : ""}`);
    if (insight.success) {
      const i = insight.data;
      out.push(`  What you reported: ${i.reported.length ? i.reported.join("; ") : "nothing specific (general information)"}`);
      out.push(`  Information: ${i.explanation}`, `  Why it may matter: ${i.whyItMatters}`);
      out.push(`  Suggested next steps: ${i.nextSteps.join(" ")}`, `  When to talk to a professional: ${i.whenToConsult}`);
      out.push(`  Limits: ${i.limitations}`);
    } else if (ai.success) {
      out.push(`  ${ai.data.summary}`, `  Questions you could ask: ${ai.data.questions.join(" | ")}`);
    }
  }

  heading("Your own consultation questions");
  const questions = data.consultationQuestions.flatMap((q) => (Array.isArray(q.questions) ? (q.questions as string[]) : []));
  if (questions.length === 0) out.push("None saved.");
  questions.forEach((q, i) => out.push(`${i + 1}. ${q}`));

  heading("Activity on your account");
  if (data.activityLog.length === 0) out.push("Nothing recorded.");
  for (const a of data.activityLog) out.push(`${fmt(a.createdAt)}: ${ACTIONS[a.action] ?? a.action}`);

  out.push("", "This file is educational record-keeping, not a medical record or a diagnosis.", "");
  return out.join("\n");
}
