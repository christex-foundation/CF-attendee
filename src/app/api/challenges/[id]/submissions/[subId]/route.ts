import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  taskSubmissions,
  studentChallengeProgress,
  challenges,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string; subId: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { subId } = await params;
    const submissionId = parseInt(subId, 10);
    const body = await request.json();
    const { status, adminNotes } = body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(taskSubmissions)
      .set({
        status,
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

    // If approved, update student challenge progress
    if (status === "approved") {
      const [challenge] = await db
        .select()
        .from(challenges)
        .where(eq(challenges.id, updated.challengeId))
        .limit(1);

      if (challenge) {
        const pts = updated.pointsSnapshot ?? challenge.pointsReward;
        await db
          .insert(studentChallengeProgress)
          .values({
            studentId: updated.studentId,
            challengeId: updated.challengeId,
            completed: true,
            pointsEarned: pts,
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
              pointsEarned: sql`${pts}`,
              badgeEarned: sql`${!!challenge.badgeName}`,
              completedAt: sql`now()`,
            },
          });
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
