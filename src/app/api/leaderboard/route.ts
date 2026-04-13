import { NextResponse } from "next/server";
import { computeLeaderboard } from "@/lib/leaderboard";

export async function GET() {
  try {
    const data = await computeLeaderboard();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}
