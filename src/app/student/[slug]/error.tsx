"use client";

import Link from "next/link";

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">&#x1F61E;</div>
        <h1 className="text-xl font-bold text-white mb-2">
          Couldn&apos;t load this page
        </h1>
        <p className="text-[#999] text-sm mb-6">
          There was an error loading the student dashboard.
        </p>
        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <button
            onClick={reset}
            className="w-full py-3 bg-[#C4A265] text-[#1A1A1A] font-semibold rounded-xl hover:bg-[#D4B275] transition cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/leaderboard"
            className="w-full py-3 bg-[#131313] border border-[#2A2A2A] text-white font-semibold rounded-xl hover:bg-[#1A1A1A] transition text-sm text-center"
          >
            Back to Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}
