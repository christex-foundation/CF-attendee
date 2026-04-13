import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  taskSubmissions,
  studentChallengeProgress,
  challenges,
} from "@/lib/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";

const VALID_GRADES = [100, 80, 70, 60, 50, 0];

interface Params {
  params: Promise<{ id: string; subId: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { subId } = await params;
    const submissionId = parseInt(subId, 10);
    const body = await request.json();
    const { grade, adminNotes } = body;

    if (typeof grade !== "number" || !VALID_GRADES.includes(grade)) {
      return NextResponse.json(
        { error: "grade must be one of: 100, 80, 70, 60, 50, 0" },
        { status: 400 }
      );
    }

    // Guard against double-grading — once reviewed, stay reviewed.
    const [existing] = await db
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.id, submissionId))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (existing.status !== "pending") {
      return NextResponse.json(
        { error: `Submission already ${existing.status}` },
        { status: 409 }
      );
    }

    const status = grade >= 50 ? "approved" : "rejected";

    const [updated] = await db
      .update(taskSubmissions)
      .set({
        status,
        grade,
        adminNotes: adminNotes || null,
        reviewedAt: sql`now()`,
      })
      .where(eq(taskSubmissions.id, submissionId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // Update student challenge progress with graded points
    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, updated.challengeId))
      .limit(1);

    if (challenge) {
      const basePoints = updated.pointsSnapshot ?? challenge.pointsReward;
      const pts = grade >= 50 ? Math.round((grade / 100) * basePoints) : 0;
      const badgeEarned = grade >= 50 && !!challenge.badgeName;

      await db
        .insert(studentChallengeProgress)
        .values({
          studentId: updated.studentId,
          challengeId: updated.challengeId,
          completed: true,
          pointsEarned: pts,
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
            pointsEarned: sql`${pts}`,
            badgeEarned: sql`${badgeEarned}`,
            completedAt: sql`now()`,
          },
        });
    }

    // For bounties: if approved, auto-reject all other pending submissions
    if (challenge && challenge.type === "bounty" && status === "approved") {
      const pendingOthers = await db
        .select()
        .from(taskSubmissions)
        .where(
          and(
            eq(taskSubmissions.challengeId, updated.challengeId),
            eq(taskSubmissions.status, "pending"),
            ne(taskSubmissions.id, submissionId)
          )
        );

      for (const other of pendingOthers) {
        await db
          .update(taskSubmissions)
          .set({ status: "rejected", grade: 0, reviewedAt: sql`now()` })
          .where(eq(taskSubmissions.id, other.id));

        await db
          .update(studentChallengeProgress)
          .set({ completed: sql`true`, pointsEarned: sql`0` })
          .where(
            and(
              eq(studentChallengeProgress.studentId, other.studentId),
              eq(studentChallengeProgress.challengeId, updated.challengeId)
            )
          );
      }
    }

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}
