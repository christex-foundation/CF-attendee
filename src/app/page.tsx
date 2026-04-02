import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#0A0A0A] relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[#C4A265] opacity-[0.04] blur-[120px]" />

      <div className="relative z-10 w-full max-w-md mx-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 tracking-tight">
          <span className="text-[#C4A265]">Quest</span>Log
        </h1>
        <p className="text-[#666] text-sm mb-10">
          Gamified attendance tracking for the Engineering Cohort
        </p>

        <div className="flex flex-col gap-3 max-w-xs mx-auto">
          <Link
            href="/leaderboard"
            className="w-full py-3 bg-[#C4A265] text-[#1A1A1A] font-bold rounded-xl hover:bg-[#D4B275] transition text-sm text-center"
          >
            View Leaderboard
          </Link>
          <Link
            href="/admin/login"
            className="w-full py-3 bg-[#131313] border border-[#2A2A2A] text-white font-semibold rounded-xl hover:bg-[#1A1A1A] transition text-sm text-center"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
