import { db } from "../src/lib/db";
import {
  challenges,
  quizAttempts,
  studentChallengeProgress,
  students,
} from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const CHALLENGE_ID = Number(process.argv[2]);
if (!CHALLENGE_ID) {
  console.error("Usage: tsx scripts/inspect-attempts.ts <challengeId>");
  process.exit(1);
}

async function main() {
  const [c] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, CHALLENGE_ID))
    .limit(1);
  if (!c) {
    console.error(`Challenge #${CHALLENGE_ID} not found.`);
    process.exit(1);
  }
  console.log(`=== Challenge #${c.id} "${c.title}" (${c.type}) ===`);

  const attempts = await db
    .select({
      id: quizAttempts.id,
      studentName: students.name,
      score: quizAttempts.score,
      total: quizAttempts.total,
      passed: quizAttempts.passed,
      attemptedAt: quizAttempts.attemptedAt,
    })
    .from(quizAttempts)
    .innerJoin(students, eq(quizAttempts.studentId, students.id))
    .where(eq(quizAttempts.challengeId, c.id));
  console.log(`  quiz_attempts (${attempts.length}):`);
  for (const a of attempts) {
    console.log(
      `    ${a.studentName}: ${a.score}/${a.total} ${a.passed ? "PASS" : "FAIL"} @ ${a.attemptedAt.toISOString()}`
    );
  }

  const progress = await db
    .select({
      studentName: students.name,
      completed: studentChallengeProgress.completed,
      pointsEarned: studentChallengeProgress.pointsEarned,
    })
    .from(studentChallengeProgress)
    .innerJoin(students, eq(students.id, studentChallengeProgress.studentId))
    .where(eq(studentChallengeProgress.challengeId, c.id));
  console.log(`  student_challenge_progress (${progress.length}):`);
  for (const p of progress) {
    console.log(`    ${p.studentName}: completed=${p.completed} pts=${p.pointsEarned}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
