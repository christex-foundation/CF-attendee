import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { students, studentDuels } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const cid = parseInt(id, 10);

    const rows = await db
      .select()
      .from(studentDuels)
      .where(eq(studentDuels.challengeId, cid))
      .orderBy(desc(studentDuels.createdAt));

    const studentIds = new Set<number>();
    for (const r of rows) {
      studentIds.add(r.challengerId);
      studentIds.add(r.opponentId);
    }
    const nameRows = studentIds.size
      ? await db
          .select({ id: students.id, name: students.name })
          .from(students)
          .where(inArray(students.id, Array.from(studentIds)))
      : [];
    const nameMap = new Map(nameRows.map((n) => [n.id, n.name]));

    const view = rows.map((r) => ({
      id: r.id,
      challengeId: r.challengeId,
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
      actualPointsTransferred: r.actualPointsTransferred,
      resolvedAt: r.resolvedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json(view);
  } catch {
    return NextResponse.json({ error: "Failed to fetch duels" }, { status: 500 });
  }
}
