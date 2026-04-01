export default function AdminLoading() {
  return (
    <div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-[#E8E0D8] rounded-2xl animate-pulse" />
        ))}
      </div>

      {/* Tab bar skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-10 w-64 bg-[#E8E0D8] rounded-xl animate-pulse" />
        <div className="h-10 w-32 bg-[#E8E0D8] rounded-xl animate-pulse" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-[#E8E0D8] rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}
