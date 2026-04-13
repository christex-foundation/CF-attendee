import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  students,
  challenges,
  studentChallengeProgress,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { computeDecayedPoints } from "@/lib/decay";

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
        { error: "Already claimed" },
        { status: 409 }
      );
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, cid))
      .limit(1);

    if (!challenge || challenge.type !== "speedrun") {
      return NextResponse.json(
        { error: "Speedrun challenge not found" },
        { status: 404 }
      );
    }

    if (challenge.deadline && new Date(challenge.deadline) < new Date()) {
      return NextResponse.json(
        { error: "Challenge deadline has passed" },
        { status: 403 }
      );
    }

    const speedSlots = challenge.speedSlots ?? 1;

    // Use a transaction to prevent race conditions
    const result = await db.transaction(async (tx) => {
      // Count existing winners (completed with points > 0)
      const [countResult] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(studentChallengeProgress)
        .where(
          and(
            eq(studentChallengeProgress.challengeId, cid),
            eq(studentChallengeProgress.completed, true),
            sql`${studentChallengeProgress.pointsEarned} > 0`
          )
        );

      const currentCount = Number(countResult?.count ?? 0);
      const gotSlot = currentCount < speedSlots;

      let earnedPoints = 0;
      if (gotSlot) {
        earnedPoints = challenge.decayEnabled
          ? computeDecayedPoints(challenge)
          : challenge.pointsReward;
      }
      const badgeEarned = gotSlot && !!challenge.badgeName;

      await tx
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

      return { position: currentCount + 1, gotFullPoints: gotSlot, pointsEarned: earnedPoints };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to claim speedrun" },
      { status: 500 }
    );
  }
}
