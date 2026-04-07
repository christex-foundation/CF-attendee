import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { students, challenges, taskSubmissions, studentChallengeProgress } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface Params {
  params: Promise<{ slug: string; challengeId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { slug, challengeId } = await params;
    const cid = parseInt(challengeId, 10);
    const body = await request.json();
    const { submissionText } = body;

    if (!submissionText || typeof submissionText !== "string" || !submissionText.trim()) {
      return NextResponse.json(
        { error: "submissionText is required" },
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

    // Prevent re-submission after completion
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

    // Prevent duplicate submissions
    const [existingSub] = await db
      .select()
      .from(taskSubmissions)
      .where(
        and(
          eq(taskSubmissions.studentId, student.id),
          eq(taskSubmissions.challengeId, cid)
        )
      )
      .limit(1);

    if (existingSub) {
      return NextResponse.json(
        { error: "Task already submitted" },
        { status: 409 }
      );
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, cid))
      .limit(1);

    if (!challenge || challenge.type !== "task") {
      return NextResponse.json(
        { error: "Task challenge not found" },
        { status: 404 }
      );
    }

    if (challenge.deadline && new Date(challenge.deadline) < new Date()) {
      return NextResponse.json(
        { error: "Challenge deadline has passed" },
        { status: 403 }
      );
    }

    // Calculate decay points snapshot
    let pointsSnapshot = challenge.pointsReward;
    if (challenge.decayEnabled) {
      const elapsedSec = Math.floor(
        (Date.now() - new Date(challenge.createdAt).getTime()) / 1000
      );
      const intervals = Math.floor(elapsedSec / 600); // 10-minute windows
      const lost = intervals * challenge.decayPointsPerInterval;
      pointsSnapshot = Math.max(0, challenge.decayStartPoints - lost);
    }

    const [submission] = await db
      .insert(taskSubmissions)
      .values({
        studentId: student.id,
        challengeId: cid,
        submissionText: submissionText.trim(),
        pointsSnapshot,
      })
      .returning();

    return NextResponse.json(submission, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit task" },
      { status: 500 }
    );
  }
}
