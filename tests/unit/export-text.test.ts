import { describe, expect, it } from "vitest";
import { exportAsText } from "@/features/privacy/export-text";
import { buildInsights } from "@/lib/insights/rules";

type Data = Parameters<typeof exportAsText>[0];

const data = {
  exportedAt: "2026-10-29T08:00:00.000Z",
  note: "x",
  account: { id: "u1", email: "a@example.com", name: "Asha", createdAt: new Date("2026-10-27T08:00:00Z") },
  consents: [{ purpose: "HEALTH_ASSESSMENT", granted: true, version: "v1", createdAt: new Date("2026-10-27T09:00:00Z") }],
  assessments: [
    {
      id: "a1",
      status: "SUBMITTED",
      createdAt: new Date(),
      submittedAt: new Date("2026-10-27T10:00:00Z"),
      answers: { context: { ageRange: "40-44" }, lifestyle: { tobacco: "current" } },
    },
  ],
  insights: buildInsights({ context: { ageRange: "40-44" }, lifestyle: { tobacco: "current" } }).map((i) => ({
    assessmentId: "a1",
    topic: i.topic,
    source: "rules",
    content: i,
  })),
  consultationQuestions: [{ assessmentId: "a1", questions: ["Is my sleep a concern?"] }],
  activityLog: [{ action: "account.created", createdAt: new Date("2026-10-27T08:00:00Z") }],
} as unknown as Data;

describe("exportAsText", () => {
  const text = exportAsText(data);

  it("is written as plain sentences, not code", () => {
    expect(text).toContain("YOUR ACCOUNT");
    expect(text).toContain("Email: a@example.com");
    expect(text).toContain("Health assessment consent - Given");
    expect(text).toContain("40 to 44");
    expect(text).toContain("Is my sleep a concern?");
    expect(text).toContain("Account created");
    expect(text).not.toMatch(/[{}\[\]]"|":/);
  });

  it("never includes password data", () => {
    expect(text).not.toMatch(/password_?hash|\$2[aby]\$/i);
  });

  it("lists insights with their limits", () => {
    expect(text).toContain("Tobacco and sperm health");
    expect(text).toContain("Limits:");
  });
});
