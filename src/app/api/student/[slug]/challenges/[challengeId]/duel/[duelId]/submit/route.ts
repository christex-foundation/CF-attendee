import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { challenges, students, studentDuels } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

interface Params {
  params: Promise<{ slug: string; challengeId: string; duelId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { slug, challengeId, duelId } = await params;
    const cid = parseInt(challengeId, 10);
    const did = parseInt(duelId, 10);
    const body = await request.json();
    const submissionText = (body?.submissionText as string | undefined)?.trim();

    if (!submissionText) {
      return NextResponse.json({ error: "submissionText required" }, { status: 400 });
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
    if (duel.status !== "accepted" && duel.status !== "submitted") {
      return NextResponse.json({ error: `Duel is ${duel.status}` }, { status: 409 });
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, cid))
      .limit(1);
    if (challenge?.deadline && new Date(challenge.deadline) < new Date()) {
      return NextResponse.json({ error: "Deadline has passed" }, { status: 403 });
    }

    const isChallenger = student.id === duel.challengerId;
    const isOpponent = student.id === duel.opponentId;
    if (!isChallenger && !isOpponent) {
      return NextResponse.json({ error: "Not a participant in this duel" }, { status: 403 });
    }

    if (isChallenger && duel.challengerSubmission) {
      return NextResponse.json({ error: "You already submitted" }, { status: 409 });
    }
    if (isOpponent && duel.opponentSubmission) {
      return NextResponse.json({ error: "You already submitted" }, { status: 409 });
    }

    const updateValues: Record<string, unknown> = {};
    if (isChallenger) {
      updateValues.challengerSubmission = submissionText;
      updateValues.challengerSubmittedAt = sql`now()`;
    } else {
      updateValues.opponentSubmission = submissionText;
      updateValues.opponentSubmittedAt = sql`now()`;
    }

    const otherSubmitted = isChallenger
      ? !!duel.opponentSubmission
      : !!duel.challengerSubmission;
    if (otherSubmitted) {
      updateValues.status = "submitted";
    }

    await db.update(studentDuels).set(updateValues).where(eq(studentDuels.id, did));

    return NextResponse.json({
      status: otherSubmitted ? "submitted" : "accepted",
      bothSubmitted: otherSubmitted,
    });
  } catch {
    return NextResponse.json({ error: "Failed to submit" }, { status: 500 });
  }
}
