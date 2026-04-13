"use client";

interface SideQuestNodeProps {
  cx: number;
  cy: number;
  type: "quiz" | "task" | "streak" | "poll" | "speedrun" | "checkin" | "wager" | "bounty" | "chain" | "auction";
  completed: boolean;
  expired?: boolean;
  badgeEmoji: string | null;
  pointsReward: number;
  title: string;
  onClick: () => void;
}

const typeConfigs = {
  quiz: {
    outer: "#A78BFA",
    fill: "#7C3AED",
    gradLight: "#C4B5FD",
    gradDark: "#6D28D9",
    stroke: "#5B21B6",
    label: "Q",
  },
  task: {
    outer: "#2DD4BF",
    fill: "#0D9488",
    gradLight: "#5EEAD4",
    gradDark: "#0F766E",
    stroke: "#115E59",
    label: "T",
  },
  streak: {
    outer: "#FBBF24",
    fill: "#D97706",
    gradLight: "#FDE68A",
    gradDark: "#B45309",
    stroke: "#92400E",
    label: "S",
  },
  poll: {
    outer: "#FB7185",
    fill: "#E11D48",
    gradLight: "#FDA4AF",
    gradDark: "#BE123C",
    stroke: "#9F1239",
    label: "P",
  },
  speedrun: {
    outer: "#FB923C",
    fill: "#EA580C",
    gradLight: "#FDBA74",
    gradDark: "#C2410C",
    stroke: "#9A3412",
    label: "R",
  },
  checkin: {
    outer: "#38BDF8",
    fill: "#0284C7",
    gradLight: "#7DD3FC",
    gradDark: "#0369A1",
    stroke: "#075985",
    label: "C",
  },
  wager: {
    outer: "#F472B6",
    fill: "#DB2777",
    gradLight: "#F9A8D4",
    gradDark: "#BE185D",
    stroke: "#9D174D",
    label: "W",
  },
  bounty: {
    outer: "#A3E635",
    fill: "#65A30D",
    gradLight: "#D9F99D",
    gradDark: "#4D7C0F",
    stroke: "#3F6212",
    label: "B",
  },
  chain: {
    outer: "#C084FC",
    fill: "#9333EA",
    gradLight: "#D8B4FE",
    gradDark: "#7E22CE",
    stroke: "#6B21A8",
    label: "⛓",
  },
  auction: {
    outer: "#FCD34D",
    fill: "#CA8A04",
    gradLight: "#FEF08A",
    gradDark: "#A16207",
    stroke: "#854D0E",
    label: "$",
  },
};

export default function SideQuestNode({
  cx,
  cy,
  type,
  completed,
  expired = false,
  badgeEmoji,
  pointsReward,
  title,
  onClick,
}: SideQuestNodeProps) {
  const size = 24;
  const c = typeConfigs[type];
  const gradId = `sq-grad-${cx}-${cy}`;
  const locked = expired && !completed;
  const opacity = locked ? 0.4 : completed ? 1 : 0.85;

  // Hexagon points
  function hexPoints(cx: number, cy: number, r: number): string {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return points.join(" ");
  }

  return (
    <g
      onClick={locked ? undefined : onClick}
      style={{ cursor: locked ? "not-allowed" : "pointer" }}
      opacity={opacity}
      className={
        locked
          ? ""
          : completed
          ? "animate-side-quest-glow"
          : "animate-pulse-quest"
      }
    >
      <defs>
        <radialGradient id={gradId} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor={c.gradLight} />
          <stop offset="70%" stopColor={c.fill} />
          <stop offset="100%" stopColor={c.gradDark} />
        </radialGradient>
      </defs>

      {/* Invisible hit area for better tap targets */}
      <circle cx={cx} cy={cy} r={36} fill="transparent" />

      {/* Shadow */}
      <ellipse
        cx={cx}
        cy={cy + size + 3}
        rx={size * 0.6}
        ry={3}
        fill={c.stroke}
        opacity={0.3}
      />

      {/* Outer ring */}
      <polygon
        points={hexPoints(cx, cy, size + 4)}
        fill={c.outer}
        stroke={c.stroke}
        strokeWidth={1.5}
      />

      {/* Main hexagon */}
      <polygon
        points={hexPoints(cx, cy, size)}
        fill={`url(#${gradId})`}
        stroke={c.stroke}
        strokeWidth={2}
      />

      {/* Shine */}
      <ellipse
        cx={cx - 5}
        cy={cy - 7}
        rx={9}
        ry={6}
        fill="white"
        opacity={0.3}
        transform={`rotate(-20 ${cx - 5} ${cy - 7})`}
      />

      {/* Content: badge emoji or type label */}
      <text
        x={cx}
        y={cy + 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={badgeEmoji ? 16 : 14}
        fontWeight={800}
        fontFamily="Inter, system-ui, sans-serif"
        style={{ textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
      >
        {badgeEmoji || c.label}
      </text>

      {/* Points label below */}
      <text
        x={cx}
        y={cy + size + 16}
        textAnchor="middle"
        fill={c.fill}
        fontSize={10}
        fontWeight={700}
        fontFamily="Inter, system-ui, sans-serif"
      >
        +{pointsReward}pt
      </text>

      {/* Expired lock */}
      {locked && (
        <g>
          <circle cx={cx + size - 2} cy={cy - size + 2} r={8} fill="#6B7280" stroke="white" strokeWidth={1.5} />
          <text
            x={cx + size - 2}
            y={cy - size + 3}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fill="white"
          >
            🔒
          </text>
        </g>
      )}

      {/* Completed checkmark */}
      {completed && (
        <g>
          <circle cx={cx + size - 2} cy={cy - size + 2} r={8} fill="#22C55E" stroke="white" strokeWidth={1.5} />
          <path
            d={`M${cx + size - 6} ${cy - size + 2} l3 3 5-5`}
            fill="none"
            stroke="white"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </g>
  );
}
