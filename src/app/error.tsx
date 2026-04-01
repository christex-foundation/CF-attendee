"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#0A0A0A] px-4">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">&#x26A0;&#xFE0F;</div>
        <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-[#999] text-sm mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-[#C4A265] text-[#1A1A1A] font-semibold rounded-xl hover:bg-[#D4B275] transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
