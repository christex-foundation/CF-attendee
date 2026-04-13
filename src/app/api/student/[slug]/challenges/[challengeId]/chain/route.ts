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

    const [student] = await db.select().from(students).where(eq(students.slug, slug)).limit(1);
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    // Check if already joined
    const [existing] = await db
      .select()
      .from(studentChallengeProgress)
      .where(
        and(
          eq(studentChallengeProgress.studentId, student.id),
          eq(studentChallengeProgress.challengeId, cid)
        )
      )
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Already joined this chain" }, { status: 409 });
    }

    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, cid)).limit(1);
    if (!challenge || challenge.type !== "chain") {
      return NextResponse.json({ error: "Chain challenge not found" }, { status: 404 });
    }

    if (challenge.deadline && new Date(challenge.deadline) < new Date()) {
      return NextResponse.json({ error: "Deadline has passed" }, { status: 403 });
    }

    const chainRequired = challenge.chainRequired ?? 2;

    // Use a transaction: insert the new link, then check if chain is complete
    const result = await db.transaction(async (tx) => {
      // Insert this student's link (not yet completed, 0 points)
      await tx.insert(studentChallengeProgress).values({
        studentId: student.id,
        challengeId: cid,
        completed: false,
        pointsEarned: 0,
        badgeEarned: false,
      });

      // Count all links
      const [countResult] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(studentChallengeProgress)
        .where(eq(studentChallengeProgress.challengeId, cid));

      const linkCount = Number(countResult?.count ?? 0);

      if (linkCount >= chainRequired) {
        // Chain complete! Award everyone
        const points = challenge.pointsReward;
        const badge = !!challenge.badgeName;

        await tx
          .update(studentChallengeProgress)
          .set({
            completed: true,
            pointsEarned: points,
            badgeEarned: badge,
            completedAt: sql`now()`,
          })
          .where(eq(studentChallengeProgress.challengeId, cid));

        return { linkNumber: linkCount, chainComplete: true, pointsEarned: points };
      }

      return { linkNumber: linkCount, chainComplete: false, pointsEarned: 0 };
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to join chain" }, { status: 500 });
  }
}
