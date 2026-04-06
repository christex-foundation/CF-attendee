import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { challenges, quizQuestions } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const all = await db
      .select()
      .from(challenges)
      .orderBy(asc(challenges.createdAt));

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
      questions,
      deadline,
      decayEnabled,
      decayStartPoints,
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

    if (type === "quiz" && (!Array.isArray(questions) || questions.length === 0)) {
      return NextResponse.json(
        { error: "Quiz challenges require at least one question" },
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
        deadline: deadline ? new Date(deadline) : null,
        decayEnabled: decayEnabled ?? false,
        decayStartPoints: decayEnabled ? (decayStartPoints ?? 40) : 40,
      })
      .returning();

    if (type === "quiz" && Array.isArray(questions)) {
      const questionValues = questions.map(
        (q: { questionText: string; options: string[]; correctIndex: number }, i: number) => ({
          challengeId: challenge.id,
          questionText: q.questionText,
          options: JSON.stringify(q.options),
          correctIndex: q.correctIndex,
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
