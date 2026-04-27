import { db } from "../src/lib/db";
import {
  challenges,
  taskSubmissions,
  studentChallengeProgress,
} from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const CHALLENGE_ID = Number(process.argv[2]);
const EXPECTED_TITLE = process.argv[3];

if (!CHALLENGE_ID || !EXPECTED_TITLE) {
  console.error(
    "Usage: tsx scripts/revert-bounty-grading.ts <challengeId> <expectedTitle>"
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
  if (c.type !== "bounty") {
    console.error(
      `Type guard failed: challenge #${CHALLENGE_ID} is type "${c.type}", expected "bounty"`
    );
    process.exit(1);
  }

  console.log(`Reverting grading for bounty #${c.id} "${c.title}"...`);

  const subUpdate = await db
    .update(taskSubmissions)
    .set({ status: "pending", grade: null, adminNotes: null, reviewedAt: null })
    .where(eq(taskSubmissions.challengeId, c.id))
    .returning({ id: taskSubmissions.id });

  console.log(`  task_submissions reset: ${subUpdate.length} rows`);

  const progDelete = await db
    .delete(studentChallengeProgress)
    .where(eq(studentChallengeProgress.challengeId, c.id))
    .returning({ id: studentChallengeProgress.id });

  console.log(`  student_challenge_progress deleted: ${progDelete.length} rows`);

  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Revert failed:", err);
    process.exit(1);
  });
