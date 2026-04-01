"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-4xl mb-3">&#x26A0;&#xFE0F;</div>
      <h2 className="text-lg font-bold text-[#1A1A1A] mb-2">
        Dashboard Error
      </h2>
      <p className="text-[#8B7355] text-sm mb-6 text-center max-w-sm">
        Something went wrong loading the dashboard. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-[#1A1A1A] text-white font-semibold rounded-xl hover:bg-[#333] transition cursor-pointer"
      >
        Try Again
      </button>
    </div>
  );
}
