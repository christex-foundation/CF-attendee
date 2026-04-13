import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  students,
  challenges,
  studentChallengeProgress,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

interface Params {
  params: Promise<{ slug: string; challengeId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  void request;
  try {
    const { slug, challengeId } = await params;
    const cid = parseInt(challengeId, 10);

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
        { error: "Already checked in" },
        { status: 409 }
      );
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, cid))
      .limit(1);

    if (!challenge || challenge.type !== "checkin") {
      return NextResponse.json(
        { error: "Check-in challenge not found" },
        { status: 404 }
      );
    }

    if (!challenge.checkinActivatedAt) {
      return NextResponse.json(
        { error: "Check-in has not been scheduled yet" },
        { status: 403 }
      );
    }

    const now = new Date();
    if (now < challenge.checkinActivatedAt) {
      return NextResponse.json(
        { error: "Check-in window has not opened yet" },
        { status: 403 }
      );
    }

    const windowEnd = new Date(
      challenge.checkinActivatedAt.getTime() +
        (challenge.checkinWindowSeconds ?? 300) * 1000
    );

    if (now > windowEnd) {
      return NextResponse.json(
        { error: "Check-in window has closed" },
        { status: 403 }
      );
    }

    const earnedPoints = challenge.pointsReward;
    const badgeEarned = !!challenge.badgeName;

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

    return NextResponse.json({ success: true, pointsEarned: earnedPoints });
  } catch {
    return NextResponse.json(
      { error: "Failed to check in" },
      { status: 500 }
    );
  }
}
