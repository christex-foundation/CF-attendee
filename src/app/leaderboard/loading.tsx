export default function LeaderboardLoading() {
  return (
    <div className="min-h-dvh bg-[#0A0A0A] flex flex-col items-center">
      {/* Header skeleton */}
      <div className="pt-6 pb-2 text-center px-4">
        <div className="inline-block px-10 py-5 rounded-2xl bg-[#1A1A1A] border border-[#333]">
          <div className="h-7 w-48 bg-[#333] rounded animate-pulse mb-2 mx-auto" />
          <div className="h-3 w-32 bg-[#333] rounded animate-pulse mx-auto" />
        </div>

        {/* Toggle skeleton */}
        <div className="flex items-center justify-center mt-4">
          <div className="h-10 w-48 bg-[#131313] border border-[#2A2A2A] rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Podium skeleton */}
      <div className="flex items-end justify-center gap-3 mt-6 px-4 w-full max-w-lg">
        <div className="flex-1 max-w-[110px]">
          <div className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-[#333] animate-pulse mx-auto mb-2" />
          <div className="h-16 bg-[#1A1A1A] rounded-t-xl animate-pulse" />
        </div>
        <div className="flex-1 max-w-[120px] -mt-4">
          <div className="w-[72px] h-[72px] rounded-full bg-[#1A1A1A] border border-[#333] animate-pulse mx-auto mb-2" />
          <div className="h-20 bg-[#1A1A1A] rounded-t-xl animate-pulse" />
        </div>
        <div className="flex-1 max-w-[110px]">
          <div className="w-14 h-14 rounded-full bg-[#1A1A1A] border border-[#333] animate-pulse mx-auto mb-2" />
          <div className="h-12 bg-[#1A1A1A] rounded-t-xl animate-pulse" />
        </div>
      </div>

      {/* List skeleton */}
      <div className="w-full max-w-lg px-4 mt-4 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-[#131313] border border-[#1E1E1E] rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
