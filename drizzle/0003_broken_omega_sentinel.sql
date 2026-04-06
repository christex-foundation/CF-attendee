ALTER TABLE "challenges" ADD COLUMN "deadline" timestamp;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "decay_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "decay_start_points" integer DEFAULT 40 NOT NULL;--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "task_submissions" ADD COLUMN "points_snapshot" integer;