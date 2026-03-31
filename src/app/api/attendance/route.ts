import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance, students } from "@/lib/db/schema";
import { sql, eq, asc } from "drizzle-orm";

export async function GET() {
  try {
    const records = await db
      .select({
        id: attendance.id,
        studentId: attendance.studentId,
        studentName: students.name,
        sessionNumber: attendance.sessionNumber,
        status: attendance.status,
        date: attendance.date,
      })
      .from(attendance)
      .innerJoin(students, eq(attendance.studentId, students.id))
      .orderBy(asc(attendance.sessionNumber), asc(students.name));

    return NextResponse.json(records);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionNumber, date, records } = body;

    if (typeof sessionNumber !== "number" || sessionNumber < 1 || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: "sessionNumber and records array are required" },
        { status: 400 }
      );
    }

    const sessionDate = date ? new Date(date) : new Date();

    const values = records.map(
      (r: { studentId: number; status: "present" | "absent" }) => ({
        studentId: r.studentId,
        sessionNumber: sessionNumber as number,
        status: r.status,
        date: sessionDate,
      })
    );

    await db
      .insert(attendance)
      .values(values)
      .onConflictDoUpdate({
        target: [attendance.studentId, attendance.sessionNumber],
        set: {
          status: sql`excluded.status`,
          date: sql`excluded.date`,
        },
      });

    return NextResponse.json({ success: true, count: records.length });
  } catch {
    return NextResponse.json(
      { error: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
