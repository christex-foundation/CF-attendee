import { computeLeaderboard } from "@/lib/leaderboard";
import LeaderboardClient from "./client";

export const revalidate = 60;

export const metadata = {
  title: "Leaderboard - QuestLog",
  description: "See who's leading the attendance race!",
  openGraph: {
    title: "Leaderboard - QuestLog",
    description: "See who's leading the attendance race!",
    type: "website",
    siteName: "QuestLog",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "QuestLog — Live Leaderboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Leaderboard - QuestLog",
    description: "See who's leading the attendance race!",
    images: ["/opengraph-image"],
  },
};

export default async function LeaderboardPage() {
  const { entries, totalSessions } = await computeLeaderboard();
  return <LeaderboardClient entries={entries} totalSessions={totalSessions} />;
}
