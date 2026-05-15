import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  students,
  attendance,
  challenges,
  studentChallengeProgress,
  quizAttempts,
  studentDuels,
  manualPointsLog,
} from "@/lib/db/schema";
import { eq, and, or, inArray } from "drizzle-orm";

interface Params {
  params: Promise<{ slug: string }>;
}

function csvCell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function safeFilename(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9_-]/g, "-");
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { slug } = await params;

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.slug, slug))
    .limit(1);

  if (!student) {
    return new NextResponse("Student not found", { status: 404 });
  }

  const presentAttendance = await db
    .select({
      date: attendance.date,
      sessionNumber: attendance.sessionNumber,
    })
    .from(attendance)
    .where(
      and(
        eq(attendance.studentId, student.id),
        eq(attendance.status, "present")
      )
    );

  const completedChallenges = await db
    .select({
      challengeId: challenges.id,
      completedAt: studentChallengeProgress.completedAt,
      pointsEarned: studentChallengeProgress.pointsEarned,
      badgeEarned: studentChallengeProgress.badgeEarned,
      title: challenges.title,
      type: challenges.type,
      session: challenges.anchorSession,
      pointsReward: challenges.pointsReward,
      badgeEmoji: challenges.badgeEmoji,
      badgeName: challenges.badgeName,
    })
    .from(studentChallengeProgress)
    .innerJoin(
      challenges,
      eq(challenges.id, studentChallengeProgress.challengeId)
    )
    .where(
      and(
        eq(studentChallengeProgress.studentId, student.id),
        eq(studentChallengeProgress.completed, true)
      )
    );

  const attempts = await db
    .select({
      challengeId: quizAttempts.challengeId,
      score: quizAttempts.score,
      total: quizAttempts.total,
      passed: quizAttempts.passed,
    })
    .from(quizAttempts)
    .where(eq(quizAttempts.studentId, student.id));

  const attemptByChallenge = new Map<
    number,
    { score: number; total: number; passed: boolean }
  >();
  for (const a of attempts) {
    attemptByChallenge.set(a.challengeId, {
      score: a.score,
      total: a.total,
      passed: a.passed,
    });
  }

  const duels = await db
    .select({
      challengerId: studentDuels.challengerId,
      opponentId: studentDuels.opponentId,
      wagerAmount: studentDuels.wagerAmount,
      winnerId: studentDuels.winnerId,
      actualPointsTransferred: studentDuels.actualPointsTransferred,
      resolvedAt: studentDuels.resolvedAt,
      title: challenges.title,
    })
    .from(studentDuels)
    .innerJoin(challenges, eq(challenges.id, studentDuels.challengeId))
    .where(
      and(
        or(
          eq(studentDuels.challengerId, student.id),
          eq(studentDuels.opponentId, student.id)
        ),
        eq(studentDuels.status, "resolved")
      )
    );

  // Resolve opponent names in one go.
  const opponentIds = Array.from(
    new Set(
      duels.map((d) =>
        d.challengerId === student.id ? d.opponentId : d.challengerId
      )
    )
  );
  const opponents =
    opponentIds.length > 0
      ? await db
          .select({ id: students.id, name: students.name })
          .from(students)
          .where(inArray(students.id, opponentIds))
      : [];
  const opponentNameById = new Map(opponents.map((o) => [o.id, o.name]));

  const manual = await db
    .select({
      createdAt: manualPointsLog.createdAt,
      points: manualPointsLog.points,
      reason: manualPointsLog.reason,
    })
    .from(manualPointsLog)
    .where(eq(manualPointsLog.studentId, student.id));

  type Row = {
    date: string;
    category: string;
    item: string;
    detail: string;
    points: number;
  };
  const rows: Row[] = [];

  for (const a of presentAttendance) {
    rows.push({
      date: a.date.toISOString(),
      category: "Attendance",
      item: `Session ${a.sessionNumber}`,
      detail: "Present",
      points: 10,
    });
  }

  for (const p of completedChallenges) {
    const detailParts: string[] = [p.type];
    const attempt = attemptByChallenge.get(p.challengeId);
    if (attempt) detailParts.push(`${attempt.score}/${attempt.total}`);
    if (p.pointsReward > 0)
      detailParts.push(`out of ${p.pointsReward} possible`);
    if (p.badgeEarned && p.badgeEmoji && p.badgeName)
      detailParts.push(`${p.badgeEmoji} ${p.badgeName}`);
    detailParts.push(`session ${p.session}`);

    rows.push({
      date: p.completedAt ? p.completedAt.toISOString() : "",
      category: "Challenge",
      item: p.title,
      detail: detailParts.join(" · "),
      points: p.pointsEarned,
    });
  }

  for (const d of duels) {
    const opponentId =
      d.challengerId === student.id ? d.opponentId : d.challengerId;
    const opponent = opponentNameById.get(opponentId) ?? "opponent";
    const won = d.winnerId === student.id;
    const amount = d.actualPointsTransferred ?? d.wagerAmount;
    rows.push({
      date: d.resolvedAt ? d.resolvedAt.toISOString() : "",
      category: "Duel",
      item: `${d.title} vs ${opponent}`,
      detail: won ? "Won" : "Lost",
      points: won ? amount : -amount,
    });
  }

  for (const m of manual) {
    rows.push({
      date: m.createdAt.toISOString(),
      category: "Manual",
      item: m.reason || "Admin adjustment",
      detail: m.points >= 0 ? "Added" : "Deducted",
      points: m.points,
    });
  }

  rows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const totalAttendance = presentAttendance.length * 10;
  const totalChallenges = completedChallenges.reduce(
    (s, p) => s + p.pointsEarned,
    0
  );
  const totalDuels = duels.reduce((s, d) => {
    const won = d.winnerId === student.id;
    const amount = d.actualPointsTransferred ?? d.wagerAmount;
    return s + (won ? amount : -amount);
  }, 0);
  const totalManual = student.manualPoints ?? 0;
  const grand = totalAttendance + totalChallenges + totalDuels + totalManual;

  const lines: string[] = [];
  lines.push(`# Point log for ${student.name}`);
  lines.push(`# Generated ${new Date().toISOString()}`);
  lines.push("");
  lines.push("# Summary");
  lines.push("Category,Points");
  lines.push(`Attendance (${presentAttendance.length} sessions),${totalAttendance}`);
  lines.push(`Challenges (${completedChallenges.length} completed),${totalChallenges}`);
  lines.push(`Duels (${duels.length} resolved),${totalDuels}`);
  lines.push(`Manual adjustments,${totalManual}`);
  lines.push(`TOTAL,${grand}`);
  lines.push("");
  lines.push("# Detailed log");
  lines.push("date,category,item,detail,points");
  for (const r of rows) {
    lines.push(
      [r.date, r.category, r.item, r.detail, r.points].map(csvCell).join(",")
    );
  }

  const csv = lines.join("\n") + "\n";
  const filename = `${safeFilename(student.slug)}-point-log.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
