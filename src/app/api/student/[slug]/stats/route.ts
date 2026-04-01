import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  students,
  studentChallengeProgress,
  challenges,
  attendance,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.slug, slug))
      .limit(1);

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const records = await db
      .select()
      .from(attendance)
      .where(eq(attendance.studentId, student.id));

    const presentCount = records.filter((r) => r.status === "present").length;
    const attendancePoints = presentCount * 10;

    const progress = await db
      .select()
      .from(studentChallengeProgress)
      .where(eq(studentChallengeProgress.studentId, student.id));

    const challengePoints = progress.filter((p) => p.completed).reduce((sum, p) => sum + p.pointsEarned, 0);
    const totalPoints = attendancePoints + challengePoints + (student.manualPoints ?? 0);
    const badges = progress
      .filter((p) => p.badgeEarned && p.completed)
      .map((p) => p.challengeId);

    // Get badge details in a single query
    const badgeDetails: { emoji: string; name: string }[] = badges.length > 0
      ? (await db
          .select({ badgeEmoji: challenges.badgeEmoji, badgeName: challenges.badgeName })
          .from(challenges)
          .where(inArray(challenges.id, badges)))
          .filter((c): c is { badgeEmoji: string; badgeName: string } => !!(c.badgeEmoji && c.badgeName))
          .map((c) => ({ emoji: c.badgeEmoji, name: c.badgeName }))
      : [];

    return NextResponse.json({
      totalPoints,
      badgeCount: badgeDetails.length,
      badges: badgeDetails,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
