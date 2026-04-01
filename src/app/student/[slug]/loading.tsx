export default function StudentLoading() {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex flex-col items-center">
      {/* Header skeleton */}
      <div className="pt-6 pb-2 text-center px-4 w-full max-w-[560px]">
        <div className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-[#1A1A1A] border border-[#333]">
          <div className="w-12 h-12 rounded-full bg-[#333] animate-pulse" />
          <div>
            <div className="h-6 w-32 bg-[#333] rounded animate-pulse mb-2" />
            <div className="h-3 w-24 bg-[#333] rounded animate-pulse" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className="h-8 w-20 bg-[#1A1A1A] border border-[#333] rounded-full animate-pulse" />
          <div className="h-8 w-16 bg-[#1A1A1A] border border-[#333] rounded-full animate-pulse" />
        </div>

        {/* Progress bar skeleton */}
        <div className="mt-3 w-full max-w-xs mx-auto">
          <div className="h-2 bg-[#1A1A1A] rounded-full border border-[#333] animate-pulse" />
        </div>
      </div>

      {/* Map skeleton */}
      <div className="flex-1 w-full max-w-[520px] px-2 mt-4">
        <div className="space-y-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[#1A1A1A] border border-[#333] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
