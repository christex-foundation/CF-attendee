"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import StudentAvatar from "@/components/ui/StudentAvatar";
import { getDiceBearUrl } from "@/lib/avatar";

const LeaderboardBackground = dynamic(
  () => import("@/components/leaderboard/LeaderboardBackground"),
  { ssr: false }
);

interface LeaderboardEntry {
  id: number;
  name: string;
  slug: string;
  sessionsPresent: number;
  totalSessions: number;
  challengePoints: number;
  manualPoints: number;
  challengesCompleted: number;
  badges: number;
  streak: number;
  score: number;
  weeklyGain: number;
  rank: number;
}

interface Props {
  entries: LeaderboardEntry[];
  totalSessions: number;
}

/* ─── Helpers ─── */
function nameToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function getWeekLabel(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMonday);
  return monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ─── Floating particles ─── */
function Particles({ width, height }: { width: number; height: number }) {
  const particles = useMemo(() => {
    const p: { cx: number; cy: number; r: number; delay: number; color: string }[] = [];
    for (let i = 0; i < 20; i++) {
      const seed = Math.sin(i * 9301 + 49297) * 49297;
      const rand = seed - Math.floor(seed);
      const seed2 = Math.sin((i + 50) * 9301 + 49297) * 49297;
      const rand2 = seed2 - Math.floor(seed2);
      p.push({
        cx: rand * width,
        cy: rand2 * height,
        r: 1 + rand * 2,
        delay: rand2 * 5,
        color: i % 3 === 0 ? "#C4A265" : i % 3 === 1 ? "#4ADE80" : "#A78BFA",
      });
    }
    return p;
  }, [width, height]);

  return (
    <g>
      {particles.map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r={p.r}
          fill={p.color}
          opacity={0.3}
          className="animate-sparkle"
          style={{ animationDelay: `${p.delay}s` }}
        />
      ))}
    </g>
  );
}

