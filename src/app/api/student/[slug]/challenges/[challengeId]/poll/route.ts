import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  students,
  challenges,
  quizQuestions,
  quizAttempts,
  studentChallengeProgress,
} from "@/lib/db/schema";
import { eq, asc, and, sql } from "drizzle-orm";

interface Params {
  params: Promise<{ slug: string; challengeId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { challengeId } = await params;
    const cid = parseInt(challengeId, 10);

    const questions = await db
      .select({
        id: quizQuestions.id,
        questionText: quizQuestions.questionText,
        options: quizQuestions.options,
        orderIndex: quizQuestions.orderIndex,
      })
      .from(quizQuestions)
      .where(eq(quizQuestions.challengeId, cid))
      .orderBy(asc(quizQuestions.orderIndex));

    const parsed = questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: JSON.parse(q.options) as string[],
      orderIndex: q.orderIndex,
    }));

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch poll questions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { slug, challengeId } = await params;
    const cid = parseInt(challengeId, 10);
    const body = await request.json();
    const { answers } = body as { answers: number[] };

    if (!Array.isArray(answers)) {
      return NextResponse.json(
        { error: "answers array is required" },
        { status: 400 }
      );
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.slug, slug))
      .limit(1);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const [existingProgress] = await db
      .select()
      .from(studentChallengeProgress)
      .where(
        and(
          eq(studentChallengeProgress.studentId, student.id),
          eq(studentChallengeProgress.challengeId, cid),
          eq(studentChallengeProgress.completed, true)
        )
      )
      .limit(1);

    if (existingProgress) {
      return NextResponse.json(
        { error: "Poll already completed" },
        { status: 409 }
      );
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, cid))
      .limit(1);

    if (!challenge || challenge.type !== "poll") {
      return NextResponse.json(
        { error: "Poll challenge not found" },
        { status: 404 }
      );
    }

    if (challenge.deadline && new Date(challenge.deadline) < new Date()) {
      return NextResponse.json(
        { error: "Poll deadline has passed" },
        { status: 403 }
      );
    }

    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.challengeId, cid))
      .orderBy(asc(quizQuestions.orderIndex));

    if (answers.length !== questions.length) {
      return NextResponse.json(
        { error: `Expected ${questions.length} answers, got ${answers.length}` },
        { status: 400 }
      );
    }

    const total = questions.length;

    // Save response (polls always pass — participation-based)
    await db.insert(quizAttempts).values({
      studentId: student.id,
      challengeId: cid,
      answers: JSON.stringify(answers),
      score: total,
      total,
      passed: true,
    });

    // Polls award no points — they're purely for data collection
    const earnedPoints = 0;
    const badgeEarned = false;

    await db
      .insert(studentChallengeProgress)
      .values({
        studentId: student.id,
        challengeId: cid,
        completed: true,
        pointsEarned: earnedPoints,
        badgeEarned,
        completedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: [
          studentChallengeProgress.studentId,
          studentChallengeProgress.challengeId,
        ],
        set: {
          completed: sql`true`,
          pointsEarned: sql`${earnedPoints}`,
          badgeEarned: sql`${badgeEarned}`,
          completedAt: sql`now()`,
        },
      });

    return NextResponse.json({ score: total, total, passed: true, pointsEarned: earnedPoints });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit poll" },
      { status: 500 }
    );
  }
}
