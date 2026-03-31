import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;
    const { avatarUrl } = await request.json();

    if (!avatarUrl || typeof avatarUrl !== "string") {
      return NextResponse.json(
        { error: "avatarUrl is required" },
        { status: 400 }
      );
    }

    // Only allow DiceBear URLs or valid image URLs
    const isDiceBear = avatarUrl.startsWith("https://api.dicebear.com/");
    const isImageUrl = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(avatarUrl);
    const isGenericHttps = avatarUrl.startsWith("https://");

    if (!isDiceBear && !isImageUrl && !isGenericHttps) {
      return NextResponse.json(
        { error: "Invalid avatar URL. Must be a valid HTTPS image URL." },
        { status: 400 }
      );
    }

    const [student] = await db
      .select()
      .from(students)
      .where(eq(students.slug, slug))
      .limit(1);

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(students)
      .set({ avatarUrl })
      .where(eq(students.slug, slug))
      .returning();

    return NextResponse.json({ avatarUrl: updated.avatarUrl });
  } catch {
    return NextResponse.json(
      { error: "Failed to update avatar" },
      { status: 500 }
    );
  }
}
