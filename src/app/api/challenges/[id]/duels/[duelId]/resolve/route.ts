import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { studentDuels } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { getStudentScore } from "@/lib/student-score";

interface Params {
  params: Promise<{ id: string; duelId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { id, duelId } = await params;
    const cid = parseInt(id, 10);
    const did = parseInt(duelId, 10);
    const body = await request.json();
    const action = body?.action as "winner" | "void" | undefined;
    const winnerId = body?.winnerId as number | undefined;

    if (action !== "winner" && action !== "void") {
      return NextResponse.json({ error: "action must be 'winner' or 'void'" }, { status: 400 });
    }

    const [duel] = await db
      .select()
      .from(studentDuels)
      .where(eq(studentDuels.id, did))
      .limit(1);

    if (!duel || duel.challengeId !== cid) {
      return NextResponse.json({ error: "Duel not found" }, { status: 404 });
    }
    if (duel.status === "resolved" || duel.status === "void") {
      return NextResponse.json({ error: `Already ${duel.status}` }, { status: 409 });
    }
    if (duel.status !== "submitted" && duel.status !== "accepted") {
      return NextResponse.json(
        { error: `Cannot resolve a duel with status '${duel.status}'` },
        { status: 409 }
      );
    }

    if (action === "void") {
      await db
        .update(studentDuels)
        .set({
          status: "void",
          resolvedAt: sql`now()`,
          winnerId: null,
          actualPointsTransferred: 0,
        })
        .where(eq(studentDuels.id, did));
      return NextResponse.json({ status: "void" });
    }

    if (winnerId !== duel.challengerId && winnerId !== duel.opponentId) {
      return NextResponse.json(
        { error: "winnerId must be the challenger or the opponent of this duel" },
        { status: 400 }
      );
    }

    // Cap loss at loser's current balance to avoid negative-balance surprises.
    const loserId = winnerId === duel.challengerId ? duel.opponentId : duel.challengerId;
    const loserScore = await getStudentScore(loserId);
    const transfer = Math.min(duel.wagerAmount, Math.max(0, loserScore));

    await db
      .update(studentDuels)
      .set({
        status: "resolved",
        winnerId,
        actualPointsTransferred: transfer,
        resolvedAt: sql`now()`,
      })
      .where(eq(studentDuels.id, did));

    return NextResponse.json({
      status: "resolved",
      winnerId,
      pointsTransferred: transfer,
    });
  } catch {
    return NextResponse.json({ error: "Failed to resolve duel" }, { status: 500 });
  }
}
