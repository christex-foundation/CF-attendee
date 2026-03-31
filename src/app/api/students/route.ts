import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { generateSlug } from "@/lib/utils";
import { getDiceBearUrl } from "@/lib/avatar";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const allStudents = await db
      .select()
      .from(students)
      .orderBy(asc(students.name));

    return NextResponse.json(allStudents);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Student name is required" },
        { status: 400 }
      );
    }

    const slug = generateSlug(name.trim());
    const avatarUrl = getDiceBearUrl(slug);

    const [student] = await db
      .insert(students)
      .values({ name: name.trim(), slug, avatarUrl })
      .returning();

    return NextResponse.json(student, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}
