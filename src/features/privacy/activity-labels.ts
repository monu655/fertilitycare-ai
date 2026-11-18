// Plain-words names for the audit events. Events record WHO did WHAT and WHEN, never any health answers.
export const ACTION_LABELS: Record<string, string> = {
  "account.created": "Account created",
  signin: "Signed in",
  "demo.started": "Demo account started",
  "consent.granted": "Health consent given",
  "consent.withdrawn": "Health consent withdrawn",
  "consent.ai_granted": "AI notes consent given",
  "consent.ai_withdrawn": "AI notes consent withdrawn",
  "consent.ai_tracking_granted": "AI tracking-data consent given",
  "consent.ai_tracking_withdrawn": "AI tracking-data consent withdrawn",
  "habit.saved": "Daily tracker entry saved",
  "habit.deleted": "Daily tracker entry deleted",
  "biomarker.added": "Lab value added",
  "biomarker.deleted": "Lab value deleted",
  "goal.added": "Weekly goal added",
  "goal.updated": "Weekly goal updated",
  "goal.deleted": "Weekly goal deleted",
  "ai.tracking_summary": "AI tracking summary requested",
  "assessment.submitted": "Assessment submitted",
  "assessments.deleted": "Assessment data deleted",
  "data.exported": "Data downloaded",
  "summary.questions_saved": "Consultation questions saved",
  "password.changed": "Password changed",
  "profile.updated": "Name updated",
};

export const dateTimeFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
