import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { students, challenges, studentDuels } from "@/lib/db/schema";
import { and, eq, or, sql, inArray } from "drizzle-orm";
import { getStudentScore } from "@/lib/student-score";

const MAX_DECLINES_PER_TEMPLATE = 2;
const MAX_DUELS_PER_TEMPLATE = 3; // unified cap: combined participations as challenger + opponent

// Statuses that count toward a student's participation cap.
// declined/void are excluded — they didn't take place / were refunded.
const ACTIVE_STATUSES: ("pending" | "accepted" | "submitted" | "resolved")[] = [
  "pending",
  "accepted",
  "submitted",
  "resolved",
];

async function getParticipationCount(challengeId: number, studentId: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(studentDuels)
    .where(
      and(
        eq(studentDuels.challengeId, challengeId),
        or(
          eq(studentDuels.challengerId, studentId),
          eq(studentDuels.opponentId, studentId)
        ),
        inArray(studentDuels.status, ACTIVE_STATUSES)
      )
    );
  return Number(row?.count ?? 0);
}

async function getParticipationCounts(challengeId: number, studentIds: number[]) {
  if (studentIds.length === 0) return new Map<number, number>();
  const rows = await db
    .select({
      challengerId: studentDuels.challengerId,
      opponentId: studentDuels.opponentId,
    })
    .from(studentDuels)
    .where(
      and(
        eq(studentDuels.challengeId, challengeId),
        inArray(studentDuels.status, ACTIVE_STATUSES)
      )
    );
  const counts = new Map<number, number>();
  for (const r of rows) {
    counts.set(r.challengerId, (counts.get(r.challengerId) ?? 0) + 1);
    counts.set(r.opponentId, (counts.get(r.opponentId) ?? 0) + 1);
  }
  return counts;
}

interface Params {
  params: Promise<{ slug: string; challengeId: string }>;
}

interface DuelView {
  id: number;
  challengerId: number;
  opponentId: number;
  challengerName: string;
  opponentName: string;
  wagerAmount: number;
  status: string;
  challengerSubmission: string | null;
  opponentSubmission: string | null;
  challengerSubmittedAt: string | null;
  opponentSubmittedAt: string | null;
  winnerId: number | null;
  resolvedAt: string | null;
  createdAt: string;
}

