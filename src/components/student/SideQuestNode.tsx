"use client";

interface SideQuestNodeProps {
  cx: number;
  cy: number;
  type: "quiz" | "task" | "streak";
  completed: boolean;
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
};

export default function SideQuestNode({
  cx,
  cy,
  type,
  completed,
  badgeEmoji,
  pointsReward,
  title,
  onClick,
}: SideQuestNodeProps) {
  const size = 24;
  const c = typeConfigs[type];
  const gradId = `sq-grad-${cx}-${cy}`;
  const opacity = completed ? 1 : 0.7;

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
      onClick={onClick}
      style={{ cursor: "pointer" }}
      opacity={opacity}
      className={completed ? "animate-side-quest-glow" : ""}
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