/* ─── Milestone node ─── */
function MilestoneNode({ cx, cy, sessionNum, isStart, isTop }: { cx: number; cy: number; sessionNum: number; isStart: boolean; isTop: boolean }) {
  const isMajor = isStart || isTop || sessionNum % 5 === 0;
  const r = isMajor ? 22 : 10;

  return (
    <g>
      {/* Glow for major */}
      {isMajor && (
        <>
          <circle cx={cx} cy={cy} r={r + 16} fill="none" stroke="#C4A265" strokeWidth={1} opacity={0.1} />
          <circle cx={cx} cy={cy} r={r + 10} fill="none" stroke="#C4A265" strokeWidth={1} opacity={0.15} className="animate-pulse-glow" />
        </>
      )}

      {/* Outer glow ring */}
      <circle cx={cx} cy={cy} r={r + 3} fill={isMajor ? "rgba(196,162,101,0.15)" : "rgba(255,255,255,0.03)"} />

      {/* Main circle */}
      <circle cx={cx} cy={cy} r={r} fill={isMajor ? "#1A1A1A" : "#151515"} stroke={isMajor ? "#C4A265" : "#2A2A2A"} strokeWidth={isMajor ? 2 : 1.5} />

      {/* Inner highlight */}
      {isMajor && (
        <circle cx={cx} cy={cy} r={r - 4} fill="none" stroke="#C4A265" strokeWidth={0.5} opacity={0.3} />
      )}

      {/* Label */}
      {isMajor && !isStart ? (
        <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="#C4A265" fontSize={10} fontWeight={800} fontFamily="Inter, system-ui, sans-serif" letterSpacing="0.5">
          S{sessionNum}
        </text>
      ) : !isStart && !isMajor ? (
        <text
          x={cx + (cx > 290 ? -(r + 14) : r + 14)}
          y={cy + 1}
          textAnchor={cx > 290 ? "end" : "start"}
          dominantBaseline="central"
          fill="rgba(196,162,101,0.25)"
          fontSize={9}
          fontWeight={600}
          fontFamily="Inter, system-ui, sans-serif"
        >
          S{sessionNum}
        </text>
      ) : null}

      {/* XP indicator next to milestones */}
      {isMajor && !isStart && !isTop && (
        <g>
          <rect x={cx + (cx > 290 ? -(r + 52) : r + 8)} y={cy - 8} width={42} height={16} rx={8} fill="rgba(74,222,128,0.1)" stroke="rgba(74,222,128,0.2)" strokeWidth={0.5} />
          <text x={cx + (cx > 290 ? -(r + 31) : r + 29)} y={cy + 1} textAnchor="middle" dominantBaseline="central" fill="#4ADE80" fontSize={7} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">
            +{sessionNum * 10} XP
          </text>
        </g>
      )}

      {/* Start badge */}
      {isStart && (
        <g>
          <rect x={cx - 40} y={cy + r + 14} width={80} height={28} rx={14} fill="#C4A265" />
          <rect x={cx - 40} y={cy + r + 14} width={80} height={28} rx={14} fill="none" stroke="#FFD700" strokeWidth={1} opacity={0.3} />
          <text x={cx} y={cy + r + 29} textAnchor="middle" dominantBaseline="central" fill="#1A1A1A" fontSize={11} fontWeight={900} fontFamily="Inter, system-ui, sans-serif" letterSpacing="1">
            START
          </text>
        </g>
      )}

      {/* Finish badge */}
      {isTop && !isStart && (
        <g>
          <text x={cx} y={cy - r - 20} textAnchor="middle" fontSize={24}>
            &#x1F3C6;
          </text>
          <rect x={cx - 50} y={cy - r - 56} width={100} height={28} rx={14} fill="linear-gradient(90deg, #C4A265, #FFD700)" />
          <rect x={cx - 50} y={cy - r - 56} width={100} height={28} rx={14} fill="#C4A265" />
          <rect x={cx - 50} y={cy - r - 56} width={100} height={28} rx={14} fill="none" stroke="#FFD700" strokeWidth={1} opacity={0.4} />
          <text x={cx} y={cy - r - 41} textAnchor="middle" dominantBaseline="central" fill="#1A1A1A" fontSize={9} fontWeight={900} fontFamily="Inter, system-ui, sans-serif" letterSpacing="1">
            SESSION {sessionNum}
          </text>
        </g>
      )}
    </g>
  );
}

