// Plain-words names for the audit events. Events record WHO did WHAT and WHEN, never any health answers.
export const ACTION_LABELS: Record<string, string> = {
  "account.created": "Account created",
  signin: "Signed in",
  "demo.started": "Demo account started",
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

export const dateTimeFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