async function loadDuelsForView(
  challengeId: number,
  studentId: number
): Promise<{
  active: DuelView[];
  incoming: DuelView[];
  outgoing: DuelView[];
  resolved: DuelView[];
}> {
  const challengerStudent = { id: students.id, name: students.name };
  const rows = await db
    .select({
      id: studentDuels.id,
      challengerId: studentDuels.challengerId,
      opponentId: studentDuels.opponentId,
      wagerAmount: studentDuels.wagerAmount,
      status: studentDuels.status,
      challengerSubmission: studentDuels.challengerSubmission,
      opponentSubmission: studentDuels.opponentSubmission,
      challengerSubmittedAt: studentDuels.challengerSubmittedAt,
      opponentSubmittedAt: studentDuels.opponentSubmittedAt,
      winnerId: studentDuels.winnerId,
      resolvedAt: studentDuels.resolvedAt,
      createdAt: studentDuels.createdAt,
    })
    .from(studentDuels)
    .where(
      and(
        eq(studentDuels.challengeId, challengeId),
        or(
          eq(studentDuels.challengerId, studentId),
          eq(studentDuels.opponentId, studentId)
        )
      )
    );

  // Resolve names
  const studentIds = new Set<number>();
  for (const r of rows) {
    studentIds.add(r.challengerId);
    studentIds.add(r.opponentId);
  }
  const nameRows = studentIds.size
    ? await db
        .select({ id: challengerStudent.id, name: challengerStudent.name })
        .from(students)
        .where(inArray(students.id, Array.from(studentIds)))
    : [];
  const nameMap = new Map(nameRows.map((n) => [n.id, n.name]));

  const view = rows.map<DuelView>((r) => ({
    id: r.id,
    challengerId: r.challengerId,
    opponentId: r.opponentId,
    challengerName: nameMap.get(r.challengerId) ?? "?",
    opponentName: nameMap.get(r.opponentId) ?? "?",
    wagerAmount: r.wagerAmount,
    status: r.status,
    challengerSubmission: r.challengerSubmission,
    opponentSubmission: r.opponentSubmission,
    challengerSubmittedAt: r.challengerSubmittedAt?.toISOString() ?? null,
    opponentSubmittedAt: r.opponentSubmittedAt?.toISOString() ?? null,
    winnerId: r.winnerId,
    resolvedAt: r.resolvedAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  return {
    active: view.filter(
      (d) => d.status === "accepted" || d.status === "submitted"
    ),
    incoming: view.filter(
      (d) => d.status === "pending" && d.opponentId === studentId
    ),
    outgoing: view.filter(
      (d) => d.status === "pending" && d.challengerId === studentId
    ),
    resolved: view.filter(
      (d) => d.status === "resolved" || d.status === "void"
    ),
  };
}

async function listOtherStudents(currentStudentId: number) {
  const rows = await db
    .select({ id: students.id, name: students.name, slug: students.slug })
    .from(students);
  return rows.filter((s) => s.id !== currentStudentId);
}

async function countDeclinesForTemplate(challengeId: number, studentId: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(studentDuels)
    .where(
      and(
        eq(studentDuels.challengeId, challengeId),
        eq(studentDuels.opponentId, studentId),
        eq(studentDuels.status, "declined")
      )
    );
  return Number(row?.count ?? 0);
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { slug, challengeId } = await params;
    const cid = parseInt(challengeId, 10);

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, cid))
      .limit(1);
    if (!challenge || challenge.type !== "duel") {
      return NextResponse.json({ error: "Duel challenge not found" }, { status: 404 });
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.slug, slug))
      .limit(1);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const [currentScore, duels, others, declineCount] = await Promise.all([
      getStudentScore(student.id),
      loadDuelsForView(cid, student.id),
      listOtherStudents(student.id),
      countDeclinesForTemplate(cid, student.id),
    ]);

    const wagerMin = challenge.wagerMin ?? 5;
    const wagerMax = Math.min(challenge.wagerMax ?? 50, Math.max(0, currentScore));

    // Participation counts for me + every other student in the roster
    const allIds = [student.id, ...others.map((o) => o.id)];
    const participationCounts = await getParticipationCounts(cid, allIds);
    const myParticipationCount = participationCounts.get(student.id) ?? 0;
    const atCap = myParticipationCount >= MAX_DUELS_PER_TEMPLATE;

    // Filter dropdown: hide classmates who are already at cap on this template.
    const eligibleOpponents = others.filter(
      (o) => (participationCounts.get(o.id) ?? 0) < MAX_DUELS_PER_TEMPLATE
    );

    return NextResponse.json({
      duelTemplate: {
        wagerMin: challenge.wagerMin ?? 5,
        wagerMax: challenge.wagerMax ?? 50,
      },
      effectiveWagerMin: wagerMin,
      effectiveWagerMax: wagerMax,
      currentScore,
      meId: student.id,
      students: eligibleOpponents,
      activeDuels: duels.active,
      incomingInvites: duels.incoming,
      outgoingChallenges: duels.outgoing,
      resolvedDuels: duels.resolved,
      declineCount,
      canDecline: declineCount < MAX_DECLINES_PER_TEMPLATE,
      maxDeclines: MAX_DECLINES_PER_TEMPLATE,
      participationCount: myParticipationCount,
      maxParticipations: MAX_DUELS_PER_TEMPLATE,
      atCap,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch duel state" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { slug, challengeId } = await params;
    const cid = parseInt(challengeId, 10);
    const body = await request.json();
    const { opponentSlug, wagerAmount } = body as {
      opponentSlug: string;
      wagerAmount: number;
    };

    if (!opponentSlug || typeof wagerAmount !== "number") {
      return NextResponse.json(
        { error: "opponentSlug and wagerAmount required" },
        { status: 400 }
      );
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, cid))
      .limit(1);
    if (!challenge || challenge.type !== "duel") {
      return NextResponse.json({ error: "Duel challenge not found" }, { status: 404 });
    }
    if (challenge.deadline && new Date(challenge.deadline) < new Date()) {
      return NextResponse.json({ error: "Deadline has passed" }, { status: 403 });
    }

    const [challenger] = await db
      .select()
      .from(students)
      .where(eq(students.slug, slug))
      .limit(1);
    if (!challenger) {
      return NextResponse.json({ error: "Challenger not found" }, { status: 404 });
    }

    const [opponent] = await db
      .select()
      .from(students)
      .where(eq(students.slug, opponentSlug))
      .limit(1);
    if (!opponent) {
      return NextResponse.json({ error: "Opponent not found" }, { status: 404 });
    }

    if (opponent.id === challenger.id) {
      return NextResponse.json({ error: "You can't challenge yourself" }, { status: 400 });
    }

    // Enforce unified participation cap on both sides.
    const [challengerCount, opponentCount] = await Promise.all([
      getParticipationCount(cid, challenger.id),
      getParticipationCount(cid, opponent.id),
    ]);
    if (challengerCount >= MAX_DUELS_PER_TEMPLATE) {
      return NextResponse.json(
        { error: `You're already in ${MAX_DUELS_PER_TEMPLATE} duels for this task — that's the limit.` },
        { status: 403 }
      );
    }
    if (opponentCount >= MAX_DUELS_PER_TEMPLATE) {
      return NextResponse.json(
        { error: `${opponent.name} is already in ${MAX_DUELS_PER_TEMPLATE} duels for this task — pick someone else.` },
        { status: 403 }
      );
    }

    const wagerMin = challenge.wagerMin ?? 5;
    const wagerMax = challenge.wagerMax ?? 50;
    if (wagerAmount < wagerMin || wagerAmount > wagerMax) {
      return NextResponse.json(
        { error: `Wager must be between ${wagerMin} and ${wagerMax}` },
        { status: 400 }
      );
    }

    const [challengerScore, opponentScore] = await Promise.all([
      getStudentScore(challenger.id),
      getStudentScore(opponent.id),
    ]);
    if (wagerAmount > challengerScore) {
      return NextResponse.json(
        { error: `You only have ${challengerScore} points to wager` },
        { status: 400 }
      );
    }
    if (wagerAmount > opponentScore) {
      return NextResponse.json(
        { error: `${opponent.name} only has ${opponentScore} points — pick a lower wager` },
        { status: 400 }
      );
    }

    const [created] = await db
      .insert(studentDuels)
      .values({
        challengeId: cid,
        challengerId: challenger.id,
        opponentId: opponent.id,
        wagerAmount,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ duelId: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create duel" }, { status: 500 });
  }
}