/* ─── Student marker ─── */
function StudentMarker({
  cx,
  cy,
  pathCx,
  pathCy,
  entry,
  onClickAvatar,
}: {
  cx: number;
  cy: number;
  pathCx: number;
  pathCy: number;
  entry: LeaderboardEntry;
  onClickAvatar: (entry: LeaderboardEntry) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isTop3 = entry.rank <= 3;
  const r = isTop3 ? 22 : 16;
  const hue = nameToHue(entry.name);
  const initials = getInitials(entry.name);
  const gradId = `stu-g-${entry.id}`;

  const rankColors: Record<number, { ring: string; glow: string }> = {
    1: { ring: "#FFD700", glow: "rgba(255,215,0,0.3)" },
    2: { ring: "#C0C0C0", glow: "rgba(192,192,192,0.2)" },
    3: { ring: "#CD7F32", glow: "rgba(205,127,50,0.2)" },
  };
  const colors = rankColors[entry.rank] || { ring: "#444", glow: "transparent" };

  const isTethered = Math.abs(cx - pathCx) > 5 || Math.abs(cy - pathCy) > 5;

  const tooltipW = 180;
  const tooltipH = 165;
  const tooltipX = cx - tooltipW / 2;
  const tooltipY = cy - r - tooltipH - 18;

  const attendancePoints = entry.sessionsPresent * 10;

  return (
    <g>
      <g
        className={`${entry.rank === 1 ? "animate-bounce-node" : ""} cursor-pointer`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered(true)}
        onTouchEnd={() => setHovered(false)}
        onClick={() => onClickAvatar(entry)}
      >
          <defs>
            <radialGradient id={gradId} cx="35%" cy="30%" r="65%">
              <stop offset="0%" stopColor={`hsl(${hue}, 50%, 55%)`} />
              <stop offset="100%" stopColor={`hsl(${hue}, 55%, 30%)`} />
            </radialGradient>
            <clipPath id={`clip-${entry.id}`}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
          </defs>

          {/* Tether */}
          {isTethered && (
            <line x1={pathCx} y1={pathCy} x2={cx} y2={cy} stroke="rgba(196,162,101,0.15)" strokeWidth={1} strokeDasharray="4 4" />
          )}

          {/* Outer glow rings for top 3 */}
          {isTop3 && (
            <>
              <circle cx={cx} cy={cy} r={r + 14} fill="none" stroke={colors.ring} strokeWidth={1} opacity={0.1} />
              <circle cx={cx} cy={cy} r={r + 8} fill={colors.glow} />
              <circle cx={cx} cy={cy} r={r + 8} fill="none" stroke={colors.ring} strokeWidth={1.5} opacity={0.3} className="animate-pulse-glow" />
            </>
          )}

          {/* Crown for #1 */}
          {entry.rank === 1 && (
            <text x={cx} y={cy - r - 12} textAnchor="middle" fontSize={18}>
              &#x1F451;
            </text>
          )}

          {/* Shadow */}
          <ellipse cx={cx} cy={cy + r + 4} rx={r * 0.6} ry={3} fill="rgba(0,0,0,0.4)" />

          {/* Ring */}
          <circle cx={cx} cy={cy} r={r + 3} fill={colors.ring} />

          {/* Avatar fallback */}
          <circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} />

          {/* Avatar image */}
          <image
            href={getDiceBearUrl(entry.slug)}
            x={cx - r}
            y={cy - r}
            width={r * 2}
            height={r * 2}
            clipPath={`url(#clip-${entry.id})`}
            preserveAspectRatio="xMidYMid slice"
          />

          {/* Rank badge */}
          <circle cx={cx + r - 2} cy={cy + r - 2} r={isTop3 ? 9 : 8} fill={isTop3 ? colors.ring : "#222"} stroke="#0A0A0A" strokeWidth={2} />
          <text x={cx + r - 2} y={cy + r - 1} textAnchor="middle" dominantBaseline="central" fill={isTop3 ? "#1A1A1A" : "#999"} fontSize={8} fontWeight={900} fontFamily="Inter, system-ui, sans-serif">
            {entry.rank}
          </text>

          {/* Score tag below avatar */}
          <rect x={cx - 20} y={cy + r + 8} width={40} height={16} rx={8} fill="rgba(196,162,101,0.15)" stroke="rgba(196,162,101,0.3)" strokeWidth={0.5} />
          <text x={cx} y={cy + r + 17} textAnchor="middle" dominantBaseline="central" fill="#C4A265" fontSize={7} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">
            {entry.score}pt
          </text>

          {/* Hit area */}
          <circle cx={cx} cy={cy} r={r + 14} fill="transparent" />
        </g>

      {/* ─── Hover tooltip ─── */}
      {hovered && (
        <foreignObject
          x={tooltipX}
          y={tooltipY}
          width={tooltipW}
          height={tooltipH}
          style={{ pointerEvents: "none", overflow: "visible" }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1A1A1A 0%, #111 100%)",
              borderRadius: 16,
              padding: "14px 16px",
              color: "white",
              fontFamily: "Inter, system-ui, sans-serif",
              border: `1.5px solid ${isTop3 ? colors.ring : "#333"}`,
              boxShadow: `0 16px 40px rgba(0,0,0,0.6), 0 0 20px ${isTop3 ? colors.glow : "transparent"}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: `hsl(${hue}, 50%, 40%)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "white",
                border: `2px solid ${isTop3 ? colors.ring : "#444"}`,
              }}>
                {initials}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {entry.name}
                </div>
                <div style={{ fontSize: 9, color: "#666" }}>Rank #{entry.rank}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                <span style={{ color: "#8B7355" }}>Attendance</span>
                <span style={{ fontWeight: 700, color: "#4ADE80" }}>{attendancePoints} pts</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                <span style={{ color: "#8B7355" }}>Challenges</span>
                <span style={{ fontWeight: 700, color: "#A78BFA" }}>{entry.challengePoints} pts</span>
              </div>
              {entry.manualPoints > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                  <span style={{ color: "#8B7355" }}>Bonus</span>
                  <span style={{ fontWeight: 700, color: "#FBBF24" }}>{entry.manualPoints} pts</span>
                </div>
              )}
              {entry.weeklyGain > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                  <span style={{ color: "#8B7355" }}>This week</span>
                  <span style={{ fontWeight: 700, color: "#4ADE80" }}>+{entry.weeklyGain}</span>
                </div>
              )}
              <div style={{ borderTop: "1px solid #2A2A2A", marginTop: 4, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 900, color: "#C4A265" }}>{entry.score} pts</span>
              </div>
            </div>
            <div style={{
              position: "absolute", bottom: -6, left: "50%",
              transform: "translateX(-50%) rotate(45deg)",
              width: 10, height: 10,
              background: "#111",
              borderRight: `1.5px solid ${isTop3 ? colors.ring : "#333"}`,
              borderBottom: `1.5px solid ${isTop3 ? colors.ring : "#333"}`,
            }} />
          </div>
        </foreignObject>
      )}
    </g>
  );
}

