import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Christex Attend",
  description: "Gamified attendance tracking for Christex Engineering Cohort",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://christex-attend.vercel.app"),
  openGraph: {
    title: "Christex Attend",
    description: "Gamified attendance tracking with leaderboards, challenges, badges & streaks",
    siteName: "Christex Attend",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Christex Attend - Gamified Attendance Tracking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Christex Attend",
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
