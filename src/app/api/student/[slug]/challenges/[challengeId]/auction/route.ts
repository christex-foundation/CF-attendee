import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  students,
  challenges,
  auctionBids,
} from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { getStudentScore } from "@/lib/student-score";

interface Params {
  params: Promise<{ slug: string; challengeId: string }>;
}

// GET: current bid status
export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { slug, challengeId } = await params;
    const cid = parseInt(challengeId, 10);

    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, cid)).limit(1);
    if (!challenge || challenge.type !== "auction") {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    const [student] = await db.select().from(students).where(eq(students.slug, slug)).limit(1);

    // Get highest bid
    const [highest] = await db
      .select({
        amount: auctionBids.amount,
        studentId: auctionBids.studentId,
      })
      .from(auctionBids)
      .where(eq(auctionBids.challengeId, cid))
      .orderBy(desc(auctionBids.amount))
      .limit(1);

    // Get this student's current bid
    let studentBid: number | null = null;
    if (student) {
      const [myBid] = await db
        .select({ amount: auctionBids.amount })
        .from(auctionBids)
        .where(
          and(
            eq(auctionBids.challengeId, cid),
            eq(auctionBids.studentId, student.id)
          )
        )
        .orderBy(desc(auctionBids.amount))
        .limit(1);
      studentBid = myBid?.amount ?? null;
    }

    // Get student's name for display
    let highestBidderName: string | null = null;
    if (highest) {
      const [bidder] = await db
        .select({ name: students.name })
        .from(students)
        .where(eq(students.id, highest.studentId))
        .limit(1);
      highestBidderName = bidder?.name ?? null;
    }

    const currentScore = student ? await getStudentScore(student.id) : 0;
    const deadlinePassed = challenge.deadline ? new Date(challenge.deadline) < new Date() : false;

    return NextResponse.json({
      highestBid: highest?.amount ?? 0,
      highestBidder: highestBidderName,
      studentBid,
      currentScore,
      auctionMinBid: challenge.auctionMinBid ?? 1,
      deadlinePassed,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch auction" }, { status: 500 });
  }
}

// POST: place or raise bid
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { slug, challengeId } = await params;
    const cid = parseInt(challengeId, 10);
    const body = await request.json();
    const { amount } = body as { amount: number };

    if (typeof amount !== "number" || amount < 1) {
      return NextResponse.json({ error: "Invalid bid amount" }, { status: 400 });
    }

    const [student] = await db.select().from(students).where(eq(students.slug, slug)).limit(1);
    if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const [challenge] = await db.select().from(challenges).where(eq(challenges.id, cid)).limit(1);
    if (!challenge || challenge.type !== "auction") {
      return NextResponse.json({ error: "Auction not found" }, { status: 404 });
    }

    if (challenge.deadline && new Date(challenge.deadline) < new Date()) {
      return NextResponse.json({ error: "Auction has ended" }, { status: 403 });
    }

    // Validate bid >= minimum
    if (amount < (challenge.auctionMinBid ?? 1)) {
      return NextResponse.json({ error: `Bid must be at least ${challenge.auctionMinBid}` }, { status: 400 });
    }

    // Validate bid > current highest
    const [highest] = await db
      .select({ amount: auctionBids.amount })
      .from(auctionBids)
      .where(eq(auctionBids.challengeId, cid))
      .orderBy(desc(auctionBids.amount))
      .limit(1);

    if (highest && amount <= highest.amount) {
      return NextResponse.json({ error: `Bid must exceed current highest (${highest.amount})` }, { status: 400 });
    }

    // Validate student has enough points
    const currentScore = await getStudentScore(student.id);
    if (amount > currentScore) {
      return NextResponse.json({ error: `You only have ${currentScore} points to bid` }, { status: 400 });
    }

    // Insert new bid (we keep history, highest wins at end)
    await db.insert(auctionBids).values({
      studentId: student.id,
      challengeId: cid,
      amount,
    });

    return NextResponse.json({ success: true, amount });
  } catch {
    return NextResponse.json({ error: "Failed to place bid" }, { status: 500 });
  }
}
