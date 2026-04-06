"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import StudentAvatar from "@/components/ui/StudentAvatar";

const ThreeBackground = dynamic(
  () => import("@/components/student/ThreeBackground"),
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
  avatarUrl?: string | null;
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

function starPoints(cx: number, cy: number, r: number): string {
  const inner = r * 0.45;
  const points: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = (Math.PI / 2) + (i * 2 * Math.PI) / 5;
    const innerAngle = outerAngle + Math.PI / 5;
    points.push(`${cx + r * Math.cos(outerAngle)},${cy - r * Math.sin(outerAngle)}`);
    points.push(`${cx + inner * Math.cos(innerAngle)},${cy - inner * Math.sin(innerAngle)}`);
  }
  return points.join(" ");
}

/* ─── Candy decorations ─── */
function Lollipop({ x, y, color, size = 1 }: { x: number; y: number; color: string; size?: number }) {
  const s = 10 * size;
  return (
    <g className="animate-float-candy" style={{ animationDelay: `${x % 3}s` }}>
      <line x1={x} y1={y + s} x2={x} y2={y + s + 16 * size} stroke="#8B7355" strokeWidth={2.5 * size} strokeLinecap="round" />
      <circle cx={x} cy={y + s * 0.3} r={s} fill={color} opacity={0.4} />
      <circle cx={x} cy={y + s * 0.3} r={s * 0.55} fill="none" stroke="white" strokeWidth={1.5 * size} opacity={0.12} />
    </g>
  );
}

