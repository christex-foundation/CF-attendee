import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  students,
  challenges,
  taskSubmissions,
  studentChallengeProgress,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

interface Params {
  params: Promise<{ slug: string; challengeId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { slug, challengeId } = await params;
    const cid = parseInt(challengeId, 10);
    const body = await request.json();
    const { submissionText } = body as { submissionText: string };

    if (!submissionText?.trim()) {
      return NextResponse.json({ error: "Submission text is required" }, { status: 400 });
    }

    const [student] = await db.select().from(students).where(eq(students.slug, slug)).limit(1);
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, cid)).limit(1);
    if (!challenge || challenge.type !== "bounty") {
      return NextResponse.json({ error: "Bounty challenge not found" }, { status: 404 });
    }

    if (challenge.deadline && new Date(challenge.deadline) < new Date()) {
      return NextResponse.json({ error: "Deadline has passed" }, { status: 403 });
    }

    // Check if bounty is already claimed (any approved submission)
    const [claimed] = await db
      .select()
      .from(taskSubmissions)
      .where(
        and(
          eq(taskSubmissions.challengeId, cid),
          eq(taskSubmissions.status, "approved")
        )
      )
      .limit(1);

    if (claimed) {
      return NextResponse.json({ error: "Bounty has already been claimed" }, { status: 409 });
    }

    // Check if student already submitted
    const [existing] = await db
      .select()
      .from(taskSubmissions)
      .where(
        and(
          eq(taskSubmissions.studentId, student.id),
          eq(taskSubmissions.challengeId, cid)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "You already submitted for this bounty" }, { status: 409 });
    }

    await db.insert(taskSubmissions).values({
      studentId: student.id,
      challengeId: cid,
      submissionText: submissionText.trim(),
      status: "pending",
      pointsSnapshot: challenge.pointsReward,
    });

    // Mark as completed (frozen) with 0 points until admin reviews
    await db
      .insert(studentChallengeProgress)
      .values({
        studentId: student.id,
        challengeId: cid,
        completed: true,
        pointsEarned: 0,
        badgeEarned: false,
        completedAt: sql`now()`,
      })
      .onConflictDoUpdate({
        target: [studentChallengeProgress.studentId, studentChallengeProgress.challengeId],
        set: {
          completed: sql`true`,
          pointsEarned: sql`0`,
          completedAt: sql`now()`,
        },
      });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit bounty" }, { status: 500 });
  }
}
