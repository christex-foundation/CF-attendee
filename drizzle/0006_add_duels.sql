CREATE TYPE "public"."duel_status" AS ENUM('pending', 'accepted', 'declined', 'submitted', 'resolved', 'void');--> statement-breakpoint
ALTER TYPE "public"."challenge_type" ADD VALUE 'duel';--> statement-breakpoint
CREATE TABLE "student_duels" (
	"id" serial PRIMARY KEY NOT NULL,
	"challenge_id" integer NOT NULL,
	"challenger_id" integer NOT NULL,
	"opponent_id" integer NOT NULL,
	"wager_amount" integer NOT NULL,
	"status" "duel_status" DEFAULT 'pending' NOT NULL,
	"challenger_submission" text,
	"opponent_submission" text,
	"challenger_submitted_at" timestamp,
	"opponent_submitted_at" timestamp,
	"winner_id" integer,
	"actual_points_transferred" integer,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_duels" ADD CONSTRAINT "student_duels_challenge_id_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_duels" ADD CONSTRAINT "student_duels_challenger_id_students_id_fk" FOREIGN KEY ("challenger_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_duels" ADD CONSTRAINT "student_duels_opponent_id_students_id_fk" FOREIGN KEY ("opponent_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_duels" ADD CONSTRAINT "student_duels_winner_id_students_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."students"("id") ON DELETE set null ON UPDATE no action;
