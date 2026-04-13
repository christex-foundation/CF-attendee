"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/Logo";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] flex">
      {/* ─── Sidebar ─── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1A1A1A] text-white rounded-r-3xl sticky top-0 h-screen">
        {/* Brand */}
        <div className="px-6 pt-8 pb-6">
          <Logo size="md" />
          <p className="text-[#777] text-xs mt-2 ml-[42px]">Admin Dashboard</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 space-y-1">
          <p className="text-[#555] text-[10px] font-semibold uppercase tracking-widest px-3 mb-2">General</p>
          <SidebarLink href="/admin" label="Dashboard" icon={<DashboardIcon />} />
          <SidebarLink href="/leaderboard" label="Leaderboard" icon={<LeaderboardIcon />} />
        </nav>

        {/* Footer */}
        <div className="px-4 pb-6">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-[#999] hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
          >
            <LogoutIcon />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden bg-[#1A1A1A] text-white px-4 py-4 flex items-center justify-between">
          <Logo size="sm" />
          <button
            onClick={handleLogout}
            className="text-sm text-[#999] hover:text-white transition cursor-pointer"
          >
            Sign Out
          </button>
        </header>

        <main className="flex-1 flex flex-col min-h-0 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/* ─── Sidebar link component ─── */
function SidebarLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 text-sm text-[#BBB] hover:text-white hover:bg-white/5 rounded-xl transition"
    >
      {icon}
      {label}
    </Link>
  );
}

/* ─── Icons ─── */
function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function LeaderboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
    </svg>
  );
}
