"use client";

import { useEffect, useRef, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import MapNode from "./MapNode";
import SideQuestNodeComp from "./SideQuestNode";
import SideQuestPanel from "./SideQuestPanel";
import StudentStats from "./StudentStats";
import StudentAvatar from "@/components/ui/StudentAvatar";
import AvatarPickerModal from "./AvatarPickerModal";
import type { SideQuestNode } from "@/types";

interface Session {
  sessionNumber: number;
  status: "present" | "absent" | "locked";
  date: string | null;
}

interface ProgressMapProps {
  sessions: Session[];
  studentName: string;
  studentSlug: string;
  studentAvatarUrl?: string | null;
  sideQuests: SideQuestNode[];
  stats: { totalPoints: number; badgeCount: number; badges: { emoji: string; name: string }[] };
  currentStreak: number;
}

/* ─── Candy decoration SVG snippets ─── */
// Node V8 and browser V8 disagree on Number.toString() for some doubles
// (e.g. 155.22228256875428 vs 155.2222825687543). Round before any value
// reaches an SVG attribute so SSR and client emit identical strings.
const r2 = (n: number) => Math.round(n * 100) / 100;

function Lollipop({ x, y, color, size = 1 }: { x: number; y: number; color: string; size?: number }) {
  x = r2(x); y = r2(y);
  const s = 12 * size;
  return (
    <g className="animate-float-candy" style={{ animationDelay: `${x % 3}s` }}>
      <line x1={x} y1={y + s} x2={x} y2={y + s + 20 * size} stroke="#8B7355" strokeWidth={3 * size} strokeLinecap="round" />
      <circle cx={x} cy={y + s * 0.3} r={s} fill={color} opacity={0.5} />
      <circle cx={x} cy={y + s * 0.3} r={s * 0.55} fill="none" stroke="white" strokeWidth={2 * size} opacity={0.15} />
      <circle cx={x - s * 0.3} cy={y} r={s * 0.2} fill="white" opacity={0.2} />
    </g>
  );
}

function CandyCane({ x, y, flip = false }: { x: number; y: number; flip?: boolean }) {
  x = r2(x); y = r2(y);
  const scaleX = flip ? -1 : 1;
  return (
    <g transform={`translate(${x},${y}) scale(${scaleX},1)`} opacity={0.3}>
      <path d="M0 40 L0 10 A10 10 0 0 1 20 10" fill="none" stroke="#C4A265" strokeWidth={5} strokeLinecap="round" />
      <path d="M0 35 L0 10 A10 10 0 0 1 20 10" fill="none" stroke="white" strokeWidth={5} strokeDasharray="6 6" strokeLinecap="round" opacity={0.3} />
    </g>
  );
}

function Star4({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  x = r2(x); y = r2(y); size = r2(size);
  return (
    <g className="animate-sparkle" style={{ animationDelay: `${(x + y) % 4}s` }}>
      <polygon
        points={`${r2(x)},${r2(y - size)} ${r2(x + size * 0.3)},${r2(y - size * 0.3)} ${r2(x + size)},${r2(y)} ${r2(x + size * 0.3)},${r2(y + size * 0.3)} ${r2(x)},${r2(y + size)} ${r2(x - size * 0.3)},${r2(y + size * 0.3)} ${r2(x - size)},${r2(y)} ${r2(x - size * 0.3)},${r2(y - size * 0.3)}`}
        fill={color}
        opacity={0.8}
      />
    </g>
  );
}

function CandyLandscape({ width, height }: { width: number; height: number }) {
  const hills = useMemo(() => {
    const result: { d: string; fill: string; opacity: number }[] = [];
    const step = 300;
    for (let y = 100; y < height; y += step) {
      result.push({
        d: `M0 ${y + 60} Q${width * 0.25} ${y - 30} ${width * 0.5} ${y + 40} Q${width * 0.75} ${y + 110} ${width} ${y + 30} L${width} ${y + 150} L0 ${y + 150} Z`,
        fill: "#C4A265",
        opacity: 0.03,
      });
      result.push({
        d: `M0 ${y + 100} Q${width * 0.3} ${y + 20} ${width * 0.6} ${y + 90} Q${width * 0.85} ${y + 150} ${width} ${y + 70} L${width} ${y + 180} L0 ${y + 180} Z`,
        fill: "#C4A265",
        opacity: 0.02,
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

/* ─── Hook: measure container width ─── */
function useContainerWidth(ref: React.RefObject<HTMLDivElement | null>) {
  const [width, setWidth] = useState(520); // SSR-safe default

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setWidth(el.offsetWidth);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return width;
}

export default function ProgressMap({
  sessions,
  studentName,
  studentSlug,
  studentAvatarUrl,
  sideQuests,
  stats,
  currentStreak,
}: ProgressMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [activeQuest, setActiveQuest] = useState<SideQuestNode | null>(null);
  const [activeSession, setActiveSession] = useState<(Session & { cx: number; cy: number }) | null>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(studentAvatarUrl);

  const containerWidth = useContainerWidth(svgContainerRef);
  const isNarrow = containerWidth < 400;

  const mapWidth = 520;
  const nodeSpacingY = isNarrow
    ? sessions.length > 20 ? 90 : 120
    : sessions.length > 20 ? 100 : 140;
  const centerX = mapWidth / 2;
  const amplitude = isNarrow ? 120 : 160;
  const topPadding = 120;
  const bottomPadding = 100;

  const sortedSessions = [...sessions].sort(
    (a, b) => a.sessionNumber - b.sessionNumber
  );

  const totalHeight =
    topPadding + sortedSessions.length * nodeSpacingY + bottomPadding;

  const nodes = sortedSessions.map((session, index) => {
    const cy = totalHeight - bottomPadding - index * nodeSpacingY;
    // Round to 2 decimals so SSR (Node V8) and client (browser V8) emit
    // the same string for SVG attributes — they diverge at full float precision.
    const cx = Math.round(
      (centerX + Math.sin((index * Math.PI) / 2.2 - Math.PI / 2) * amplitude) * 100
    ) / 100;
    return { ...session, cx, cy };
  });

  const latestSessionNumber = sortedSessions
    .filter((s) => s.status !== "locked")
    .reduce((max, s) => Math.max(max, s.sessionNumber), 0);

  // Scroll to center the latest node in view
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const latestNode = nodes.find((n) => n.sessionNumber === latestSessionNumber);
    if (!latestNode) {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      return;
    }

    // Calculate SVG scale factor
    const svgEl = container.querySelector("svg");
    if (!svgEl) return;
    const scale = svgEl.clientHeight / totalHeight;
    const nodePixelY = latestNode.cy * scale;
    const scrollTarget = nodePixelY - container.clientHeight / 2;

    container.scrollTo({ top: Math.max(0, scrollTarget), behavior: "smooth" });
  }, [latestSessionNumber, nodes, totalHeight]);

  function buildRoadPath(
    x1: number, y1: number,
    x2: number, y2: number
  ): string {
    const r = (n: number) => (Math.round(n * 100) / 100).toString();
    const dy = (y2 - y1) * 0.4;
    return `M${r(x1)},${r(y1)} C${r(x1)},${r(y1 + dy)} ${r(x2)},${r(y2 - dy)} ${r(x2)},${r(y2)}`;
  }

  // Map side quests to their anchor nodes
  const questsBySession = useMemo(() => {
    const map = new Map<number, SideQuestNode[]>();
    for (const sq of sideQuests) {
      const existing = map.get(sq.anchorSession) || [];
      existing.push(sq);
      map.set(sq.anchorSession, existing);
    }
    return map;
  }, [sideQuests]);

  const decorations = useMemo(() => {
    function seededRandom(seed: number): number {
      const x = Math.sin(seed * 9301 + 49297) * 49297;
      const r = x - Math.floor(x);
      return Math.round(r * 1000) / 1000;
    }

    const decos: React.ReactNode[] = [];
    nodes.forEach((node, i) => {
      // On narrow screens, skip every other decoration
      if (isNarrow && i % 2 !== 0) return;

      const side = i % 2 === 0 ? 1 : -1;
      const offsetX = side * (70 + seededRandom(i) * 40);

      if (i % 3 === 0) {
        const colors = ["#C4A265", "#FFD700", "#4ADE80", "#A78BFA"];
        decos.push(
          <Lollipop key={`lollipop-${i}`} x={node.cx + offsetX} y={node.cy - 20} color={colors[i % colors.length]} size={0.8 + seededRandom(i + 100) * 0.4} />
        );
      }
      if (i % 4 === 1) {
        decos.push(
          <CandyCane key={`cane-${i}`} x={node.cx + offsetX * 0.8} y={node.cy - 10} flip={side < 0} />
        );
      }
      if (i % 2 === 0) {
        decos.push(
          <Star4 key={`star-${i}`} x={node.cx + offsetX * 0.5} y={node.cy - 30 - seededRandom(i + 200) * 20} size={5 + seededRandom(i + 300) * 4} color={i % 2 === 0 ? "#C4A265" : "#FFD700"} />
        );
      }
    });
    return decos;
  }, [nodes, isNarrow]);

  // Progress stats
  const completedCount = sessions.filter((s) => s.status !== "locked").length;
  const presentCount = sessions.filter((s) => s.status === "present").length;
  const progressPercent = sessions.length > 0 ? (completedCount / sessions.length) * 100 : 0;

  // Dismiss session popover on tap outside or Escape key
  const handleBackdropClick = useCallback(() => {
    setActiveSession(null);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setActiveSession(null);
        setActiveQuest(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative z-10 flex flex-col items-center min-h-dvh">
      {/* Header */}
      <div className="pt-6 pb-2 text-center relative z-20 px-4 w-full max-w-[560px]">
        <div className="inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-8 py-3 sm:py-4 rounded-2xl bg-[#1A1A1A] border border-[#333] shadow-2xl">
          <button
            type="button"
            onClick={() => setShowAvatarPicker(true)}
            className="relative group cursor-pointer shrink-0"
            title="Change avatar"
          >
            <StudentAvatar slug={studentSlug} name={studentName} size={isNarrow ? 36 : 48} avatarUrl={avatarUrl} />
            <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </div>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              {studentName}
            </h1>
            <p className="text-[#C4A265] text-xs font-semibold tracking-widest uppercase mt-1">
              Attendance Journey
            </p>
          </div>
        </div>
        <StudentStats
          totalPoints={stats.totalPoints}
          badgeCount={stats.badgeCount}
          badges={stats.badges}
          currentStreak={currentStreak}
        />
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1.5 mt-2 px-4 py-1.5 rounded-full bg-[#1A1A1A] border border-[#333] text-white text-xs font-semibold hover:bg-[#333] transition"
        >
          &#x1F3C6; Leaderboard
        </Link>

        {/* Progress Bar */}
        <div className="mt-3 w-full max-w-xs mx-auto">
          <div className="flex justify-between text-[10px] text-[#999] font-semibold mb-1">
            <span>{presentCount}/{sessions.length} sessions attended</span>
            <span>{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 bg-[#1A1A1A] rounded-full border border-[#333] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${progressPercent}%`,
                background: "linear-gradient(90deg, #C4A265, #FFD700, #FF8C00)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Active Challenges Banner — only items the student hasn't attempted yet
          and that are still actionable (not past deadline, not won by someone
          else, not a closed check-in window). */}
      {(() => {
        const pending = sideQuests.filter((sq) => {
          if (sq.progress?.completed) return false;
          if (sq.taskSubmission) return false; // attempted (task/bounty)
          if (sq.challenge.deadline && new Date(sq.challenge.deadline) < new Date()) return false;
          if (sq.challenge.type === "bounty" && sq.bountyClaimed) return false;
          if (sq.challenge.type === "checkin" && sq.checkinWindowClosed) return false;
          return true;
        });
        if (pending.length === 0) return null;
        return (
          <button
            type="button"
            onClick={() => {
              // Scroll to and open the first pending quest
              const first = pending[0];
              setActiveQuest(first);
            }}
            className="mx-4 mt-2 mb-1 w-full max-w-[520px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-900/60 to-purple-800/40 border border-purple-500/30 flex items-center gap-3 cursor-pointer hover:border-purple-400/50 transition relative overflow-hidden group"
          >
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500" />
            </span>
            <span className="text-sm font-semibold text-purple-200">
              {pending.length} active {pending.length === 1 ? "challenge" : "challenges"} available
            </span>
            <span className="ml-auto text-xs text-purple-400 font-medium group-hover:text-purple-300 transition">
              View &rarr;
            </span>
          </button>
        );
      })()}

      {/* Scrollable Map */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto w-full flex justify-center candy-scroll"
        style={{ maxHeight: "calc(100dvh - 130px)" }}
      >
        <div ref={svgContainerRef} className="w-full max-w-[520px] px-2">
          <svg
            viewBox={`0 0 ${mapWidth} ${totalHeight}`}
            preserveAspectRatio="xMidYMin meet"
            className="w-full block"
          >
            <CandyLandscape width={mapWidth} height={totalHeight} />

            {/* ─── The Road ─── */}
            {nodes.map((node, i) => {
              if (i === 0) return null;
              const prev = nodes[i - 1];
              const d = buildRoadPath(prev.cx, prev.cy, node.cx, node.cy);

              return (
                <g key={`road-${node.sessionNumber}`}>
                  <path d={d} fill="none" stroke="rgba(0,0,0,0.6)" strokeWidth={36} strokeLinecap="round" />
                  <path d={d} fill="none" stroke="#3A3A3A" strokeWidth={28} strokeLinecap="round" />
                  <path d={d} fill="none" stroke="#C4A265" strokeWidth={30} strokeLinecap="round" opacity={0.12} />
                  <path d={d} fill="none" stroke="#4A4A4A" strokeWidth={28} strokeLinecap="round" opacity={0.3} />
                  <path
                    d={d}
                    fill="none"
                    stroke={node.status === "locked" ? "#555" : "#C4A265"}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray="16 10"
                    opacity={node.status === "locked" ? 0.3 : 0.5}
                    className={node.status !== "locked" ? "animate-road-dash" : ""}
                  />
                </g>
              );
            })}

            {/* ─── Side Quest Branches ─── */}
            {nodes.map((node) => {
              const quests = questsBySession.get(node.sessionNumber);
              if (!quests) return null;

              return quests.map((sq, qi) => {
                // Deterministic pseudo-random side based on challenge id
                const side = sq.challenge.id % 2 === 0 ? 1 : -1;
                const rawSqX = node.cx + side * (110 + qi * 50);
                const sqX = Math.max(40, Math.min(mapWidth - 40, rawSqX));
                const sqY = node.cy - 30;

                const branchD = buildRoadPath(node.cx, node.cy, sqX, sqY);

                return (
                  <g key={`sq-branch-${sq.challenge.id}`}>
                    <path d={branchD} fill="none" stroke="#6D28D9" strokeWidth={12} strokeLinecap="round" opacity={0.3} />
                    <path d={branchD} fill="none" stroke="#EDE9FE" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
                    <path d={branchD} fill="none" stroke="#A78BFA" strokeWidth={3} strokeLinecap="round" strokeDasharray="4 8" opacity={0.6} />

                    <SideQuestNodeComp
                      cx={sqX}
                      cy={sqY}
                      type={sq.challenge.type}
                      completed={sq.progress?.completed ?? false}
                      expired={
                        !!sq.challenge.deadline &&
                        new Date(sq.challenge.deadline) < new Date()
                      }
                      badgeEmoji={sq.challenge.badgeEmoji}
                      pointsReward={sq.challenge.pointsReward}
                      title={sq.challenge.title}
                      onClick={() => setActiveQuest(sq)}
                    />
                  </g>
                );
              });
            })}

            {/* ─── Decorations ─── */}
            <g aria-hidden="true">{decorations}</g>

            {/* ─── Nodes ─── */}
            {nodes.map((node) => (
              <MapNode
                key={node.sessionNumber}
                sessionNumber={node.sessionNumber}
                status={node.status}
                cx={node.cx}
                cy={node.cy}
                isLatest={node.sessionNumber === latestSessionNumber}
                onClick={() => setActiveSession(node)}
              />
            ))}

            {/* Extra sparkle stars */}
            {nodes
              .filter((n) => n.status === "present")
              .map((n, i) => (
                <Star4
                  key={`extra-star-${i}`}
                  x={n.cx + (i % 2 === 0 ? 35 : -35)}
                  y={n.cy + 5}
                  size={4}
                  color="#FFD700"
                />
              ))}
          </svg>
        </div>
      </div>

      {/* Session Detail Popover */}
      {activeSession && (
        <div className="fixed inset-0 z-50" onClick={handleBackdropClick}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl px-6 py-5 shadow-2xl min-w-[220px] text-center">
              <div className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-2">
                Session {activeSession.sessionNumber}
              </div>
              <div className="mb-3">
                {activeSession.status === "present" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF8C00]/20 text-[#FFD700] text-sm font-bold">
                    &#x2713; Present
                  </span>
                )}
                {activeSession.status === "absent" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E0405A]/20 text-[#FF6B9D] text-sm font-bold">
                    &#x2717; Absent
                  </span>
                )}
                {activeSession.status === "locked" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6B5B7B]/20 text-[#8B7AA0] text-sm font-bold">
                    &#x1F512; Upcoming
                  </span>
                )}
              </div>
              {activeSession.date && (
                <div className="text-[#ccc] text-sm mb-2">
                  {new Date(activeSession.date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              )}
              <div className="text-[#C4A265] text-lg font-bold">
                {activeSession.status === "present" ? "+10 pts" : "0 pts"}
              </div>
              <button
                onClick={() => setActiveSession(null)}
                className="mt-3 text-xs text-[#666] hover:text-white transition"
              >
                Tap to dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Side Quest Panel */}
      {activeQuest && (
        <SideQuestPanel
          open={!!activeQuest}
          onClose={() => setActiveQuest(null)}
          studentSlug={studentSlug}
          challenge={activeQuest.challenge}
          completed={activeQuest.progress?.completed ?? false}
          pointsEarned={activeQuest.progress?.pointsEarned ?? 0}
          taskSubmission={activeQuest.taskSubmission ?? null}
          currentStreak={currentStreak}
          slotsRemaining={activeQuest.slotsRemaining}
          checkinWindowOpen={activeQuest.checkinWindowOpen}
          checkinWindowEndsAt={activeQuest.checkinWindowEndsAt}
          chainProgress={activeQuest.chainProgress}
          highestBid={activeQuest.highestBid}
          highestBidder={activeQuest.highestBidder}
          studentBid={activeQuest.studentBid}
          bountyClaimed={activeQuest.bountyClaimed}
        />
      )}

      {/* Avatar Picker */}
      <AvatarPickerModal
        open={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        slug={studentSlug}
        currentAvatarUrl={avatarUrl ?? null}
        onUpdated={(newUrl) => setAvatarUrl(newUrl)}
      />
    </div>
  );
}
