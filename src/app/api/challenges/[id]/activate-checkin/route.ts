import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { challenges } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const challengeId = parseInt(id, 10);

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);

    if (!challenge || challenge.type !== "checkin") {
      return NextResponse.json(
        { error: "Check-in challenge not found" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(challenges)
      .set({ checkinActivatedAt: sql`now()` })
      .where(eq(challenges.id, challengeId))
      .returning();

    return NextResponse.json({
      success: true,
      checkinActivatedAt: updated.checkinActivatedAt?.toISOString(),
      checkinWindowSeconds: updated.checkinWindowSeconds,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to activate check-in" },
      { status: 500 }
    );
  }
}
