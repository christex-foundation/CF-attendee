"use client";

import Link from "next/link";

export default function LeaderboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">&#x1F3C6;</div>
        <h1 className="text-xl font-bold text-white mb-2">
          Leaderboard unavailable
        </h1>
        <p className="text-[#999] text-sm mb-6">
          We couldn&apos;t load the leaderboard right now. Please try again.
        </p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <button
            onClick={reset}
            className="w-full py-3 bg-[#C4A265] text-[#1A1A1A] font-semibold rounded-xl hover:bg-[#D4B275] transition cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full py-3 bg-[#131313] border border-[#2A2A2A] text-white font-semibold rounded-xl hover:bg-[#1A1A1A] transition text-sm text-center"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
