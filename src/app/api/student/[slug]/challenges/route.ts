import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  students,
  challenges,
  studentChallengeProgress,
  attendance,
  taskSubmissions,
  auctionBids,
} from "@/lib/db/schema";
import { eq, and, asc, desc, sql } from "drizzle-orm";

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

    // Fetch active challenges
    const activeChallenges = await db
      .select()
      .from(challenges)
      .where(eq(challenges.status, "active"))
      .orderBy(asc(challenges.anchorSession));

    // Fetch student progress
    const progress = await db
      .select()
      .from(studentChallengeProgress)
      .where(eq(studentChallengeProgress.studentId, student.id));

    const progressMap = new Map(
      progress.map((p) => [p.challengeId, p])
    );

    // Auto-detect streaks
    const records = await db
      .select()
      .from(attendance)
      .where(eq(attendance.studentId, student.id))
      .orderBy(asc(attendance.sessionNumber));

    // Calculate max consecutive present streak
    let maxStreak = 0;
    let currentStreak = 0;
    for (const record of records) {
      if (record.status === "present") {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }

    // Auto-complete streak challenges
    for (const challenge of activeChallenges) {
      if (
        challenge.type === "streak" &&
        challenge.streakRequired &&
        maxStreak >= challenge.streakRequired &&
        !progressMap.get(challenge.id)?.completed
      ) {
        const [upserted] = await db
          .insert(studentChallengeProgress)
          .values({
            studentId: student.id,
            challengeId: challenge.id,
            completed: true,
            pointsEarned: challenge.pointsReward,
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
              pointsEarned: sql`${challenge.pointsReward}`,
              badgeEarned: sql`${!!challenge.badgeName}`,
              completedAt: sql`now()`,
            },
          })
          .returning();

        if (upserted) {
          progressMap.set(challenge.id, upserted);
        }
      }
    }

    // Fetch task submission statuses for this student
    const taskSubs = await db
      .select({
        challengeId: taskSubmissions.challengeId,
        status: taskSubmissions.status,
        grade: taskSubmissions.grade,
      })
      .from(taskSubmissions)
      .where(eq(taskSubmissions.studentId, student.id));

    const taskSubMap = new Map(
      taskSubs.map((s) => [s.challengeId, { status: s.status, grade: s.grade }])
    );

    // Compute speedrun slots remaining
    const speedrunIds = activeChallenges.filter((c) => c.type === "speedrun").map((c) => c.id);
    const slotsMap = new Map<number, number>();
    if (speedrunIds.length > 0) {
      for (const sid of speedrunIds) {
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(studentChallengeProgress)
          .where(
            and(
              eq(studentChallengeProgress.challengeId, sid),
              eq(studentChallengeProgress.completed, true),
              sql`${studentChallengeProgress.pointsEarned} > 0`
            )
          );
        const challenge = activeChallenges.find((c) => c.id === sid)!;
        const slots = challenge.speedSlots ?? 1;
        slotsMap.set(sid, Math.max(0, slots - Number(countResult?.count ?? 0)));
      }
    }

    // Compute chain progress
    const chainMap = new Map<number, number>();
    for (const c of activeChallenges) {
      if (c.type === "chain") {
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(studentChallengeProgress)
          .where(eq(studentChallengeProgress.challengeId, c.id));
        chainMap.set(c.id, Number(countResult?.count ?? 0));
      }
    }

    // Compute auction highest bids
    const auctionMap = new Map<number, { highestBid: number; highestBidder: string; studentBid: number }>();
    for (const c of activeChallenges) {
      if (c.type === "auction") {
        const [highest] = await db
          .select({ amount: auctionBids.amount, studentId: auctionBids.studentId })
          .from(auctionBids)
          .where(eq(auctionBids.challengeId, c.id))
          .orderBy(desc(auctionBids.amount))
          .limit(1);

        let bidderName = "";
        if (highest) {
          const [bidder] = await db.select({ name: students.name }).from(students).where(eq(students.id, highest.studentId)).limit(1);
          bidderName = bidder?.name ?? "";
        }

        const [myBid] = await db
          .select({ amount: auctionBids.amount })
          .from(auctionBids)
          .where(and(eq(auctionBids.challengeId, c.id), eq(auctionBids.studentId, student.id)))
          .orderBy(desc(auctionBids.amount))
          .limit(1);

        auctionMap.set(c.id, {
          highestBid: highest?.amount ?? 0,
          highestBidder: bidderName,
          studentBid: myBid?.amount ?? 0,
        });
      }
    }

    const sideQuests = activeChallenges.map((c) => {
      let checkinWindowOpen = false;
      let checkinWindowEndsAt: string | undefined;
      if (c.type === "checkin" && c.checkinActivatedAt) {
        const windowEnd = new Date(
          c.checkinActivatedAt.getTime() + (c.checkinWindowSeconds ?? 300) * 1000
        );
        checkinWindowOpen = new Date() >= c.checkinActivatedAt && new Date() < windowEnd;
        checkinWindowEndsAt = windowEnd.toISOString();
      }

      return {
        challenge: c,
        progress: progressMap.get(c.id) || null,
        taskSubmission: (c.type === "task" || c.type === "bounty") ? (taskSubMap.get(c.id) || null) : null,
        anchorSession: c.anchorSession,
        ...(c.type === "speedrun" && { slotsRemaining: slotsMap.get(c.id) ?? 0 }),
        ...(c.type === "checkin" && { checkinWindowOpen, checkinWindowEndsAt }),
        ...(c.type === "chain" && { chainProgress: chainMap.get(c.id) ?? 0 }),
        ...(c.type === "auction" && auctionMap.get(c.id)),
      };
    });

    return NextResponse.json({
      sideQuests,
      currentStreak,
      maxStreak,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch challenges" },
      { status: 500 }
    );
  }
}
