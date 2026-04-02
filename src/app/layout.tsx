import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "QuestLog",
  description: "Gamified attendance tracking with quests, badges, and streaks",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://questlog.vercel.app"),
  openGraph: {
    title: "QuestLog",
    description: "Gamified attendance tracking with leaderboards, challenges, badges & streaks",
    siteName: "QuestLog",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "QuestLog - Gamified Attendance Tracking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuestLog",
    description: "Gamified attendance tracking with leaderboards, challenges, badges & streaks",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
