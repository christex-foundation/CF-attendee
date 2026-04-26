import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { students, studentDuels } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getStudentScore } from "@/lib/student-score";

const MAX_DECLINES_PER_TEMPLATE = 2;

interface Params {
  params: Promise<{ slug: string; challengeId: string; duelId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { slug, challengeId, duelId } = await params;
    const cid = parseInt(challengeId, 10);
    const did = parseInt(duelId, 10);
    const body = await request.json();
    const action = body?.action as "accept" | "decline" | undefined;

    if (action !== "accept" && action !== "decline") {
      return NextResponse.json({ error: "action must be 'accept' or 'decline'" }, { status: 400 });
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.slug, slug))
      .limit(1);
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const [duel] = await db
      .select()
      .from(studentDuels)
      .where(eq(studentDuels.id, did))
      .limit(1);
    if (!duel || duel.challengeId !== cid) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }
    if (duel.opponentId !== student.id) {
      return NextResponse.json({ error: "Only the named opponent can respond" }, { status: 403 });
    }
    if (duel.status !== "pending") {
      return NextResponse.json({ error: `Duel is already ${duel.status}` }, { status: 409 });
    }

    if (action === "decline") {
      const [{ count } = { count: 0 }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(studentDuels)
        .where(
          and(
            eq(studentDuels.challengeId, cid),
            eq(studentDuels.opponentId, student.id),
            eq(studentDuels.status, "declined")
          )
        );
      const declineCount = Number(count ?? 0);
      if (declineCount >= MAX_DECLINES_PER_TEMPLATE) {
        return NextResponse.json(
          { error: `You've already declined ${MAX_DECLINES_PER_TEMPLATE} duels for this challenge — you must accept this one` },
          { status: 403 }
        );
      }

      await db
        .update(studentDuels)
        .set({ status: "declined" })
        .where(eq(studentDuels.id, did));

      return NextResponse.json({ status: "declined" });
    }

    // accept: re-validate balances
    const [challengerScore, opponentScore] = await Promise.all([
      getStudentScore(duel.challengerId),
      getStudentScore(student.id),
    ]);
    if (challengerScore < duel.wagerAmount) {
      return NextResponse.json(
        { error: `Challenger no longer has enough points (${challengerScore} < ${duel.wagerAmount})` },
        { status: 409 }
      );
    }
    if (opponentScore < duel.wagerAmount) {
      return NextResponse.json(
        { error: `You don't have enough points (${opponentScore} < ${duel.wagerAmount})` },
        { status: 409 }
      );
    }

    await db
      .update(studentDuels)
      .set({ status: "accepted" })
      .where(eq(studentDuels.id, did));

    return NextResponse.json({ status: "accepted" });
  } catch {
    return NextResponse.json({ error: "Failed to respond to duel" }, { status: 500 });
  }
}
