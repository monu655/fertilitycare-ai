ALTER TYPE "public"."consent_purpose" ADD VALUE 'AI_TRACKING_DATA';--> statement-breakpoint
CREATE TABLE "biomarker_records" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"taken_on" date NOT NULL,
	"marker" text NOT NULL,
	"value" real NOT NULL,
	"unit" text NOT NULL,
	"ref_low" real,
	"ref_high" real,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "habit_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"entry_date" date NOT NULL,
	"sleep_hours" real,
	"bedtime_minutes" integer,
	"stress" smallint,
	"meal_pattern" text,
	"fruit_veg" smallint,
	"exercise_minutes" integer,
	"sitting_hours" real,
	"heat_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_goals" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"week_start" date NOT NULL,
	"goal_key" text NOT NULL,
	"target_days" smallint NOT NULL,
	"days_done" smallint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "biomarker_records" ADD CONSTRAINT "biomarker_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit_entries" ADD CONSTRAINT "habit_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_goals" ADD CONSTRAINT "weekly_goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "biomarker_user_marker_idx" ON "biomarker_records" USING btree ("user_id","marker","taken_on");--> statement-breakpoint
CREATE UNIQUE INDEX "habit_user_date_uq" ON "habit_entries" USING btree ("user_id","entry_date");--> statement-breakpoint
CREATE UNIQUE INDEX "goal_user_week_key_uq" ON "weekly_goals" USING btree ("user_id","week_start","goal_key");