function CandyCane({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  const scaleX = flip ? -1 : 1;
  return (
    <g transform={`translate(${x},${y}) scale(${scaleX},1)`} opacity={0.25}>
      <path d="M0 35 L0 10 A10 10 0 0 1 20 10" fill="none" stroke="#C4A265" strokeWidth={4} strokeLinecap="round" />
      <path d="M0 30 L0 10 A10 10 0 0 1 20 10" fill="none" stroke="white" strokeWidth={4} strokeDasharray="5 5" strokeLinecap="round" opacity={0.25} />
    </g>
  );
}

function Star4({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <g className="animate-sparkle" style={{ animationDelay: `${(x + y) % 4}s` }}>
      <polygon
        points={`${x},${y - size} ${x + size * 0.3},${y - size * 0.3} ${x + size},${y} ${x + size * 0.3},${y + size * 0.3} ${x},${y + size} ${x - size * 0.3},${y + size * 0.3} ${x - size},${y} ${x - size * 0.3},${y - size * 0.3}`}
        fill={color}
        opacity={0.7}
      />
    </g>
  );
}

function CandyLandscape({ width, height }: { width: number; height: number }) {
  const hills = useMemo(() => {
    const result: { d: string; fill: string; opacity: number }[] = [];
    const step = 400;
    for (let y = 100; y < height; y += step) {
      result.push({
        d: `M0 ${y + 60} Q${width * 0.25} ${y - 30} ${width * 0.5} ${y + 40} Q${width * 0.75} ${y + 110} ${width} ${y + 30} L${width} ${y + 150} L0 ${y + 150} Z`,
        fill: "#C4A265",
        opacity: 0.03,
      });
    }
    return result;
  }, [width, height]);

  return (
    <g>
      {hills.map((hill, i) => (
        <path key={i} d={hill.d} fill={hill.fill} opacity={hill.opacity} />
      ))}
    </g>
  );
}

/* ─── Rank node (candy style) ─── */
function RankNode({
  cx,
  cy,
  entry,
  nodeRadius,
  onClick,
  onHover,
}: {
  cx: number;
  cy: number;
  entry: LeaderboardEntry;
  nodeRadius: number;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}) {
  const isTop3 = entry.rank <= 3;
  const r = nodeRadius;
  const gradId = `rank-grad-${entry.id}`;
  const clipId = `rank-clip-${entry.id}`;

  const rankConfigs: Record<number, { outer: string; fill: string; gradLight: string; gradDark: string; stroke: string; shadow: string }> = {
    1: { outer: "#FFD700", fill: "#FF8C00", gradLight: "#FFBF47", gradDark: "#E07000", stroke: "#CC6600", shadow: "#B85C00" },
    2: { outer: "#C0C0C0", fill: "#8A8A8A", gradLight: "#D0D0D0", gradDark: "#6A6A6A", stroke: "#555", shadow: "#444" },
    3: { outer: "#CD7F32", fill: "#A0622A", gradLight: "#D49A56", gradDark: "#8B4513", stroke: "#6B3410", shadow: "#5A2D0E" },
  };
  const c = rankConfigs[entry.rank] || { outer: "#8B7AA0", fill: "#6B5B7B", gradLight: "#9B8AAB", gradDark: "#5A4A6A", stroke: "#4A3A5A", shadow: "#3A2A4A" };

  return (
    <g>
      <g
        className={`${entry.rank === 1 ? "animate-bounce-node" : ""} cursor-pointer`}
        onClick={onClick}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={() => onHover(false)}
        onTouchStart={() => onHover(true)}
        onTouchEnd={() => onHover(false)}
      >
        <defs>
          <radialGradient id={gradId} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor={c.gradLight} />
            <stop offset="70%" stopColor={c.fill} />
            <stop offset="100%" stopColor={c.gradDark} />
          </radialGradient>
          <clipPath id={clipId}>
            <circle cx={cx} cy={cy} r={r - 2} />
          </clipPath>
        </defs>

        {/* Hit area */}
        <circle cx={cx} cy={cy} r={r + 14} fill="transparent" />

        {/* Crown / trophy for top 3 */}
        {entry.rank === 1 && (
          <text x={cx} y={cy - r - 14} textAnchor="middle" fontSize={16}>&#x1F451;</text>
        )}

        {/* Glow ring for top 3 */}
        {isTop3 && (
          <circle cx={cx} cy={cy} r={r + 10} fill="none" stroke={c.outer} strokeWidth={2} opacity={0.4} className="animate-pulse-glow" />
        )}

        {/* Shadow underneath */}
        <ellipse cx={cx} cy={cy + r + 3} rx={r * 0.6} ry={3} fill={c.shadow} opacity={0.3} />

        {/* Outer ring (candy border) */}
        <circle cx={cx} cy={cy} r={r + 3} fill={c.outer} stroke={c.stroke} strokeWidth={1.5} />

        {/* Main glossy circle */}
        <circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} stroke={c.stroke} strokeWidth={2} />

        {/* Avatar image */}
        <image
          href={entry.avatarUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(entry.slug)}`}
          x={cx - r + 2}
          y={cy - r + 2}
          width={(r - 2) * 2}
          height={(r - 2) * 2}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Shine highlight */}
        <ellipse cx={cx - r * 0.25} cy={cy - r * 0.3} rx={r * 0.35} ry={r * 0.25} fill="white" opacity={0.2} transform={`rotate(-20 ${cx - r * 0.25} ${cy - r * 0.3})`} />

        {/* Rank badge */}
        <circle cx={cx + r - 1} cy={cy + r - 1} r={isTop3 ? 9 : 7} fill={isTop3 ? c.outer : "#222"} stroke="#0A0A0A" strokeWidth={1.5} />
        <text x={cx + r - 1} y={cy + r} textAnchor="middle" dominantBaseline="central" fill={isTop3 ? "#1A1A1A" : "#999"} fontSize={isTop3 ? 8 : 7} fontWeight={900} fontFamily="Inter, system-ui, sans-serif">
          {entry.rank}
        </text>

        {/* Name + score tag below */}
        <text x={cx} y={cy + r + 14} textAnchor="middle" dominantBaseline="central" fill="white" fontSize={isTop3 ? 9 : 8} fontWeight={700} fontFamily="Inter, system-ui, sans-serif" opacity={0.9}>
          {entry.name.length > 10 ? entry.name.slice(0, 9) + "..." : entry.name}
        </text>
        <text x={cx} y={cy + r + 26} textAnchor="middle" dominantBaseline="central" fill="#C4A265" fontSize={7} fontWeight={700} fontFamily="Inter, system-ui, sans-serif">
          {entry.score}pt
        </text>

        {/* Stars for top 3 */}
        {isTop3 && (
          <g>
            {Array.from({ length: 4 - entry.rank }).map((_, si) => (
              <polygon key={si} points={starPoints(cx - 10 + si * 10, cy - r - 6, 4)} fill="#FFD700" stroke="#CC8800" strokeWidth={0.5} />
            ))}
          </g>
        )}
      </g>

    </g>
  );
}

/* ─── Main ─── */
export default function LeaderboardClient({ entries }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const weekLabel = getWeekLabel();

  // Detect desktop + window size for responsive layout
  const [isDesktop, setIsDesktop] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mql.matches);
    const handleMql = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener("change", handleMql);

    const updateSize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    updateSize();
    window.addEventListener("resize", updateSize);

    return () => {
      mql.removeEventListener("change", handleMql);
      window.removeEventListener("resize", updateSize);
    };
  }, []);

  const isNarrow = !isDesktop && windowSize.width > 0 && windowSize.width < 400;
  const count = entries.length;

  // Sort by rank descending (worst rank at bottom, rank 1 at top)
  const sorted = useMemo(() => [...entries].sort((a, b) => b.rank - a.rank), [entries]);

  // Scale node radius based on student count
  const nodeRadius = count > 60 ? 16 : count > 30 ? 20 : count > 15 ? 24 : 28;

  // Compute layout — desktop: landscape snake, mobile: vertical scroll
  const topPadding = 130;
  const bottomPadding = 120;

  const layout = useMemo(() => {
    if (isDesktop && windowSize.width > 0) {
      // Desktop: landscape snake layout — grows as students progress
      const mw = windowSize.width;
      const pad = { x: 90, top: 5, bottom: 80 };
      const usableW = mw - pad.x * 2;

      const nodesPerRow = Math.max(3, Math.min(sorted.length, Math.round(usableW / 140)));
      const rowSpacingFixed = 180; // fixed comfortable spacing between rows
      const colSpacing = nodesPerRow > 1 ? usableW / (nodesPerRow - 1) : 0;
      const numRows = Math.ceil(sorted.length / nodesPerRow);

      const th = pad.top + numRows * rowSpacingFixed + pad.bottom;

      const n = sorted.map((entry, index) => {
        const row = Math.floor(index / nodesPerRow);
        const posInRow = index % nodesPerRow;
        const isReversed = row % 2 === 1;
        const col = isReversed ? (nodesPerRow - 1 - posInRow) : posInRow;

        const t = nodesPerRow > 2 ? posInRow / (nodesPerRow - 1) : 0.5;
        const wave = Math.sin(t * Math.PI) * (rowSpacingFixed * 0.25);

        const cx = pad.x + col * colSpacing;
        const cy = th - pad.bottom - row * rowSpacingFixed + wave;

        return { ...entry, cx, cy };
      });

      return { mapWidth: mw, totalHeight: th, centerX: mw / 2, nodes: n };
    } else {
      // Mobile: original vertical scroll layout
      const mw = 520;
      const nodeSpacingY = count > 60 ? 55 : count > 30 ? 70 : count > 15 ? 85 : 100;
      const amp = isNarrow ? 100 : 130;
      const th = topPadding + Math.max(count, 1) * nodeSpacingY + bottomPadding;

      const n = sorted.map((entry, index) => {
        const cy = th - bottomPadding - index * nodeSpacingY;
        const cx = mw / 2 + Math.sin((index * Math.PI) / 2.2 - Math.PI / 2) * amp;
        return { ...entry, cx, cy };
      });

      return { mapWidth: mw, totalHeight: th, centerX: mw / 2, nodes: n };
    }
  }, [isDesktop, windowSize.width, windowSize.height, sorted, count, isNarrow, topPadding, bottomPadding]);

  const { mapWidth, totalHeight, centerX, nodes } = layout;

  function buildRoadPath(x1: number, y1: number, x2: number, y2: number): string {
    const dx = x2 - x1;
    const dy = y2 - y1;

    if (Math.abs(dx) > Math.abs(dy)) {
      const cdx = dx * 0.4;
      return `M${x1},${y1} C${x1 + cdx},${y1} ${x2 - cdx},${y2} ${x2},${y2}`;
    } else {
      const cdy = dy * 0.4;
      return `M${x1},${y1} C${x1},${y1 + cdy} ${x2},${y2 - cdy} ${x2},${y2}`;
    }
  }

  // Candy decorations (spaced out to avoid clutter)
  const decorations = useMemo(() => {
    function seededRandom(seed: number): number {
      const x = Math.sin(seed * 9301 + 49297) * 49297;
      return x - Math.floor(x);
    }

    const decos: React.ReactNode[] = [];
    const step = count > 50 ? 6 : count > 20 ? 4 : 3;
    nodes.forEach((node, i) => {
      if (i % step !== 0) return;
      const side = i % 2 === 0 ? 1 : -1;
      const offsetX = side * (70 + seededRandom(i) * 30);

      if (i % (step * 2) === 0) {
        const colors = ["#C4A265", "#FFD700", "#4ADE80", "#A78BFA"];
        decos.push(
          <Lollipop key={`lollipop-${i}`} x={node.cx + offsetX} y={node.cy - 15} color={colors[i % colors.length]} size={0.7 + seededRandom(i + 100) * 0.3} />
        );
      }
      if (i % (step * 2) === step) {
        decos.push(
          <CandyCane key={`cane-${i}`} x={node.cx + offsetX * 0.7} y={node.cy - 8} flip={side < 0} />
        );
      }
      decos.push(
        <Star4 key={`star-${i}`} x={node.cx + offsetX * 0.4} y={node.cy - 25 - seededRandom(i + 200) * 15} size={4 + seededRandom(i + 300) * 3} color={i % 2 === 0 ? "#C4A265" : "#FFD700"} />
      );
    });
    return decos;
  }, [nodes, count]);

  // View mode toggle
  const [viewMode, setViewMode] = useState<"map" | "ranking">("ranking");

  // Hovered node for map tooltip (rendered as top-level overlay so it's never obscured)
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  const hoveredNode = hoveredNodeId !== null ? nodes.find((n) => n.id === hoveredNodeId) : null;

  // Scroll to rank 1 when map view is shown
  useEffect(() => {
    if (viewMode !== "map") return;
    // Small delay to let the map container mount and the SVG render
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container || nodes.length === 0) return;
      const leader = nodes.find((n) => n.rank === 1);
      if (!leader) return;
      const svgEl = container.querySelector("svg");
      if (!svgEl) return;
      const scale = svgEl.clientHeight / totalHeight;
      const nodePixelY = leader.cy * scale;
      const scrollTarget = nodePixelY - container.clientHeight / 2;
      container.scrollTo({ top: Math.max(0, scrollTarget), behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [viewMode, nodes, totalHeight]);

  // Slug verification modal
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
    if (!trimmed) { setSlugError("Please enter your student ID"); return; }
    if (trimmed !== selectedStudent.slug) { setSlugError("Incorrect student ID. Access denied."); return; }
    setSlugLoading(true);
    router.push(`/student/${selectedStudent.slug}`);
  }

  return (
    <div className="min-h-dvh relative overflow-hidden bg-[#0A0A0A]">
      <ThreeBackground />

      <div className="relative z-10 flex flex-col items-center min-h-dvh">
        {/* Header */}
        <div className="pt-6 pb-2 text-center relative z-20 px-4 w-full max-w-[560px] mx-auto shrink-0">
          <div className="inline-block px-6 sm:px-10 py-4 sm:py-5 rounded-2xl bg-[#1A1A1A] border border-[#333] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C4A265] to-transparent opacity-30" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide relative z-10">
              The Race Is On
            </h1>
            <p className="text-[#C4A265] text-[10px] sm:text-xs font-semibold tracking-widest uppercase mt-1 relative z-10">Week of {weekLabel}</p>
          </div>

        </div>

        {/* ─── RANKING VIEW ─── */}
        {viewMode === "ranking" && (
          <div className="flex-1 w-full max-w-lg px-3 sm:px-4 pb-6 overflow-y-auto candy-scroll" style={{ maxHeight: "calc(100dvh - 200px)" }}>
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <span className="text-4xl">&#x1F3C1;</span>
                <p className="text-[#555] text-lg font-medium">No students yet</p>
              </div>
            ) : (
              <>
                {/* Podium Top 3 */}
                {count >= 1 && (
                  <div className="flex items-end justify-center gap-2 sm:gap-3 mb-5 pt-4 px-2">
                    {/* 2nd place */}
                    {count >= 2 && (
                      <div className="flex flex-col items-center cursor-pointer flex-1 max-w-[110px]" onClick={() => handleAvatarClick(entries[1])}>
                        <div className="relative mb-1.5">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden" style={{ boxShadow: "0 0 0 3px #C0C0C0, 0 0 0 5px #131313" }}>
                            <StudentAvatar slug={entries[1].slug} name={entries[1].name} size={56} avatarUrl={entries[1].avatarUrl} />
                          </div>
                        </div>
                        <p className="text-white text-[10px] sm:text-[11px] font-bold truncate w-full text-center">{entries[1].name}</p>
                        <p className="text-[#C4A265] text-[9px] sm:text-[10px] font-semibold">{entries[1].score} pts</p>
                        <div className="w-full mt-1.5 rounded-t-xl bg-gradient-to-t from-[#7A7A7A] to-[#C0C0C0] flex items-center justify-center pt-3 pb-4">
                          <span className="text-white text-xl sm:text-2xl font-black">2</span>
                        </div>
                      </div>
                    )}

                    {/* 1st place */}
                    <div className="flex flex-col items-center cursor-pointer flex-1 max-w-[120px] -mt-4" onClick={() => handleAvatarClick(entries[0])}>
                      <div className="text-xl sm:text-2xl mb-1">&#x1F451;</div>
                      <div className="relative mb-1.5">
                        <div className="absolute inset-0 rounded-full blur-lg opacity-40 bg-[#FFD700]" />
                        <div className="relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full overflow-hidden" style={{ boxShadow: "0 0 0 3px #FFD700, 0 0 0 5px #131313, 0 0 20px rgba(255,215,0,0.3)" }}>
                          <StudentAvatar slug={entries[0].slug} name={entries[0].name} size={72} avatarUrl={entries[0].avatarUrl} />
                        </div>
                      </div>
                      <p className="text-white text-[11px] sm:text-xs font-bold truncate w-full text-center">{entries[0].name}</p>
                      <p className="text-[#C4A265] text-[9px] sm:text-[10px] font-semibold">{entries[0].score} pts</p>
                      <div className="w-full mt-1.5 rounded-t-xl bg-gradient-to-t from-[#B8860B] to-[#FFD700] flex items-center justify-center pt-4 pb-5">
                        <span className="text-white text-2xl sm:text-3xl font-black drop-shadow-lg">1</span>
                      </div>
                    </div>

                    {/* 3rd place */}
                    {count >= 3 && (
                      <div className="flex flex-col items-center cursor-pointer flex-1 max-w-[110px]" onClick={() => handleAvatarClick(entries[2])}>
                        <div className="relative mb-1.5">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden" style={{ boxShadow: "0 0 0 3px #CD7F32, 0 0 0 5px #131313" }}>
                            <StudentAvatar slug={entries[2].slug} name={entries[2].name} size={56} avatarUrl={entries[2].avatarUrl} />
                          </div>
                        </div>
                        <p className="text-white text-[10px] sm:text-[11px] font-bold truncate w-full text-center">{entries[2].name}</p>
                        <p className="text-[#C4A265] text-[9px] sm:text-[10px] font-semibold">{entries[2].score} pts</p>
                        <div className="w-full mt-1.5 rounded-t-xl bg-gradient-to-t from-[#8B4513] to-[#CD7F32] flex items-center justify-center pt-2 pb-3">
                          <span className="text-white text-lg sm:text-xl font-black">3</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Remaining players list */}
                <div className="space-y-1.5 sm:space-y-2">
                  {entries.slice(3).map((entry) => (
                    <div
                      key={entry.id}
                      onClick={() => handleAvatarClick(entry)}
                      className="flex items-center gap-2 sm:gap-3 bg-[#131313] border border-[#1E1E1E] rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 hover:border-[#2A2A2A] hover:bg-[#161616] transition cursor-pointer group active:scale-[0.98]"
                    >
                      <span className="text-[#555] text-xs sm:text-sm font-bold w-5 sm:w-6 text-center shrink-0">{entry.rank}</span>
                      <div className="shrink-0 w-9 h-9 sm:w-10 sm:h-10">
                        <StudentAvatar slug={entry.slug} name={entry.name} size={40} className="rounded-xl w-full h-full" avatarUrl={entry.avatarUrl} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs sm:text-sm font-semibold truncate group-hover:text-[#C4A265] transition">{entry.name}</p>
                        {entry.streak > 0 && (
                          <p className="text-[#4ADE80] text-[9px] sm:text-[10px] font-medium">&#x1F525; {entry.streak} streak</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[#C4A265] text-xs sm:text-sm font-bold">{entry.score}</p>
                        <p className="text-[#444] text-[9px] sm:text-[10px]">pts</p>
                      </div>
                      {entry.weeklyGain > 0 && (
                        <span className="text-[#4ADE80] text-[9px] sm:text-[10px] font-bold bg-[#4ADE80]/10 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0 hidden sm:inline">
                          +{entry.weeklyGain}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {count <= 3 && count > 0 && (
                  <p className="text-center text-[#333] text-xs mt-6">More players will appear here as they join</p>
                )}
              </>
            )}
          </div>
        )}

        {/* ─── MAP VIEW ─── */}
        {viewMode === "map" && (
        <div
          ref={containerRef}
          className={`flex-1 w-full overflow-y-auto candy-scroll ${
            isDesktop ? "" : "flex justify-center"
          }`}
          style={{ maxHeight: isDesktop ? "calc(100dvh - 120px)" : "calc(100dvh - 200px)" }}
        >
          <div ref={svgContainerRef} className={isDesktop ? "w-full" : "w-full px-2 max-w-[520px]"}>
            {count === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <span className="text-4xl">&#x1F3C1;</span>
                <p className="text-[#555] text-lg font-medium">No students yet</p>
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${mapWidth} ${totalHeight}`}
                preserveAspectRatio="xMidYMin meet"
                className="w-full block"
              >
                <CandyLandscape width={mapWidth} height={totalHeight} />

                {/* START badge at first node */}
                {nodes.length > 0 && (
                  <g>
                    <rect x={nodes[0].cx - 35} y={nodes[0].cy + nodeRadius + 20} width={70} height={24} rx={12} fill="#C4A265" />
                    <text x={nodes[0].cx} y={nodes[0].cy + nodeRadius + 33} textAnchor="middle" dominantBaseline="central" fill="#1A1A1A" fontSize={10} fontWeight={900} fontFamily="Inter, system-ui, sans-serif" letterSpacing="1">
                      START
                    </text>
                  </g>
                )}

                {/* Road ahead — short fading continuation beyond last student */}
                {nodes.length > 0 && (() => {
                  const last = nodes[nodes.length - 1];
                  const lastIndex = sorted.length - 1;
                  const pts: { cx: number; cy: number }[] = [{ cx: last.cx, cy: last.cy }];

                  for (let g = 1; g <= 5; g++) {
                    const gi = lastIndex + g;
                    if (isDesktop && windowSize.width > 0) {
                      const usableW = mapWidth - 90 * 2;
                      const npr = Math.max(3, Math.min(sorted.length, Math.round(usableW / 140)));
                      const colSp = npr > 1 ? usableW / (npr - 1) : 0;
                      const row = Math.floor(gi / npr);
                      const posInRow = gi % npr;
                      const rev = row % 2 === 1;
                      const col = rev ? (npr - 1 - posInRow) : posInRow;
                      const t = npr > 2 ? posInRow / (npr - 1) : 0.5;
                      const wave = Math.sin(t * Math.PI) * (180 * 0.25);
                      pts.push({ cx: 90 + col * colSp, cy: totalHeight - 80 - row * 180 + wave });
                    } else {
                      const nsy = count > 60 ? 55 : count > 30 ? 70 : count > 15 ? 85 : 100;
                      const amp = isNarrow ? 100 : 130;
                      pts.push({
                        cx: mapWidth / 2 + Math.sin((gi * Math.PI) / 2.2 - Math.PI / 2) * amp,
                        cy: totalHeight - bottomPadding - gi * nsy,
                      });
                    }
                  }

                  return (
                    <g>
                      {pts.map((pt, i) => {
                        if (i === 0) return null;
                        const prev = pts[i - 1];
                        const d = buildRoadPath(prev.cx, prev.cy, pt.cx, pt.cy);
                        const fade = 1 - (i / pts.length) * 0.6;
                        return (
                          <g key={`ghost-${i}`} opacity={fade * 0.7}>
                            <path d={d} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth={32} strokeLinecap="round" />
                            <path d={d} fill="none" stroke="#3A3A3A" strokeWidth={24} strokeLinecap="round" />
                            <path d={d} fill="none" stroke="#C4A265" strokeWidth={26} strokeLinecap="round" opacity={0.1} />
                            <path d={d} fill="none" stroke="#4A4A4A" strokeWidth={24} strokeLinecap="round" opacity={0.25} />
                            <path d={d} fill="none" stroke="#C4A265" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="14 10" opacity={0.4} className="animate-road-dash" />
                          </g>
                        );
                      })}
                    </g>
                  );
                })()}

                {/* Road segments */}
                {nodes.map((node, i) => {
                  if (i === 0) return null;
                  const prev = nodes[i - 1];
                  const d = buildRoadPath(prev.cx, prev.cy, node.cx, node.cy);
                  return (
                    <g key={`road-${node.id}`}>
                      <path d={d} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth={32} strokeLinecap="round" />
                      <path d={d} fill="none" stroke="#3A3A3A" strokeWidth={24} strokeLinecap="round" />
                      <path d={d} fill="none" stroke="#C4A265" strokeWidth={26} strokeLinecap="round" opacity={0.1} />
                      <path d={d} fill="none" stroke="#4A4A4A" strokeWidth={24} strokeLinecap="round" opacity={0.25} />
                      <path d={d} fill="none" stroke="#C4A265" strokeWidth={1.5} strokeLinecap="round" strokeDasharray="14 10" opacity={0.4} className="animate-road-dash" />
                    </g>
                  );
                })}

                {/* Decorations */}
                <g aria-hidden="true">{decorations}</g>

                {/* Student nodes (render worst rank first so top ranks are on top) */}
                {nodes.map((node) => (
                  <RankNode
                    key={node.id}
                    cx={node.cx}
                    cy={node.cy}
                    entry={node}
                    nodeRadius={nodeRadius}
                    onClick={() => handleAvatarClick(node)}
                    onHover={(h) => setHoveredNodeId(h ? node.id : null)}
                  />
                ))}

                {/* Tooltip overlay — rendered last so it's always on top */}
                {hoveredNode && (() => {
                  const e = hoveredNode;
                  const r = nodeRadius;
                  const tooltipW = 180;
                  const tooltipH = 165;
                  const tooltipX = Math.max(5, Math.min(e.cx - tooltipW / 2, mapWidth - tooltipW - 5));
                  const fitsAbove = e.cy - r - tooltipH - 20 >= 0;
                  const tooltipY = fitsAbove ? e.cy - r - tooltipH - 20 : e.cy + r + 20;
                  const isTop3 = e.rank <= 3;
                  const rankConfigs: Record<number, { outer: string }> = {
                    1: { outer: "#FFD700" }, 2: { outer: "#C0C0C0" }, 3: { outer: "#CD7F32" },
                  };
                  const borderColor = rankConfigs[e.rank]?.outer || "#333";
                  const hue = nameToHue(e.name);
                  const initials = getInitials(e.name);
                  const attendancePoints = e.sessionsPresent * 10;

                  return (
                    <foreignObject x={tooltipX} y={tooltipY} width={tooltipW} height={tooltipH} style={{ pointerEvents: "none", overflow: "visible" }}>
                      <div style={{
                        background: "linear-gradient(135deg, #1A1A1A 0%, #111 100%)",
                        borderRadius: 16, padding: "14px 16px", color: "white",
                        fontFamily: "Inter, system-ui, sans-serif",
                        border: `1.5px solid ${borderColor}`,
                        boxShadow: `0 16px 40px rgba(0,0,0,0.6)`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <img
                            src={e.avatarUrl || `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(e.slug)}`}
                            alt={initials}
                            style={{
                              width: 28, height: 28, borderRadius: "50%",
                              objectFit: "cover",
                              border: `2px solid ${isTop3 ? borderColor : "#444"}`,
                            }}
                          />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.name}</div>
                            <div style={{ fontSize: 9, color: "#666" }}>Rank #{e.rank}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                            <span style={{ color: "#8B7355" }}>Attendance</span>
                            <span style={{ fontWeight: 700, color: "#4ADE80" }}>{attendancePoints} pts</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                            <span style={{ color: "#8B7355" }}>Challenges</span>
                            <span style={{ fontWeight: 700, color: "#A78BFA" }}>{e.challengePoints} pts</span>
                          </div>
                          {e.manualPoints > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                              <span style={{ color: "#8B7355" }}>Bonus</span>
                              <span style={{ fontWeight: 700, color: "#FBBF24" }}>{e.manualPoints} pts</span>
                            </div>
                          )}
                          {e.streak > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10 }}>
                              <span style={{ color: "#8B7355" }}>Streak</span>
                              <span style={{ fontWeight: 700, color: "#FF8C00" }}>&#x1F525; {e.streak}</span>
                            </div>
                          )}
                          <div style={{ borderTop: "1px solid #2A2A2A", marginTop: 4, paddingTop: 6, display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                            <span style={{ fontWeight: 700 }}>Total</span>
                            <span style={{ fontWeight: 900, color: "#C4A265" }}>{e.score} pts</span>
                          </div>
                        </div>
                      </div>
                    </foreignObject>
                  );
                })()}
              </svg>
            )}
          </div>
        </div>
        )}

        <div className="py-3 relative z-20">
          <Link href="/admin/login" className="text-[#444] text-sm hover:text-[#C4A265] transition">Admin</Link>
        </div>
      </div>

      {/* Floating view toggle FAB */}
      <button
        onClick={() => setViewMode(viewMode === "ranking" ? "map" : "ranking")}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-[#C4A265] text-[#1A1A1A] shadow-lg shadow-black/40 hover:bg-[#D4B275] active:scale-95 transition-all cursor-pointer font-semibold text-sm"
      >
        {viewMode === "ranking" ? (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="10" r="3" /><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 10-16 0c0 3 2.7 7 8 11.7z" /></svg>
            Map
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
            Ranking
          </>
        )}
      </button>

      {/* Slug Verification Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-[420px] sm:mx-4 px-6 sm:px-8 py-6 sm:py-8 animate-slide-up sm:animate-none" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-4 sm:mb-6">Access Dashboard</h2>
            <form onSubmit={handleSlugSubmit} className="space-y-4 sm:space-y-6">
              {slugError && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-2xl">{slugError}</div>
              )}
              <div>
                <label className="block text-sm sm:text-base font-medium text-[#B8975C] mb-2">Student ID</label>
                <input
                  type="text"
                  value={slugInput}
                  onChange={(e) => { setSlugInput(e.target.value); setSlugError(""); }}
                  placeholder="Enter student ID"
                  className="w-full px-4 sm:px-5 py-3 sm:py-4 border-2 border-[#C4A265] rounded-2xl focus:ring-2 focus:ring-[#C4A265] focus:border-[#C4A265] outline-none transition text-[#1A1A1A] bg-[#FDF8F0] text-sm sm:text-base placeholder-[#C4B99A]"
                  autoFocus
                />
              </div>
              <div className="flex gap-3 sm:gap-4 pb-2 sm:pb-0">
                <button type="button" onClick={() => setSelectedStudent(null)} className="flex-1 py-3 sm:py-4 border-2 border-[#E8E0D8] text-[#8B7355] font-medium rounded-2xl hover:bg-[#F5F0EB] transition cursor-pointer text-sm sm:text-base">Cancel</button>
                <button type="submit" disabled={slugLoading} className="flex-1 py-3 sm:py-4 bg-[#1A1A1A] text-white font-bold rounded-2xl hover:bg-[#333] transition disabled:opacity-50 cursor-pointer text-sm sm:text-base">
                  {slugLoading ? "Loading..." : "Access"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
