import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { challenges, auctionBids, studentChallengeProgress } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const challengeId = parseInt(id, 10);

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);

    if (!challenge || challenge.type !== "auction") {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    // Get highest bid
    const [highest] = await db
      .select()
      .from(auctionBids)
      .where(eq(auctionBids.challengeId, challengeId))
      .orderBy(desc(auctionBids.amount))
      .limit(1);

    if (!highest) {
      return NextResponse.json({ error: "No bids placed" }, { status: 400 });
    }

    // Winner pays their bid (negative points) and gets the badge
    const cost = -highest.amount;
    const badgeEarned = !!challenge.badgeName;

    await db
      .insert(studentChallengeProgress)
      .values({
        studentId: highest.studentId,
        challengeId,
        completed: true,
        pointsEarned: cost,
        badgeEarned,
        completedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: [studentChallengeProgress.studentId, studentChallengeProgress.challengeId],
        set: {
          completed: sql`true`,
          pointsEarned: sql`${cost}`,
          badgeEarned: sql`${badgeEarned}`,
          completedAt: sql`now()`,
        },
      });

    // Archive the challenge
    await db
      .update(challenges)
      .set({ status: "archived" })
      .where(eq(challenges.id, challengeId));

    return NextResponse.json({
      success: true,
      winnerId: highest.studentId,
      winningBid: highest.amount,
    });
  } catch {
    return NextResponse.json({ error: "Failed to settle auction" }, { status: 500 });
  }
}
