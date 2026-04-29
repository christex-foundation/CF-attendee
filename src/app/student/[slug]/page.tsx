import { db } from "@/lib/db";
import {
  students,
  attendance,
  challenges,
  studentChallengeProgress,
  taskSubmissions,
} from "@/lib/db/schema";
import { eq, asc, and, max, sql, inArray } from "drizzle-orm";
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

  // Any existing task submission (pending/approved/rejected) means the
  // challenge has been used up for this student — treat it as completed
  // even if no progress row was written (historical data or race).
  const taskSubs = await db
    .select()
    .from(taskSubmissions)
    .where(eq(taskSubmissions.studentId, student.id));
  const submittedChallengeIds = new Set(taskSubs.map((t) => t.challengeId));
  const taskSubMap = new Map(taskSubs.map((t) => [t.challengeId, { status: t.status, grade: t.grade }]));

  // Calculate streaks (read-only)
  let currentStreak = 0;
  for (const record of records) {
    if (record.status === "present") {
      currentStreak++;
    } else {
      currentStreak = 0;
    }
  }

  // Compute speedrun slots remaining
  const slotsMap = new Map<number, number>();
  for (const c of activeChallenges) {
    if (c.type === "speedrun") {
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(studentChallengeProgress)
        .where(
          and(
            eq(studentChallengeProgress.challengeId, c.id),
            eq(studentChallengeProgress.completed, true),
            sql`${studentChallengeProgress.pointsEarned} > 0`
          )
        );
      slotsMap.set(c.id, Math.max(0, (c.speedSlots ?? 1) - Number(countResult?.count ?? 0)));
    }
  }

  // Bounties that already have an approved (winning) submission — frozen for everyone.
  const bountyIds = activeChallenges.filter((c) => c.type === "bounty").map((c) => c.id);
  const claimedBountyIds = bountyIds.length
    ? new Set(
        (
          await db
            .select({ challengeId: taskSubmissions.challengeId })
            .from(taskSubmissions)
            .where(
              and(
                inArray(taskSubmissions.challengeId, bountyIds),
                eq(taskSubmissions.status, "approved")
              )
            )
        ).map((r) => r.challengeId)
      )
    : new Set<number>();

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
      speedSlots: c.speedSlots ?? null,
      checkinWindowSeconds: c.checkinWindowSeconds ?? null,
      checkinActivatedAt: c.checkinActivatedAt?.toISOString() ?? null,
      wagerMin: c.wagerMin ?? null,
      wagerMax: c.wagerMax ?? null,
      chainRequired: c.chainRequired ?? null,
      deadline: c.deadline?.toISOString() ?? null,
      decayEnabled: c.decayEnabled,
      decayStartPoints: c.decayStartPoints,
      decayPointsPerInterval: c.decayPointsPerInterval,
      decayIntervalSeconds: c.decayIntervalSeconds,
      createdAt: c.createdAt.toISOString(),
    },
    progress: (() => {
      const p = progressMap.get(c.id);
      if (p) {
        return {
          id: p.id,
          studentId: p.studentId,
          challengeId: p.challengeId,
          completed: p.completed,
          pointsEarned: p.pointsEarned,
          badgeEarned: p.badgeEarned,
          completedAt: p.completedAt?.toISOString() ?? null,
        };
      }
      // Fallback: student has a task submission but no progress row yet.
      // Show as frozen/completed with 0 points so the UI stops treating it as open.
      if (c.type === "task" && submittedChallengeIds.has(c.id)) {
        return {
          id: -1,
          studentId: student.id,
          challengeId: c.id,
          completed: true,
          pointsEarned: 0,
          badgeEarned: false,
          completedAt: null,
        };
      }
      return null;
    })(),
    taskSubmission: (c.type === "task" || c.type === "bounty") ? (taskSubMap.get(c.id) ?? null) : null,
    anchorSession: c.anchorSession,
    ...(c.type === "speedrun" && { slotsRemaining: slotsMap.get(c.id) ?? 0 }),
    ...(c.type === "bounty" && { bountyClaimed: claimedBountyIds.has(c.id) }),
    ...(c.type === "checkin" && {
      checkinWindowOpen: c.checkinActivatedAt
        ? new Date() >= c.checkinActivatedAt && new Date() < new Date(c.checkinActivatedAt.getTime() + (c.checkinWindowSeconds ?? 300) * 1000)
        : false,
      checkinWindowClosed: c.checkinActivatedAt
        ? new Date() >= new Date(c.checkinActivatedAt.getTime() + (c.checkinWindowSeconds ?? 300) * 1000)
        : false,
      checkinWindowEndsAt: c.checkinActivatedAt
        ? new Date(c.checkinActivatedAt.getTime() + (c.checkinWindowSeconds ?? 300) * 1000).toISOString()
        : undefined,
    }),
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
