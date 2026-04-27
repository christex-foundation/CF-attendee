import { db } from "../src/lib/db";
import {
  challenges,
  quizAttempts,
  studentChallengeProgress,
} from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const CHALLENGE_ID = Number(process.argv[2]);
const EXPECTED_TITLE = process.argv[3];

if (!CHALLENGE_ID || !EXPECTED_TITLE) {
  console.error(
    "Usage: tsx scripts/revert-wager-attempts.ts <challengeId> <expectedTitle>"
  );
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
  if (c.title !== EXPECTED_TITLE) {
    console.error(
      `Title guard failed: challenge #${CHALLENGE_ID} is "${c.title}", expected "${EXPECTED_TITLE}"`
    );
    process.exit(1);
  }
  if (c.type !== "wager" && c.type !== "quiz") {
    console.error(
      `Type guard failed: challenge #${CHALLENGE_ID} is type "${c.type}", expected "wager" or "quiz"`
    );
    process.exit(1);
  }

  console.log(`Reverting attempts for ${c.type} #${c.id} "${c.title}"...`);

  const attemptsDel = await db
    .delete(quizAttempts)
    .where(eq(quizAttempts.challengeId, c.id))
    .returning({ id: quizAttempts.id });
  console.log(`  quiz_attempts deleted: ${attemptsDel.length} rows`);

  const progressDel = await db
    .delete(studentChallengeProgress)
    .where(eq(studentChallengeProgress.challengeId, c.id))
    .returning({ id: studentChallengeProgress.id });
  console.log(`  student_challenge_progress deleted: ${progressDel.length} rows`);

  console.log("Done. Students can now re-attempt the challenge.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Revert failed:", err);
    process.exit(1);
  });
