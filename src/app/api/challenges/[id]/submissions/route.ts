import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskSubmissions, students } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const challengeId = parseInt(id, 10);

    const submissions = await db
      .select({
        id: taskSubmissions.id,
        studentId: taskSubmissions.studentId,
        studentName: students.name,
        challengeId: taskSubmissions.challengeId,
        submissionText: taskSubmissions.submissionText,
        status: taskSubmissions.status,
        grade: taskSubmissions.grade,
        adminNotes: taskSubmissions.adminNotes,
        pointsSnapshot: taskSubmissions.pointsSnapshot,
        submittedAt: taskSubmissions.submittedAt,
        reviewedAt: taskSubmissions.reviewedAt,
      })
      .from(taskSubmissions)
      .innerJoin(students, eq(taskSubmissions.studentId, students.id))
      .where(eq(taskSubmissions.challengeId, challengeId))
      .orderBy(desc(taskSubmissions.submittedAt));

    return NextResponse.json(submissions);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
