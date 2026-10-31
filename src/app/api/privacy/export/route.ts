import { auth } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { recordAudit } from "@/lib/audit";
import { buildExport } from "@/features/privacy/queries";
import { SECTIONS, optionLabel } from "@/features/assessment/questions";
import { sourceById } from "@/data/evidence-library";
import { AiNotesSchema, InsightSchema } from "@/lib/insights/schema";

type ExportData = Awaited<ReturnType<typeof buildExport>>;

const CONSENT_NAMES: Record<string, string> = {
  HEALTH_ASSESSMENT: "Health assessment consent",
  AI_PROCESSING: "AI notes consent",
  RESEARCH: "Research consent",
};

const ACTION_NAMES: Record<string, string> = {
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

const when = (d: Date | string | null) => (d ? new Date(d).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "not recorded");

// Turns the export into a plain, readable text file (the JSON version is still available with ?format=json).
function toReadableText(data: ExportData): string {
  const out: string[] = [];
  const line = (text = "") => out.push(text);
  const heading = (text: string) => {
    line();
    line(text.toUpperCase());
    line("-".repeat(text.length));
  };

  line("FERTILITYCARE AI - YOUR DATA");
  line(`Downloaded: ${when(data.exportedAt)}`);
  line("This file contains your personal health information. Keep it somewhere private.");

  heading("Account");
  line(`Name: ${data.account.name ?? "not set"}`);
  line(`Email: ${data.account.email}`);
  line(`Account created: ${when(data.account.createdAt)}`);

  heading("Consent history");
  if (data.consents.length === 0) line("No consent choices recorded.");
  for (const c of data.consents) {
    line(`${when(c.createdAt)}  ${CONSENT_NAMES[c.purpose] ?? c.purpose}: ${c.granted ? "given" : "withdrawn"}`);
  }

  for (const a of data.assessments) {
    heading(`Assessment (${a.status === "SUBMITTED" ? `submitted ${when(a.submittedAt)}` : "not submitted yet"})`);
    const answers = a.answers as Record<string, Record<string, unknown>>;
    for (const section of SECTIONS) {
      const rows = section.fields.filter((f) => {
        const v = answers[section.id]?.[f.name];
        return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
      });
      if (rows.length === 0) continue;
      line();
      line(section.title);
      for (const f of rows) line(`  ${f.label}: ${optionLabel(f, answers[section.id][f.name])}`);
    }
  }
  if (data.assessments.length === 0) {
    heading("Assessment");
    line("No assessment data stored.");
  }

  heading("Insights");
  if (data.insights.length === 0) line("No insights stored.");
  let n = 0;
  for (const row of data.insights) {
    n += 1;
    const insight = InsightSchema.safeParse(row.content);
    const ai = AiNotesSchema.safeParse(row.content);
    line();
    if (insight.success) {
      const i = insight.data;
      line(`${n}. ${i.topic}`);
      if (i.reported.length) line(`   You reported: ${i.reported.join("; ")}`);
      line(`   Information: ${i.explanation}`);
      line(`   Why it may matter: ${i.whyItMatters}`);
      for (const s of i.nextSteps) line(`   Next step: ${s}`);
      line(`   Discuss with a professional: ${i.whenToConsult}`);
      line(`   Limits: ${i.limitations}`);
      for (const id of i.sourceIds) {
        const s = sourceById(id);
        if (s) line(`   Source: ${s.title} (${s.organization}) ${s.url}`);
      }
    } else if (ai.success) {
      line(`${n}. AI-generated educational notes (not a diagnosis)`);
      line(`   ${ai.data.summary}`);
      for (const q of ai.data.questions) line(`   Question: ${q}`);
    } else {
      line(`${n}. ${row.topic}`);
    }
  }

  heading("Your questions for a healthcare professional");
  const saved = data.consultationQuestions.flatMap((s) => (Array.isArray(s.questions) ? (s.questions as unknown[]) : []));
  if (saved.length === 0) line("None saved.");
  for (const q of saved) line(`- ${String(q)}`);

  heading("Activity on your account");
  for (const e of data.activityLog) line(`${when(e.createdAt)}  ${ACTION_NAMES[e.action] ?? e.action}`);

  line();
  return out.join("\r\n");
}

// POST only (the Privacy Center button is a form). Downloads the user's own data.
export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response("Please sign in.", { status: 401 });

  // Extra protection against other websites posting to this URL.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) return new Response("Not allowed.", { status: 403 });

  const data = await buildExport(userId);
  if (!data.account) return new Response("Account not found.", { status: 404 });

  // The Privacy Center buttons send "format" as a form field. ?format=json in the URL also works.
  let format = new URL(request.url).searchParams.get("format");
  if (!format) {
    try {
      const value = (await request.formData()).get("format");
      format = typeof value === "string" ? value : null;
    } catch {
      format = null; // no form body: use the default (readable text)
    }
  }
  const asJson = format === "json";

  await db.insert(schema.exportRequests).values({ userId, kind: asJson ? "FULL_JSON" : "READABLE_TEXT", status: "READY" });
  await recordAudit(userId, "data.exported");

  const day = new Date().toISOString().slice(0, 10);
  return new Response(asJson ? JSON.stringify(data, null, 2) : toReadableText(data), {
    headers: {
      "content-type": asJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="fertilitycare-data-${day}.${asJson ? "json" : "txt"}"`,
      "cache-control": "no-store",
    },
  });
}
