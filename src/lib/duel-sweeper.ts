import { db } from "@/lib/db";
import { studentDuels } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";

export async function voidExpiredPendingDuels(
  challengeId: number,
  deadline: Date | string | null
): Promise<number> {
  if (!deadline) return 0;
  const when = typeof deadline === "string" ? new Date(deadline) : deadline;
  if (when.getTime() >= Date.now()) return 0;

  const updated = await db
    .update(studentDuels)
    .set({
      status: "void",
      resolvedAt: sql`now()`,
      actualPointsTransferred: 0,
    })
    .where(
      and(
        eq(studentDuels.challengeId, challengeId),
        eq(studentDuels.status, "pending")
      )
    )
    .returning({ id: studentDuels.id });

  return updated.length;
}
