"use server";

import { requireUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { rateLimit } from "@/lib/security/rate-limit";
import { todayIso } from "@/lib/dates";
import { generateIntelligence, type IntelligenceCheck } from "@/lib/ai/intelligence";
import { hasHealthConsent, responsesFor } from "@/features/assessment/queries";
import { latestSubmitted } from "@/features/insights/queries";
import { consentState } from "@/features/privacy/queries";
import { loadHabitEntries } from "@/features/tracker/queries";
import { loadBiomarkers } from "@/features/medical/queries";
import { buildPatternInsights, ruleOverview, ruleQuestions, type DataGroup } from "./engine";

export type IntelligenceView = {
  mode: "ai" | "rules";
  overview: string;
  questions: string[];
  checks: IntelligenceCheck[];
  fallbackReason?: string;
  receipt: { sent: boolean; included: DataGroup[]; facts: string[] };
};

export type IntelligenceState = { message?: string; result?: IntelligenceView };

const GROUPS: DataGroup[] = ["habits", "assessment", "labs"];
const NOT_SENT = ["no_consent", "ai_off", "no_data"];

// Builds the facts server-side from the signed-in user's own rows. The browser only says WHICH groups to include.
// Lab values are never included unless the person ticks them in this very request.
export async function intelligenceAction(_prevState: IntelligenceState, formData: FormData): Promise<IntelligenceState> {
  const user = await requireUser();
  if (!(await hasHealthConsent(user.id))) return { message: "Health consent is needed first (Health Assessment, step 1)." };
  if (!rateLimit(`intelligence:${user.id}`, 10, 60 * 60 * 1000).ok) {
    return { message: "You have asked for many summaries in a short time. Please try again later." };
  }

  const picked = formData.getAll("include").filter((v): v is DataGroup => typeof v === "string" && GROUPS.includes(v as DataGroup));
  const included = [...new Set(picked)];

  const [consent, entries, assessment, allLabs] = await Promise.all([
    consentState(user.id),
    loadHabitEntries(user.id),
    latestSubmitted(user.id),
    loadBiomarkers(user.id),
  ]);
  const responses = assessment ? await responsesFor(user.id, assessment.id) : null;

  // The rules summary always sees everything the person has (it never leaves the server except to the person's own screen).
  const full = buildPatternInsights({ entries, today: todayIso(), responses, biomarkers: allLabs });
  const overview = ruleOverview(full);
  const questions = ruleQuestions(full.insights);

  // What may be sent: only the groups ticked now, and labs only if ticked.
  const forAi = buildPatternInsights({ entries, today: todayIso(), responses, biomarkers: included.includes("labs") ? allLabs : [] });
  const facts = [
    ...new Set(forAi.insights.flatMap((i) => i.supportingData).filter((f) => included.includes(f.group)).map((f) => f.text)),
  ];

  const result = await generateIntelligence({ facts, consent: consent.aiTracking });

  if (result.ok) {
    await recordAudit(user.id, "ai.tracking_summary");
    return {
      result: {
        mode: "ai",
        overview: result.notes.overview,
        questions: result.notes.questions,
        checks: result.checks,
        receipt: { sent: true, included, facts },
      },
    };
  }

  const sent = !NOT_SENT.includes(result.reason);
  if (sent) await recordAudit(user.id, "ai.tracking_summary");
  return {
    result: {
      mode: "rules",
      overview,
      questions,
      checks: result.checks,
      fallbackReason: result.reason,
      receipt: { sent, included, facts: sent ? facts : [] },
    },
  };
}
