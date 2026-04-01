"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import ProgressMap from "@/components/student/ProgressMap";
import type { SideQuestNode } from "@/types";
import { completeStreakChallenges } from "./actions";

const ThreeBackground = dynamic(
  () => import("@/components/student/ThreeBackground"),
  { ssr: false }
);

interface Session {
  sessionNumber: number;
  status: "present" | "absent" | "locked";
  date: string | null;
}

interface Props {
  studentName: string;
  studentSlug: string;
  studentAvatarUrl?: string | null;
  sessions: Session[];
  sideQuests: SideQuestNode[];
  stats: { totalPoints: number; badgeCount: number; badges: { emoji: string; name: string }[] };
  currentStreak: number;
}

export default function StudentMapClient({
  studentName,
  studentSlug,
  studentAvatarUrl,
  sessions,
  sideQuests,
  stats,
  currentStreak,
}: Props) {
  // Trigger streak auto-completion as a side effect, not during render
  useEffect(() => {
    completeStreakChallenges(studentSlug);
  }, [studentSlug]);

  return (
    <div className="min-h-dvh relative overflow-hidden bg-[#0A0A0A]">
      <ThreeBackground />
      <ProgressMap
        sessions={sessions}
        studentName={studentName}
        studentSlug={studentSlug}
        studentAvatarUrl={studentAvatarUrl}
        sideQuests={sideQuests}
        stats={stats}
        currentStreak={currentStreak}
      />
    </div>
  );
}
