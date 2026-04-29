DROP TABLE "auction_bids" CASCADE;--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."challenge_type";--> statement-breakpoint
CREATE TYPE "public"."challenge_type" AS ENUM('quiz', 'task', 'streak', 'poll', 'speedrun', 'checkin', 'wager', 'bounty', 'chain', 'duel');--> statement-breakpoint
ALTER TABLE "challenges" ALTER COLUMN "type" SET DATA TYPE "public"."challenge_type" USING "type"::"public"."challenge_type";--> statement-breakpoint
ALTER TABLE "challenges" DROP COLUMN "auction_min_bid";