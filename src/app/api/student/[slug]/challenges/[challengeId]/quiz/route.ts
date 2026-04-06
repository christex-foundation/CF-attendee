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

    // Parse JSON options but strip correctIndex
    const parsed = questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: JSON.parse(q.options) as string[],
      orderIndex: q.orderIndex,
    }));

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch questions" },
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

    // Prevent re-attempts after completion
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
        { error: "Challenge already completed" },
        { status: 409 }
      );
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, cid))
      .limit(1);

    if (!challenge || challenge.type !== "quiz") {
      return NextResponse.json(
        { error: "Quiz challenge not found" },
        { status: 404 }
      );
    }

    if (challenge.deadline && new Date(challenge.deadline) < new Date()) {
      return NextResponse.json(
        { error: "Challenge deadline has passed" },
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

    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctIndex) {
        score++;
      }
    }

    const total = questions.length;
    const passed = score === total; // Must get all correct to pass

    // Save attempt
    await db.insert(quizAttempts).values({
      studentId: student.id,
      challengeId: cid,
      answers: JSON.stringify(answers),
      score,
      total,
      passed,
    });

    // If passed, update progress
    if (passed) {
      let earnedPoints = challenge.pointsReward;
      if (challenge.decayEnabled) {
        const elapsed = Math.floor(
          (Date.now() - new Date(challenge.createdAt).getTime()) / 1000
        );
        earnedPoints = Math.max(0, challenge.decayStartPoints - elapsed);
      }

      await db
        .insert(studentChallengeProgress)
        .values({
          studentId: student.id,
          challengeId: cid,
          completed: true,
          pointsEarned: earnedPoints,
          badgeEarned: !!challenge.badgeName,
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
            badgeEarned: sql`${!!challenge.badgeName}`,
            completedAt: sql`now()`,
          },
        });
    }

    return NextResponse.json({ score, total, passed });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
