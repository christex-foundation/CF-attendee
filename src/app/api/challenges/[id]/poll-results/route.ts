import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { challenges, quizQuestions, quizAttempts } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const challengeId = parseInt(id, 10);

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId))
      .limit(1);

    if (!challenge || challenge.type !== "poll") {
      return NextResponse.json(
        { error: "Poll challenge not found" },
        { status: 404 }
      );
    }

    const questions = await db
      .select()
      .from(quizQuestions)
      .where(eq(quizQuestions.challengeId, challengeId))
      .orderBy(asc(quizQuestions.orderIndex));

    const attempts = await db
      .select({ answers: quizAttempts.answers })
      .from(quizAttempts)
      .where(eq(quizAttempts.challengeId, challengeId));

    const totalResponses = attempts.length;

    const results = questions.map((q, qi) => {
      const options = JSON.parse(q.options) as string[];
      const counts = new Array(options.length).fill(0);

      for (const attempt of attempts) {
        const answerArr = JSON.parse(attempt.answers) as number[];
        const picked = answerArr[qi];
        if (picked >= 0 && picked < options.length) {
          counts[picked]++;
        }
      }

      return {
        questionText: q.questionText,
        options: options.map((text, i) => ({
          text,
          count: counts[i],
          percentage: totalResponses > 0 ? Math.round((counts[i] / totalResponses) * 100) : 0,
        })),
      };
    });

    return NextResponse.json({ totalResponses, results });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch poll results" },
      { status: 500 }
    );
  }
}
