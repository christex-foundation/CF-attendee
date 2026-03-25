"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import Link from "next/link";
import MapNode from "./MapNode";
import SideQuestNodeComp from "./SideQuestNode";
import SideQuestPanel from "./SideQuestPanel";
import StudentStats from "./StudentStats";
import type { SideQuestNode } from "@/types";

interface Session {
  sessionNumber: number;
  status: "present" | "absent" | "locked";
}

interface ProgressMapProps {
  sessions: Session[];
  studentName: string;
  studentSlug: string;
  sideQuests: SideQuestNode[];
  stats: { totalPoints: number; badgeCount: number; badges: { emoji: string; name: string }[] };
  currentStreak: number;
}

/* ─── Candy decoration SVG snippets ─── */
function Lollipop({ x, y, color, size = 1 }: { x: number; y: number; color: string; size?: number }) {
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
  const scaleX = flip ? -1 : 1;
  return (
    <g transform={`translate(${x},${y}) scale(${scaleX},1)`} opacity={0.3}>
      <path d="M0 40 L0 10 A10 10 0 0 1 20 10" fill="none" stroke="#C4A265" strokeWidth={5} strokeLinecap="round" />
      <path d="M0 35 L0 10 A10 10 0 0 1 20 10" fill="none" stroke="white" strokeWidth={5} strokeDasharray="6 6" strokeLinecap="round" opacity={0.3} />
    </g>
  );
}

function Star4({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  return (
    <g className="animate-sparkle" style={{ animationDelay: `${(x + y) % 4}s` }}>
      <polygon
        points={`${x},${y - size} ${x + size * 0.3},${y - size * 0.3} ${x + size},${y} ${x + size * 0.3},${y + size * 0.3} ${x},${y + size} ${x - size * 0.3},${y + size * 0.3} ${x - size},${y} ${x - size * 0.3},${y - size * 0.3}`}
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

export default function ProgressMap({
  sessions,
  studentName,
  studentSlug,
  sideQuests,
  stats,
  currentStreak,
}: ProgressMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeQuest, setActiveQuest] = useState<SideQuestNode | null>(null);

  const mapWidth = 520;
  const nodeSpacingY = 140;
  const centerX = mapWidth / 2;
  const amplitude = 100;
  const topPadding = 120;
  const bottomPadding = 100;

  const sortedSessions = [...sessions].sort(
    (a, b) => a.sessionNumber - b.sessionNumber
  );

  const totalHeight =
    topPadding + sortedSessions.length * nodeSpacingY + bottomPadding;

  const nodes = sortedSessions.map((session, index) => {
    const cy = totalHeight - bottomPadding - index * nodeSpacingY;
    const cx = centerX + Math.sin((index * Math.PI) / 2.2) * amplitude;
    return { ...session, cx, cy };
  });

  const latestSessionNumber = sortedSessions
    .filter((s) => s.status !== "locked")
    .reduce((max, s) => Math.max(max, s.sessionNumber), 0);

  useEffect(() => {
    if (containerRef.current && latestSessionNumber > 0) {
      const latestNode = nodes.find(
        (n) => n.sessionNumber === latestSessionNumber
      );
      if (latestNode) {
        containerRef.current.scrollTo({
          top: latestNode.cy - window.innerHeight / 2,
          behavior: "smooth",
        });
      }
    }
  }, [latestSessionNumber, nodes]);

  function buildRoadPath(
    x1: number, y1: number,
    x2: number, y2: number
  ): string {
    const dy = (y2 - y1) * 0.4;
    return `M${x1},${y1} C${x1},${y1 + dy} ${x2},${y2 - dy} ${x2},${y2}`;
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
    // Deterministic pseudo-random based on index to avoid hydration mismatch
    function seededRandom(seed: number): number {
      const x = Math.sin(seed * 9301 + 49297) * 49297;
      const r = x - Math.floor(x);
      return Math.round(r * 1000) / 1000;
    }

    const decos: React.ReactNode[] = [];
    nodes.forEach((node, i) => {
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
  }, [nodes]);

  return (
    <div className="relative z-10 flex flex-col items-center min-h-screen">
      {/* Header */}
      <div className="pt-6 pb-2 text-center relative z-20">
        <div className="inline-block px-8 py-4 rounded-2xl bg-[#1A1A1A] border border-[#333] shadow-2xl">
          <h1 className="text-2xl font-extrabold text-white tracking-wide">
            {studentName}
          </h1>
          <p className="text-[#C4A265] text-xs font-semibold tracking-widest uppercase mt-1">
            Attendance Journey
          </p>
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
      </div>

      {/* Scrollable Map */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto w-full flex justify-center candy-scroll"
        style={{ maxHeight: "calc(100vh - 130px)" }}
      >
        <svg
          width={mapWidth}
          height={totalHeight}
          viewBox={`0 0 ${mapWidth} ${totalHeight}`}
          className="block"
        >
          <CandyLandscape width={mapWidth} height={totalHeight} />

          {/* ─── The Road ─── */}
          {nodes.map((node, i) => {
            if (i === 0) return null;
            const prev = nodes[i - 1];
            const d = buildRoadPath(prev.cx, prev.cy, node.cx, node.cy);

            return (
              <g key={`road-${node.sessionNumber}`}>
                <path d={d} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={30} strokeLinecap="round" />
                <path d={d} fill="none" stroke="#2A2A2A" strokeWidth={24} strokeLinecap="round" />
                <path d={d} fill="none" stroke="#C4A265" strokeWidth={26} strokeLinecap="round" opacity={0.06} />
                <path
                  d={d}
                  fill="none"
                  stroke={node.status === "locked" ? "#444" : "#C4A265"}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeDasharray="14 10"
                  opacity={node.status === "locked" ? 0.15 : 0.3}
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
              // Position side quest on opposite side of the next node
              const side = node.cx > centerX ? -1 : 1;
              const sqX = node.cx + side * (110 + qi * 50);
              const sqY = node.cy - 30;

              const branchD = buildRoadPath(node.cx, node.cy, sqX, sqY);

              return (
                <g key={`sq-branch-${sq.challenge.id}`}>
                  {/* Branch road - purple/gold style */}
                  <path d={branchD} fill="none" stroke="#6D28D9" strokeWidth={12} strokeLinecap="round" opacity={0.3} />
                  <path d={branchD} fill="none" stroke="#EDE9FE" strokeWidth={8} strokeLinecap="round" opacity={0.7} />
                  <path d={branchD} fill="none" stroke="#A78BFA" strokeWidth={3} strokeLinecap="round" strokeDasharray="4 8" opacity={0.6} />

                  <SideQuestNodeComp
                    cx={sqX}
                    cy={sqY}
                    type={sq.challenge.type}
                    completed={sq.progress?.completed ?? false}
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
          {decorations}

          {/* ─── Nodes ─── */}
          {nodes.map((node) => (
            <MapNode
              key={node.sessionNumber}
              sessionNumber={node.sessionNumber}
              status={node.status}
              cx={node.cx}
              cy={node.cy}
              isLatest={node.sessionNumber === latestSessionNumber}
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

      {/* Side Quest Panel */}
      {activeQuest && (
        <SideQuestPanel
          open={!!activeQuest}
          onClose={() => setActiveQuest(null)}
          studentSlug={studentSlug}
          challenge={activeQuest.challenge}
          completed={activeQuest.progress?.completed ?? false}
          currentStreak={currentStreak}
        />
      )}
    </div>
  );
}
