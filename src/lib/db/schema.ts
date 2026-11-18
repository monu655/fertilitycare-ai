// FertilityCare AI - database schema (Drizzle ORM + PostgreSQL)
// Health answers live in assessment_responses, separate from identity data in users.
// Every private row has a user_id so the server can check ownership on each request.

import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  smallint,
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
  // Separate consent before daily habit numbers or lab entries may be sent to an AI service.
  "AI_TRACKING_DATA",
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

// One row per person per day. Every field except the date is optional.
// There is deliberately no free-text column here, so nothing identifying can be typed into a daily entry.
export const habitEntries = pgTable(
  "habit_entries",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryDate: date("entry_date", { mode: "string" }).notNull(),
    sleepHours: real("sleep_hours"),
    bedtimeMinutes: integer("bedtime_minutes"), // minutes after midnight, 0 to 1439
    stress: smallint("stress"), // 1 (low) to 5 (high), the person's own rating
    mealPattern: text("meal_pattern"), // mostly_home | mixed | mostly_packaged
    fruitVeg: smallint("fruit_veg"), // portions
    exerciseMinutes: integer("exercise_minutes"),
    sittingHours: real("sitting_hours"),
    heatMinutes: integer("heat_minutes"), // hot tub, sauna, hot bath, heated seat
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("habit_user_date_uq").on(t.userId, t.entryDate)],
);

// Values the person typed from their own laboratory report. The app never supplies a reference range:
// refLow and refHigh are only what the person copied from their report.
export const biomarkerRecords = pgTable(
  "biomarker_records",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    takenOn: date("taken_on", { mode: "string" }).notNull(),
    marker: text("marker").notNull(),
    value: real("value").notNull(),
    unit: text("unit").notNull(),
    refLow: real("ref_low"),
    refHigh: real("ref_high"),
    notes: text("notes"), // short, never sent to any AI service
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("biomarker_user_marker_idx").on(t.userId, t.marker, t.takenOn)],
);

// A small goal the person chose for one week, and how many days they did it.
export const weeklyGoals = pgTable(
  "weekly_goals",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    weekStart: date("week_start", { mode: "string" }).notNull(), // the Monday
    goalKey: text("goal_key").notNull(),
    targetDays: smallint("target_days").notNull(),
    daysDone: smallint("days_done").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("goal_user_week_key_uq").on(t.userId, t.weekStart, t.goalKey)],
);

export type User = typeof users.$inferSelect;
export type Assessment = typeof assessments.$inferSelect;
