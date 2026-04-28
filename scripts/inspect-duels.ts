import { db } from "../src/lib/db";
import { challenges, studentDuels, students } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

async function main() {
  const duels = await db.select().from(challenges).where(eq(challenges.type, "duel"));
  if (duels.length === 0) {
    console.log("No duel challenges.");
    return;
  }

  const challengerS = alias(students, "challengerS");
  const opponentS = alias(students, "opponentS");

  for (const c of duels) {
    console.log(`\n=== Duel #${c.id} "${c.title}" ===`);

    const rows = await db
      .select({
        id: studentDuels.id,
        challengerName: challengerS.name,
        opponentName: opponentS.name,
        status: studentDuels.status,
        wagerAmount: studentDuels.wagerAmount,
        cSub: studentDuels.challengerSubmission,
        oSub: studentDuels.opponentSubmission,
        cAt: studentDuels.challengerSubmittedAt,
        oAt: studentDuels.opponentSubmittedAt,
        createdAt: studentDuels.createdAt,
      })
      .from(studentDuels)
      .leftJoin(challengerS, eq(challengerS.id, studentDuels.challengerId))
      .leftJoin(opponentS, eq(opponentS.id, studentDuels.opponentId))
      .where(eq(studentDuels.challengeId, c.id));

    const counts = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
    console.log("  status counts:", counts);

    for (const r of rows) {
      const cMark = r.cSub ? "✓" : "·";
      const oMark = r.oSub ? "✓" : "·";
      console.log(
        `    duel#${r.id} ${r.challengerName} [${cMark}] vs ${r.opponentName} [${oMark}] — status=${r.status} wager=${r.wagerAmount}`
      );
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
