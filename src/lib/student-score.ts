import { db } from "@/lib/db";
import {
  attendance,
  studentChallengeProgress,
  studentDuels,
  students,
} from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getStudentScore(studentId: number): Promise<number> {
  const [attResult] = await db
    .select({ count: sql<number>`count(*) filter (where ${attendance.status} = 'present')` })
    .from(attendance)
    .where(eq(attendance.studentId, studentId));

  const [ptsResult] = await db
    .select({ total: sql<number>`coalesce(sum(${studentChallengeProgress.pointsEarned}), 0)` })
    .from(studentChallengeProgress)
    .where(eq(studentChallengeProgress.studentId, studentId));

  const [student] = await db
    .select({ manualPoints: students.manualPoints })
    .from(students)
    .where(eq(students.id, studentId))
    .limit(1);

  const [duelResult] = await db
    .select({
      total: sql<number>`coalesce(sum(
        case
          when ${studentDuels.winnerId} = ${studentId}
            then coalesce(${studentDuels.actualPointsTransferred}, ${studentDuels.wagerAmount})
          when ${studentDuels.winnerId} is not null
            and ${studentDuels.winnerId} <> ${studentId}
            and (${studentDuels.challengerId} = ${studentId} or ${studentDuels.opponentId} = ${studentId})
            then -coalesce(${studentDuels.actualPointsTransferred}, ${studentDuels.wagerAmount})
          else 0
        end
      ), 0)`,
    })
    .from(studentDuels)
    .where(sql`${studentDuels.status} = 'resolved' and (${studentDuels.challengerId} = ${studentId} or ${studentDuels.opponentId} = ${studentId})`);

  const attendancePoints = Number(attResult?.count ?? 0) * 10;
  const challengePoints = Number(ptsResult?.total ?? 0);
  const manualPoints = student?.manualPoints ?? 0;
  const duelPoints = Number(duelResult?.total ?? 0);

  return attendancePoints + challengePoints + manualPoints + duelPoints;
}
