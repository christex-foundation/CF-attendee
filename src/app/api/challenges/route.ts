import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { challenges, quizQuestions } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db
      .select()
      .from(challenges)
      .orderBy(desc(challenges.createdAt));

    return NextResponse.json(all);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      type,
      status = "draft",
      pointsReward = 0,
      badgeEmoji,
      badgeName,
      anchorSession,
      streakRequired,
      speedSlots,
      checkinWindowSeconds,
      checkinActivatedAt,
      wagerMin,
      wagerMax,
      chainRequired,
      auctionMinBid,
      questions,
      deadline,
      decayEnabled,
      decayStartPoints,
      decayPointsPerInterval,
      decayIntervalSeconds,
    } = body;

    if (!title || !description || !type || !anchorSession) {
      return NextResponse.json(
        { error: "title, description, type, and anchorSession are required" },
        { status: 400 }
      );
    }

    if (type === "streak" && (!streakRequired || streakRequired < 1)) {
      return NextResponse.json(
        { error: "streakRequired must be >= 1 for streak challenges" },
        { status: 400 }
      );
    }

    if ((type === "quiz" || type === "poll") && (!Array.isArray(questions) || questions.length === 0)) {
      return NextResponse.json(
        { error: `${type === "quiz" ? "Quiz" : "Poll"} challenges require at least one question` },
        { status: 400 }
      );
    }

    if (type === "speedrun" && (!speedSlots || speedSlots < 1)) {
      return NextResponse.json(
        { error: "speedSlots must be >= 1 for speedrun challenges" },
        { status: 400 }
      );
    }

    if (type === "checkin" && (!checkinWindowSeconds || checkinWindowSeconds < 1)) {
      return NextResponse.json(
        { error: "checkinWindowSeconds must be >= 1 for checkin challenges" },
        { status: 400 }
      );
    }

    if (type === "wager") {
      if (!Array.isArray(questions) || questions.length === 0) {
        return NextResponse.json(
          { error: "Wager challenges require at least one question" },
          { status: 400 }
        );
      }
      if (!wagerMin || !wagerMax || wagerMin < 1 || wagerMax < wagerMin) {
        return NextResponse.json(
          { error: "wagerMin and wagerMax are required (min >= 1, max >= min)" },
          { status: 400 }
        );
      }
    }

    if (type === "chain" && (!chainRequired || chainRequired < 2)) {
      return NextResponse.json(
        { error: "chainRequired must be >= 2 for chain challenges" },
        { status: 400 }
      );
    }

    if (type === "auction" && (!auctionMinBid || auctionMinBid < 1)) {
      return NextResponse.json(
        { error: "auctionMinBid must be >= 1 for auction challenges" },
        { status: 400 }
      );
    }

    const [challenge] = await db
      .insert(challenges)
      .values({
        title: title.trim(),
        description: description.trim(),
        type,
        status,
        pointsReward,
        badgeEmoji: badgeEmoji || null,
        badgeName: badgeName || null,
        anchorSession,
        streakRequired: type === "streak" ? streakRequired : null,
        speedSlots: type === "speedrun" ? speedSlots : null,
        checkinWindowSeconds: type === "checkin" ? checkinWindowSeconds : null,
        checkinActivatedAt: type === "checkin" && checkinActivatedAt ? new Date(checkinActivatedAt) : null,
        wagerMin: type === "wager" ? wagerMin : null,
        wagerMax: type === "wager" ? wagerMax : null,
        chainRequired: type === "chain" ? chainRequired : null,
        auctionMinBid: type === "auction" ? auctionMinBid : null,
        deadline: deadline ? new Date(deadline) : null,
        decayEnabled: decayEnabled ?? false,
        decayStartPoints: decayEnabled ? (decayStartPoints ?? 40) : 40,
        decayPointsPerInterval: decayEnabled ? (decayPointsPerInterval ?? 1) : 1,
        decayIntervalSeconds: decayEnabled
          ? Math.max(1, Number.isFinite(decayIntervalSeconds) ? decayIntervalSeconds : 600)
          : 600,
      })
      .returning();

    if ((type === "quiz" || type === "poll" || type === "wager") && Array.isArray(questions)) {
      const questionValues = questions.map(
        (q: { questionText: string; options: string[]; correctIndex: number }, i: number) => ({
          challengeId: challenge.id,
          questionText: q.questionText,
          options: JSON.stringify(q.options),
          correctIndex: type === "poll" ? -1 : q.correctIndex,
          orderIndex: i,
        })
      );
      await db.insert(quizQuestions).values(questionValues);
    }

    return NextResponse.json(challenge, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }
}
