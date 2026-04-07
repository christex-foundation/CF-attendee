import { db } from "@/lib/db";
import {
  students,
  attendance,
  challenges,
  studentChallengeProgress,
} from "@/lib/db/schema";
import { eq, asc, max } from "drizzle-orm";
import { notFound } from "next/navigation";
import StudentMapClient from "./client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.slug, slug))
    .limit(1);

  if (!student) {
    return { title: "Student Not Found" };
  }

  return {
    title: `${student.name} - Attendance Map`,
    description: `View ${student.name}'s attendance progress and achievements`,
    openGraph: {
      title: `${student.name} - QuestLog`,
      description: `View ${student.name}'s attendance progress and achievements`,
    },
  };
}

export default async function StudentPage({ params }: Props) {
  const { slug } = await params;

  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.slug, slug))
    .limit(1);

  if (!student) {
    notFound();
  }

  const records = await db
    .select()
    .from(attendance)
    .where(eq(attendance.studentId, student.id))
    .orderBy(asc(attendance.sessionNumber));

  const [maxResult] = await db
    .select({ maxSession: max(attendance.sessionNumber) })
    .from(attendance);

  // Fetch active challenges
  const activeChallenges = await db
    .select()
    .from(challenges)
    .where(eq(challenges.status, "active"))
    .orderBy(asc(challenges.anchorSession));

  const maxChallengeAnchor = activeChallenges.reduce((m, c) => Math.max(m, c.anchorSession), 0);
  const totalSessions = Math.max(maxResult?.maxSession ?? 0, records.length, maxChallengeAnchor, 1);

  const recordMap = new Map(records.map((r) => [r.sessionNumber, r]));
  const sessions = Array.from({ length: totalSessions }, (_, i) => {
    const sessionNumber = i + 1;
    const record = recordMap.get(sessionNumber);
    const status = (record?.status ?? "locked") as "present" | "absent" | "locked";
    const date = record?.date ? record.date.toISOString() : null;
    return { sessionNumber, status, date };
  });

  // Fetch student progress
  const progress = await db
    .select()
    .from(studentChallengeProgress)
    .where(eq(studentChallengeProgress.studentId, student.id));

  const progressMap = new Map(progress.map((p) => [p.challengeId, p]));

  // Calculate streaks (read-only)
  let currentStreak = 0;
  for (const record of records) {
    if (record.status === "present") {
      currentStreak++;
    } else {
      currentStreak = 0;
    }
  }

  const sideQuests = activeChallenges.map((c) => ({
    challenge: {
      id: c.id,
      title: c.title,
      description: c.description,
      type: c.type,
      status: c.status,
      pointsReward: c.pointsReward,
      badgeEmoji: c.badgeEmoji,
      badgeName: c.badgeName,
      anchorSession: c.anchorSession,
      streakRequired: c.streakRequired,
      deadline: c.deadline?.toISOString() ?? null,
      decayEnabled: c.decayEnabled,
      decayStartPoints: c.decayStartPoints,
      decayPointsPerInterval: c.decayPointsPerInterval,
      createdAt: c.createdAt.toISOString(),
    },
    progress: progressMap.get(c.id)
      ? {
          id: progressMap.get(c.id)!.id,
          studentId: progressMap.get(c.id)!.studentId,
          challengeId: progressMap.get(c.id)!.challengeId,
          completed: progressMap.get(c.id)!.completed,
          pointsEarned: progressMap.get(c.id)!.pointsEarned,
          badgeEarned: progressMap.get(c.id)!.badgeEarned,
          completedAt: progressMap.get(c.id)!.completedAt?.toISOString() ?? null,
        }
      : null,
    anchorSession: c.anchorSession,
  }));

  // Compute stats — include attendance points (10 per present session) to match leaderboard
  const presentCount = records.filter((r) => r.status === "present").length;
  const attendancePoints = presentCount * 10;
  const challengePoints = progress.filter((p) => p.completed).reduce((sum, p) => sum + p.pointsEarned, 0);
  const totalPoints = attendancePoints + challengePoints + (student.manualPoints ?? 0);
  const badges: { emoji: string; name: string }[] = [];
  for (const p of progress) {
    if (p.badgeEarned && p.completed) {
      const c = activeChallenges.find((ch) => ch.id === p.challengeId);
      if (c?.badgeEmoji && c?.badgeName) {
        badges.push({ emoji: c.badgeEmoji, name: c.badgeName });
      }
    }
  }

  return (
    <StudentMapClient
      studentName={student.name}
      studentSlug={slug}
      studentAvatarUrl={student.avatarUrl}
      sessions={sessions}
      sideQuests={sideQuests}
      stats={{ totalPoints, badgeCount: badges.length, badges }}
      currentStreak={currentStreak}
    />
  );
}