/* ─── Main ─── */
export default function LeaderboardClient({ entries, totalSessions }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const mapWidth = 580;
  const nodeSpacingY = 110;
  const centerX = mapWidth / 2;
  const amplitude = 100;
  const topPadding = 140;
  const bottomPadding = 140;

  const pointsStep = 10;
  const safeTotalSessions = Number(totalSessions) || 0;
  const maxScore = entries.length > 0 ? Math.max(...entries.map((e) => Number(e.score) || 0)) : 0;
  const topMilestoneIndex = Math.max(safeTotalSessions, Math.ceil(maxScore / pointsStep), 5);
  const milestoneCount = topMilestoneIndex + 1;
  const totalHeight = topPadding + milestoneCount * nodeSpacingY + bottomPadding;

  const milestones = useMemo(() => {
    return Array.from({ length: milestoneCount }, (_, i) => {
      const cy = totalHeight - bottomPadding - i * nodeSpacingY;
      const cx = centerX + Math.sin((i * Math.PI) / 2.2) * amplitude;
      return { sessionNum: i, cx, cy };
    });
  }, [milestoneCount, totalHeight, centerX, amplitude, bottomPadding, nodeSpacingY]);

  const studentPositions = useMemo(() => {
    // Instead of clustering at exact score positions, distribute students
    // evenly along the road based on their rank order. This prevents
    // overlapping when many students have similar scores.
    const sorted = [...entries].sort((a, b) => b.rank - a.rank); // worst rank first (bottom), best rank last (top)
    const count = sorted.length;

    if (count === 0 || milestones.length < 2) {
      return sorted.map((entry) => ({
        ...entry,
        displayCx: centerX,
        displayCy: totalHeight - bottomPadding,
        pathCx: centerX,
        pathCy: totalHeight - bottomPadding,
      }));
    }

    // Spread students evenly across the first N milestones proportional to their rank
    // Rank 1 = furthest along the road, last rank = near start
    const maxMilestoneIdx = milestones.length - 1;

    return sorted.map((entry, i) => {
      // Map rank-ordered index to a position along the milestones
      // i=0 is worst rank (near start), i=count-1 is rank 1 (near top)
      const t = count === 1 ? 0.5 : i / (count - 1);
      // Use up to 80% of the road so students don't crowd the very top/bottom
      const milestoneIdx = t * maxMilestoneIdx * 0.8;
      const lowerIdx = Math.min(Math.floor(milestoneIdx), maxMilestoneIdx - 1);
      const upperIdx = lowerIdx + 1;
      const fraction = milestoneIdx - lowerIdx;
      const lower = milestones[lowerIdx];
      const upper = milestones[upperIdx];

      const pathCx = lower.cx + (upper.cx - lower.cx) * fraction;
      const pathCy = lower.cy + (upper.cy - lower.cy) * fraction;

      // Offset slightly left/right of the road based on even/odd index
      const side = i % 2 === 0 ? -1 : 1;
      const offsetX = entry.rank <= 3 ? 0 : side * 30; // top 3 stay on the road

      return {
        ...entry,
        displayCx: Math.max(50, Math.min(mapWidth - 50, pathCx + offsetX)),
        displayCy: pathCy,
        pathCx,
        pathCy,
      };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, milestones]);

  function buildRoadPath(x1: number, y1: number, x2: number, y2: number): string {
    const dy = (y2 - y1) * 0.4;
    return `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`;
  }

  useEffect(() => {
    if (containerRef.current && studentPositions.length > 0) {
      const leader = studentPositions.find((s) => s.rank === 1);
      if (leader) {
        containerRef.current.scrollTo({
          top: Math.max(0, leader.displayCy - window.innerHeight / 2),
          behavior: "smooth",
        });
      }
    }
  }, [studentPositions]);

  const weekLabel = getWeekLabel();
  const router = useRouter();

  // View mode toggle
  const [viewMode, setViewMode] = useState<"map" | "table">("table");

  // Slug verification modal state
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null);
  const [slugInput, setSlugInput] = useState("");
  const [slugError, setSlugError] = useState("");
  const [slugLoading, setSlugLoading] = useState(false);

  function handleAvatarClick(entry: LeaderboardEntry) {
    setSelectedStudent(entry);
    setSlugInput("");
    setSlugError("");
  }

  async function handleSlugSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return;
    setSlugError("");

    const trimmed = slugInput.trim().toLowerCase();
    if (!trimmed) {
      setSlugError("Please enter your student ID");
      return;
    }

    if (trimmed !== selectedStudent.slug) {
      setSlugError("Incorrect student ID. Access denied.");
      return;
    }

    setSlugLoading(true);
    router.push(`/student/${selectedStudent.slug}`);
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0A0A0A]">
      <LeaderboardBackground />
      {/* Code matrix background */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage: "url(/code-bg.gif)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.06,
          mixBlendMode: "screen",
        }}
      />
      {/* Ambient glow spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#C4A265] opacity-[0.03] blur-[100px]" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#4ADE80] opacity-[0.02] blur-[80px]" />

      <div className="relative z-10 flex flex-col items-center min-h-screen">
        {/* Header */}
        <div className="pt-8 pb-4 text-center relative z-20 w-full max-w-lg px-4">
          <div className="inline-block px-10 py-5 rounded-2xl bg-[#131313] border border-[#2A2A2A] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4A265] to-transparent opacity-30" />
            <h1 className="text-2xl font-extrabold text-white tracking-wide relative z-10">
              The Race Is On
            </h1>
            <p className="text-[#C4A265] text-xs font-semibold tracking-widest uppercase mt-1 relative z-10">Week of {weekLabel}</p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-center gap-1 mt-4 bg-[#131313] border border-[#2A2A2A] rounded-xl p-1 w-fit mx-auto">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === "table" ? "bg-[#C4A265] text-[#1A1A1A]" : "text-[#666] hover:text-white"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
              Ranking
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${viewMode === "map" ? "bg-[#C4A265] text-[#1A1A1A]" : "text-[#666] hover:text-white"}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 7 8 11.7z" /></svg>
              Map
            </button>
          </div>
        </div>

        {/* ─── TABLE VIEW ─── */}
        {viewMode === "table" && (
          <div className="flex-1 w-full max-w-lg px-4 pb-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <span className="text-4xl">&#x1F3C1;</span>
                <p className="text-[#555] text-lg font-medium">No students yet</p>
              </div>
            ) : (
              <>
                {/* ─── Podium Top 3 ─── */}
                {entries.length >= 1 && (
                  <div className="flex items-end justify-center gap-3 mb-6 pt-4">
                    {/* 2nd place */}
                    {entries.length >= 2 && (
                      <div className="flex flex-col items-center cursor-pointer" onClick={() => handleAvatarClick(entries[1])}>
                        <div className="relative mb-2">
                          <div className="w-14 h-14 rounded-full overflow-hidden" style={{ boxShadow: "0 0 0 3px #C0C0C0, 0 0 0 5px #131313" }}>
                            <StudentAvatar slug={entries[1].slug} name={entries[1].name} size={56} />
                          </div>
                        </div>
                        <p className="text-white text-[11px] font-bold truncate max-w-[80px]">{entries[1].name}</p>
                        <p className="text-[#C4A265] text-[10px] font-semibold">{entries[1].score} pts</p>
                        <div className="w-20 mt-2 rounded-t-xl bg-gradient-to-t from-[#7A7A7A] to-[#C0C0C0] flex items-center justify-center pt-3 pb-4">
                          <span className="text-white text-2xl font-black">2</span>
                        </div>
                      </div>
                    )}

                    {/* 1st place */}
                    <div className="flex flex-col items-center cursor-pointer -mt-4" onClick={() => handleAvatarClick(entries[0])}>
                      <div className="text-2xl mb-1">&#x1F451;</div>
                      <div className="relative mb-2">
                        <div className="absolute inset-0 rounded-full blur-lg opacity-40 bg-[#FFD700]" />
                        <div className="relative w-[72px] h-[72px] rounded-full overflow-hidden" style={{ boxShadow: "0 0 0 3px #FFD700, 0 0 0 5px #131313, 0 0 20px rgba(255,215,0,0.3)" }}>
                          <StudentAvatar slug={entries[0].slug} name={entries[0].name} size={72} />
                        </div>
                      </div>
                      <p className="text-white text-xs font-bold truncate max-w-[90px]">{entries[0].name}</p>
                      <p className="text-[#C4A265] text-[10px] font-semibold">{entries[0].score} pts</p>
                      <div className="w-24 mt-2 rounded-t-xl bg-gradient-to-t from-[#B8860B] to-[#FFD700] flex items-center justify-center pt-4 pb-5">
                        <span className="text-white text-3xl font-black drop-shadow-lg">1</span>
                      </div>
                    </div>

                    {/* 3rd place */}
                    {entries.length >= 3 && (
                      <div className="flex flex-col items-center cursor-pointer" onClick={() => handleAvatarClick(entries[2])}>
                        <div className="relative mb-2">
                          <div className="w-14 h-14 rounded-full overflow-hidden" style={{ boxShadow: "0 0 0 3px #CD7F32, 0 0 0 5px #131313" }}>
                            <StudentAvatar slug={entries[2].slug} name={entries[2].name} size={56} />
                          </div>
                        </div>
                        <p className="text-white text-[11px] font-bold truncate max-w-[80px]">{entries[2].name}</p>
                        <p className="text-[#C4A265] text-[10px] font-semibold">{entries[2].score} pts</p>
                        <div className="w-20 mt-2 rounded-t-xl bg-gradient-to-t from-[#8B4513] to-[#CD7F32] flex items-center justify-center pt-2 pb-3">
                          <span className="text-white text-xl font-black">3</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── Remaining players list ─── */}
                <div className="space-y-2">
                  {entries.slice(3).map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => handleAvatarClick(entry)}
                      className="flex items-center gap-3 bg-[#131313] border border-[#1E1E1E] rounded-2xl px-4 py-3 hover:border-[#2A2A2A] hover:bg-[#161616] transition cursor-pointer group"
                    >
                      {/* Rank */}
                      <span className="text-[#555] text-sm font-bold w-6 text-center">{entry.rank}</span>

                      {/* Avatar */}
                      <StudentAvatar slug={entry.slug} name={entry.name} size={40} className="rounded-xl" />

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-semibold truncate group-hover:text-[#C4A265] transition">{entry.name}</p>
                        {entry.streak > 0 && (
                          <p className="text-[#4ADE80] text-[10px] font-medium">&#x1F525; {entry.streak} streak</p>
                        )}
                      </div>

                      {/* Score */}
                      <div className="text-right shrink-0">
                        <p className="text-[#C4A265] text-sm font-bold">{entry.score}</p>
                        <p className="text-[#444] text-[10px]">pts</p>
                      </div>

                      {/* Weekly gain */}
                      {entry.weeklyGain > 0 && (
                        <span className="text-[#4ADE80] text-[10px] font-bold bg-[#4ADE80]/10 px-2 py-0.5 rounded-full shrink-0">
                          +{entry.weeklyGain}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {entries.length <= 3 && entries.length > 0 && (
                  <p className="text-center text-[#333] text-xs mt-6">More players will appear here as they join</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── MAP VIEW ─── */}
        {viewMode === "map" && (
          <div ref={containerRef} className="flex-1 overflow-y-auto w-full flex justify-center" style={{ maxHeight: "calc(100vh - 220px)" }}>
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <span className="text-4xl">&#x1F3C1;</span>
                <p className="text-[#555] text-lg font-medium">No students yet</p>
              </div>
            ) : (
              <svg viewBox={`0 0 ${mapWidth} ${totalHeight}`} preserveAspectRatio="xMidYMin meet" className="block w-full max-w-[580px]">
                <Particles width={mapWidth} height={totalHeight} />

                {milestones.map((ms, i) => {
                  if (i === 0) return null;
                  const prev = milestones[i - 1];
                  const d = buildRoadPath(prev.cx, prev.cy, ms.cx, ms.cy);
                  return (
                    <g key={`road-${i}`}>
                      <path d={d} fill="none" stroke="#C4A265" strokeWidth={34} strokeLinecap="round" opacity={0.03} />
                      <path d={d} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={30} strokeLinecap="round" />
                      <path d={d} fill="none" stroke="#1A1A1A" strokeWidth={26} strokeLinecap="round" />
                      <path d={d} fill="none" stroke="#C4A265" strokeWidth={28} strokeLinecap="round" opacity={0.04} />
                      <path d={d} fill="none" stroke="#C4A265" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="14 10" opacity={0.2} />
                      <path d={d} fill="none" stroke="#C4A265" strokeWidth={2} strokeLinecap="round" strokeDasharray="4 20" opacity={0.1} className="animate-road-dash" />
                    </g>
                  );
                })}

                {milestones.map((ms, i) => (
                  <MilestoneNode key={ms.sessionNum} cx={ms.cx} cy={ms.cy} sessionNum={ms.sessionNum} isStart={i === 0} isTop={i === milestones.length - 1} />
                ))}

                {[...studentPositions]
                  .sort((a, b) => b.rank - a.rank)
                  .map((sp) => (
                    <StudentMarker
                      key={sp.id}
                      cx={sp.displayCx}
                      cy={sp.displayCy}
                      pathCx={sp.pathCx}
                      pathCy={sp.pathCy}
                      entry={sp}
                      onClickAvatar={handleAvatarClick}
                    />
                  ))}
              </svg>
            )}
          </div>
        )}

        <div className="py-4 relative z-20">
          <Link href="/" className="text-[#444] text-sm hover:text-[#C4A265] transition">Back to Home</Link>
        </div>
      </div>

      {/* ─── Slug Verification Modal ─── */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[420px] mx-4 px-8 py-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Access Dashboard</h2>

            <form onSubmit={handleSlugSubmit} className="space-y-6">
              {slugError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-2xl">
                  {slugError}
                </div>
              )}

              <div>
                <label className="block text-base font-medium text-[#B8975C] mb-2">
                  Student ID
                </label>
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => {
                    setSlugInput(e.target.value);
                    setSlugError("");
                  }}
                  placeholder="Enter student ID"
                  className="w-full px-5 py-4 border-2 border-[#C4A265] rounded-2xl focus:ring-2 focus:ring-[#C4A265] focus:border-[#C4A265] outline-none transition text-[#1A1A1A] bg-[#FDF8F0] text-base placeholder-[#C4B99A]"
                  autoFocus
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="flex-1 py-4 border-2 border-[#E8E0D8] text-[#8B7355] font-medium rounded-2xl hover:bg-[#F5F0EB] transition cursor-pointer text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={slugLoading}
                  className="flex-1 py-4 bg-[#1A1A1A] text-white font-bold rounded-2xl hover:bg-[#333] transition disabled:opacity-50 cursor-pointer text-base"
                >
                  {slugLoading ? "Loading..." : "Access Dashboard"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
