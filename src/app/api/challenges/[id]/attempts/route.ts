import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  quizAttempts,
  quizQuestions,
  students,
  studentChallengeProgress,
} from "@/lib/db/schema";
import { eq, desc, asc, and } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const challengeId = parseInt(id, 10);

    // Get quiz questions for this challenge (to show correct answers)
    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.challengeId, challengeId))
      .orderBy(asc(quizQuestions.orderIndex));

    // Get all attempts with student names + their progress points (so wager
    // attempts can show +N / -N per row).
    const attempts = await db
      .select({
        id: quizAttempts.id,
        studentId: quizAttempts.studentId,
        studentName: students.name,
        challengeId: quizAttempts.challengeId,
        answers: quizAttempts.answers,
        score: quizAttempts.score,
        total: quizAttempts.total,
        passed: quizAttempts.passed,
        attemptedAt: quizAttempts.attemptedAt,
        pointsEarned: studentChallengeProgress.pointsEarned,
      })
      .from(quizAttempts)
      .innerJoin(students, eq(quizAttempts.studentId, students.id))
      .leftJoin(
        studentChallengeProgress,
        and(
          eq(studentChallengeProgress.studentId, quizAttempts.studentId),
          eq(studentChallengeProgress.challengeId, quizAttempts.challengeId)
        )
      )
      .where(eq(quizAttempts.challengeId, challengeId))
      .orderBy(desc(quizAttempts.attemptedAt));

    // Parse JSON fields
    const parsedQuestions = questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      options: JSON.parse(q.options) as string[],
      correctIndex: q.correctIndex,
      orderIndex: q.orderIndex,
    }));

    const parsedAttempts = attempts.map((a) => ({
      ...a,
      answers: JSON.parse(a.answers) as number[],
    }));

    return NextResponse.json({ questions: parsedQuestions, attempts: parsedAttempts });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch attempts" },
      { status: 500 }
    );
  }
}
