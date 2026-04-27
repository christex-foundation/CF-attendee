import { db } from "../src/lib/db";
import {
  challenges,
  taskSubmissions,
  studentChallengeProgress,
  students,
} from "../src/lib/db/schema";
import { eq, and } from "drizzle-orm";

async function main() {
  const bounties = await db
    .select()
    .from(challenges)
    .where(eq(challenges.type, "bounty"));

  if (bounties.length === 0) {
    console.log("No bounty challenges found.");
    return;
  }

  for (const c of bounties) {
    console.log(`\n=== Bounty #${c.id}: "${c.title}" ===`);

    const subs = await db
      .select({
        id: taskSubmissions.id,
        studentId: taskSubmissions.studentId,
        studentName: students.name,
        status: taskSubmissions.status,
        grade: taskSubmissions.grade,
        reviewedAt: taskSubmissions.reviewedAt,
        submittedAt: taskSubmissions.submittedAt,
      })
      .from(taskSubmissions)
      .leftJoin(students, eq(students.id, taskSubmissions.studentId))
      .where(eq(taskSubmissions.challengeId, c.id));

    console.log(`  Submissions (${subs.length}):`);
    for (const s of subs) {
      const reviewed = s.reviewedAt ? `reviewed ${s.reviewedAt.toISOString()}` : "not reviewed";
      console.log(`    sub#${s.id} ${s.studentName} → status=${s.status} grade=${s.grade ?? "—"} (${reviewed})`);
    }

    const progress = await db
      .select({
        studentId: studentChallengeProgress.studentId,
        studentName: students.name,
        completed: studentChallengeProgress.completed,
        pointsEarned: studentChallengeProgress.pointsEarned,
        badgeEarned: studentChallengeProgress.badgeEarned,
      })
      .from(studentChallengeProgress)
      .leftJoin(students, eq(students.id, studentChallengeProgress.studentId))
      .where(eq(studentChallengeProgress.challengeId, c.id));

    console.log(`  Progress rows (${progress.length}):`);
    for (const p of progress) {
      console.log(`    student#${p.studentId} ${p.studentName} → completed=${p.completed} pts=${p.pointsEarned} badge=${p.badgeEarned}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
