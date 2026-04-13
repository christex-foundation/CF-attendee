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
import { getStudentScore } from "@/lib/student-score";

interface Params {
  params: Promise<{ slug: string; challengeId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { slug, challengeId } = await params;
    const cid = parseInt(challengeId, 10);

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, cid))
      .limit(1);

    if (!challenge || challenge.type !== "wager") {
      return NextResponse.json({ error: "Wager challenge not found" }, { status: 404 });
    }

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

    // Get student's current score for max wager cap
    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.slug, slug))
      .limit(1);

    const currentScore = student ? await getStudentScore(student.id) : 0;

    return NextResponse.json({
      questions: parsed,
      wagerMin: challenge.wagerMin ?? 5,
      wagerMax: Math.min(challenge.wagerMax ?? 50, Math.max(0, currentScore)),
      currentScore,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch wager" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { slug, challengeId } = await params;
    const cid = parseInt(challengeId, 10);
    const body = await request.json();
    const { answers, wagerAmount } = body as { answers: number[]; wagerAmount: number };

    if (!Array.isArray(answers) || typeof wagerAmount !== "number") {
      return NextResponse.json({ error: "answers and wagerAmount required" }, { status: 400 });
    }

    const [student] = await db.select().from(students).where(eq(students.slug, slug)).limit(1);
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

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
      return NextResponse.json({ error: "Wager already placed" }, { status: 409 });
    }

    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, cid)).limit(1);
    if (!challenge || challenge.type !== "wager") {
      return NextResponse.json({ error: "Wager challenge not found" }, { status: 404 });
    }

    if (challenge.deadline && new Date(challenge.deadline) < new Date()) {
      return NextResponse.json({ error: "Deadline has passed" }, { status: 403 });
    }

    // Validate wager amount
    const currentScore = await getStudentScore(student.id);
    const minWager = challenge.wagerMin ?? 5;
    const maxWager = Math.min(challenge.wagerMax ?? 50, Math.max(0, currentScore));

    if (wagerAmount < minWager || wagerAmount > maxWager) {
      return NextResponse.json(
        { error: `Wager must be between ${minWager} and ${maxWager}` },
        { status: 400 }
      );
    }

    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.challengeId, cid))
      .orderBy(asc(quizQuestions.orderIndex));

    if (answers.length !== questions.length) {
      return NextResponse.json(
        { error: `Expected ${questions.length} answers` },
        { status: 400 }
      );
    }

    let score = 0;
    for (let i = 0; i < questions.length; i++) {
      if (answers[i] === questions[i].correctIndex) score++;
    }

    const total = questions.length;
    const passed = score === total;

    await db.insert(quizAttempts).values({
      studentId: student.id,
      challengeId: cid,
      answers: JSON.stringify(answers),
      score,
      total,
      passed,
    });

    // Won: +wagerAmount, Lost: -wagerAmount
    const earnedPoints = passed ? wagerAmount : -wagerAmount;
    const badgeEarned = passed && !!challenge.badgeName;

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
        target: [studentChallengeProgress.studentId, studentChallengeProgress.challengeId],
        set: {
          completed: sql`true`,
          pointsEarned: sql`${earnedPoints}`,
          badgeEarned: sql`${badgeEarned}`,
          completedAt: sql`now()`,
        },
      });

    return NextResponse.json({ score, total, passed, pointsEarned: earnedPoints, wagerAmount });
  } catch {
    return NextResponse.json({ error: "Failed to submit wager" }, { status: 500 });
  }
}
