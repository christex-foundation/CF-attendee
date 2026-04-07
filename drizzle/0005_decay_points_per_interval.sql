ALTER TABLE "challenges" DROP COLUMN "decay_interval_seconds";--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "decay_points_per_interval" integer DEFAULT 1 NOT NULL;
