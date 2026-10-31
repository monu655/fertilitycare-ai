// FertilityCare AI - database schema (Drizzle ORM + PostgreSQL)
// Health answers live in assessment_responses, separate from identity data in users.
// Every private row has a user_id so the server can check ownership on each request.

import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createId } from "./id";

export const roleEnum = pgEnum("role", ["USER", "ADMIN"]);
export const assessmentStatusEnum = pgEnum("assessment_status", ["IN_PROGRESS", "SUBMITTED"]);
export const consentPurposeEnum = pgEnum("consent_purpose", [
  "HEALTH_ASSESSMENT",
  "AI_PROCESSING",
  "RESEARCH",
]);
export const tokenTypeEnum = pgEnum("token_type", ["EMAIL_VERIFY", "PASSWORD_RESET"]);
export const exportStatusEnum = pgEnum("export_status", ["REQUESTED", "READY", "FAILED"]);

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    email: text("email").notNull().unique(),
    name: text("name"),
    passwordHash: text("password_hash").notNull(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    role: roleEnum("role").notNull().default("USER"),
    isDemo: boolean("is_demo").notNull().default(false),
    allowSummarySharing: boolean("allow_summary_sharing").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("users_is_demo_idx").on(t.isDemo)],
);

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: tokenTypeEnum("type").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verification_tokens_user_type_idx").on(t.userId, t.type)],
);

export const consentRecords = pgTable(
  "consent_records",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: consentPurposeEnum("purpose").notNull(),
    granted: boolean("granted").notNull(),
    version: text("version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("consent_user_purpose_idx").on(t.userId, t.purpose, t.createdAt)],
);

export const assessments = pgTable(
  "assessments",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: assessmentStatusEnum("status").notNull().default("IN_PROGRESS"),
    currentStep: integer("current_step").notNull().default(1),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("assessments_user_status_idx").on(t.userId, t.status)],
);

export const assessmentResponses = pgTable(
  "assessment_responses",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    section: text("section").notNull(),
    data: jsonb("data").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("responses_assessment_section_uq").on(t.assessmentId, t.section),
    index("responses_user_idx").on(t.userId),
  ],
);

export const healthInsights = pgTable(
  "health_insights",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    topic: text("topic").notNull(),
    content: jsonb("content").notNull(),
    // "rules" = built from the curated evidence library, "ai" = model output that passed schema validation
    source: text("source").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("insights_user_assessment_idx").on(t.userId, t.assessmentId)],
);

export const consultationSummaries = pgTable(
  "consultation_summaries",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // The user's own extra questions for the clinician
    questions: jsonb("questions").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("summaries_user_idx").on(t.userId)],
);

export const exportRequests = pgTable(
  "export_requests",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    status: exportStatusEnum("status").notNull().default("REQUESTED"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("exports_user_idx").on(t.userId)],
);

// Audit events never store health content: only who did what, and when.
// user_id has no foreign key on purpose, so the log survives account deletion.
export const auditEvents = pgTable(
  "audit_events",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id"),
    action: text("action").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_user_created_idx").on(t.userId, t.createdAt), index("audit_action_idx").on(t.action)],
);

export type User = typeof users.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
