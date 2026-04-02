import { db } from "@/lib/db";
import {
  students,
  attendance,
  studentChallengeProgress,
  manualPointsLog,
} from "@/lib/db/schema";
import { asc, sql, gte, and, eq } from "drizzle-orm";
import LeaderboardClient from "./client";

export const revalidate = 60;

export const metadata = {
  title: "Leaderboard - QuestLog",
  description: "See who's leading the attendance race!",
  openGraph: {
    title: "Leaderboard - QuestLog",
    description: "See who's leading the attendance race!",
  },
  twitter: {
    title: "Leaderboard - QuestLog",
    description: "See who's leading the attendance race!",
  },
};

function getStartOfWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const start = new Date(now);
  start.setDate(now.getDate() - daysSinceMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

export default async function LeaderboardPage() {
  const startOfWeek = getStartOfWeek();

  // Get the max session number across all attendance records
  const [maxSessionResult] = await db
    .select({ maxSession: sql<number>`coalesce(max(${attendance.sessionNumber}), 0)` })
    .from(attendance);
  const totalSessionCount = Number(maxSessionResult?.maxSession) || 0;

  const allStudents = await db
    .select()
    .from(students)
    .orderBy(asc(students.name));

  const attendanceCounts = await db
    .select({
      studentId: attendance.studentId,
      presentCount: sql<number>`count(*) filter (where ${attendance.status} = 'present')`.as("present_count"),
      totalSessions: sql<number>`count(*)`.as("total_sessions"),
    })
    .from(attendance)
    .groupBy(attendance.studentId);

  const attendanceMap = new Map(
    attendanceCounts.map((a) => [a.studentId, { present: Number(a.presentCount), total: Number(a.totalSessions) }])
  );

  const challengePoints = await db
    .select({
      studentId: studentChallengeProgress.studentId,
      totalPoints: sql<number>`coalesce(sum(${studentChallengeProgress.pointsEarned}) filter (where ${studentChallengeProgress.completed} = true), 0)`.as("total_points"),
      completedCount: sql<number>`count(*) filter (where ${studentChallengeProgress.completed} = true)`.as("completed_count"),
      badgeCount: sql<number>`count(*) filter (where ${studentChallengeProgress.badgeEarned} = true and ${studentChallengeProgress.completed} = true)`.as("badge_count"),
    })
    .from(studentChallengeProgress)
    .groupBy(studentChallengeProgress.studentId);

  const pointsMap = new Map(
    challengePoints.map((p) => [p.studentId, { points: Number(p.totalPoints), completed: Number(p.completedCount), badges: Number(p.badgeCount) }])
  );

  const allAttendance = await db
    .select({ studentId: attendance.studentId, sessionNumber: attendance.sessionNumber, status: attendance.status })
    .from(attendance)
    .orderBy(asc(attendance.studentId), asc(attendance.sessionNumber));

  const streakMap = new Map<number, number>();
  let currentStudentId = -1;
  let currentStreak = 0;
  let maxStreak = 0;
  for (const rec of allAttendance) {
    if (rec.studentId !== currentStudentId) {
      if (currentStudentId !== -1) streakMap.set(currentStudentId, Math.max(maxStreak, currentStreak));
      currentStudentId = rec.studentId;
      currentStreak = 0;
      maxStreak = 0;
    }
    if (rec.status === "present") { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
    else { currentStreak = 0; }
  }
  if (currentStudentId !== -1) streakMap.set(currentStudentId, Math.max(maxStreak, currentStreak));

  // ─── Weekly gains ───
  const weeklyAttendance = await db
    .select({
      studentId: attendance.studentId,
      count: sql<number>`count(*)`.as("count"),
    })
    .from(attendance)
    .where(and(gte(attendance.date, startOfWeek), eq(attendance.status, "present")))
    .groupBy(attendance.studentId);

  const weeklyAttMap = new Map(weeklyAttendance.map((a) => [a.studentId, Number(a.count) * 10]));

  const weeklyChallenges = await db
    .select({
      studentId: studentChallengeProgress.studentId,
      points: sql<number>`coalesce(sum(${studentChallengeProgress.pointsEarned}), 0)`.as("points"),
    })
    .from(studentChallengeProgress)
    .where(and(
      gte(studentChallengeProgress.completedAt, startOfWeek),
      eq(studentChallengeProgress.completed, true)
    ))
    .groupBy(studentChallengeProgress.studentId);

  const weeklyChalMap = new Map(weeklyChallenges.map((c) => [c.studentId, Number(c.points)]));

  const weeklyManual = await db
    .select({
      studentId: manualPointsLog.studentId,
      points: sql<number>`coalesce(sum(${manualPointsLog.points}), 0)`.as("points"),
    })
    .from(manualPointsLog)
    .where(gte(manualPointsLog.createdAt, startOfWeek))
    .groupBy(manualPointsLog.studentId);

  const weeklyManualMap = new Map(weeklyManual.map((m) => [m.studentId, Number(m.points)]));

  const leaderboard = allStudents
    .map((s) => {
      const att = attendanceMap.get(s.id) || { present: 0, total: 0 };
      const pts = pointsMap.get(s.id) || { points: 0, completed: 0, badges: 0 };
      const streak = streakMap.get(s.id) || 0;
      const manualPts = s.manualPoints ?? 0;
      const score = att.present * 10 + pts.points + manualPts;
      const weeklyGain = (weeklyAttMap.get(s.id) || 0) + (weeklyChalMap.get(s.id) || 0) + (weeklyManualMap.get(s.id) || 0);
      return {
        id: s.id, name: s.name, slug: s.slug, avatarUrl: s.avatarUrl,
        sessionsPresent: att.present, totalSessions: att.total,
        challengePoints: pts.points, challengesCompleted: pts.completed,
        manualPoints: manualPts, badges: pts.badges,
        streak, score, weeklyGain, rank: 0,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.sessionsPresent !== a.sessionsPresent) return b.sessionsPresent - a.sessionsPresent;
      return a.name.localeCompare(b.name);
    })
    .map((entry, i) => ({ ...entry, rank: i + 1 }));

  return <LeaderboardClient entries={leaderboard} totalSessions={totalSessionCount} />;
}
