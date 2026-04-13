import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { challenges, quizQuestions } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const challengeId = parseInt(id, 10);

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);

    if (!challenge) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    let questions: typeof quizQuestions.$inferSelect[] = [];
    if (challenge.type === "quiz" || challenge.type === "poll" || challenge.type === "wager") {
      questions = await db
        .select()
        .from(quizQuestions)
        .where(eq(quizQuestions.challengeId, challengeId))
        .orderBy(asc(quizQuestions.orderIndex));
    }

    return NextResponse.json({ challenge, questions });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch challenge" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const challengeId = parseInt(id, 10);
    const body = await request.json();

    const [updated] = await db
      .update(challenges)
      .set({
        ...(body.title && { title: body.title.trim() }),
        ...(body.description && { description: body.description.trim() }),
        ...(body.status && { status: body.status }),
        ...(body.pointsReward !== undefined && { pointsReward: body.pointsReward }),
        ...(body.badgeEmoji !== undefined && { badgeEmoji: body.badgeEmoji || null }),
        ...(body.badgeName !== undefined && { badgeName: body.badgeName || null }),
        ...(body.anchorSession && { anchorSession: body.anchorSession }),
        ...(body.streakRequired !== undefined && { streakRequired: body.streakRequired }),
        ...(body.speedSlots !== undefined && { speedSlots: body.speedSlots }),
        ...(body.checkinWindowSeconds !== undefined && { checkinWindowSeconds: body.checkinWindowSeconds }),
        ...(body.checkinActivatedAt !== undefined && { checkinActivatedAt: body.checkinActivatedAt ? new Date(body.checkinActivatedAt) : null }),
        ...(body.wagerMin !== undefined && { wagerMin: body.wagerMin }),
        ...(body.wagerMax !== undefined && { wagerMax: body.wagerMax }),
        ...(body.chainRequired !== undefined && { chainRequired: body.chainRequired }),
        ...(body.auctionMinBid !== undefined && { auctionMinBid: body.auctionMinBid }),
        ...(body.deadline !== undefined && { deadline: body.deadline ? new Date(body.deadline) : null }),
        ...(body.decayEnabled !== undefined && { decayEnabled: body.decayEnabled }),
        ...(body.decayStartPoints !== undefined && { decayStartPoints: body.decayStartPoints }),
        ...(body.decayPointsPerInterval !== undefined && { decayPointsPerInterval: body.decayPointsPerInterval }),
        ...(body.decayIntervalSeconds !== undefined && { decayIntervalSeconds: Math.max(1, body.decayIntervalSeconds) }),
      })
      .where(eq(challenges.id, challengeId))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    // Update quiz/poll questions if provided
    if (Array.isArray(body.questions) && (updated.type === "quiz" || updated.type === "poll" || updated.type === "wager")) {
      await db.delete(quizQuestions).where(eq(quizQuestions.challengeId, challengeId));
      if (body.questions.length > 0) {
        const questionValues = body.questions.map(
          (q: { questionText: string; options: string[]; correctIndex: number }, i: number) => ({
            challengeId,
            questionText: q.questionText,
            options: JSON.stringify(q.options),
            correctIndex: updated.type === "poll" ? -1 : q.correctIndex,
            orderIndex: i,
          })
        );
        await db.insert(quizQuestions).values(questionValues);
      }
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update challenge" },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const challengeId = parseInt(id, 10);

    const [deleted] = await db
      .delete(challenges)
      .where(eq(challenges.id, challengeId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Challenge not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete challenge" },
      { status: 500 }
    );
  }
}
