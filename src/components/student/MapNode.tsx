"use client";

interface MapNodeProps {
  sessionNumber: number;
  status: "present" | "absent" | "locked";
  cx: number;
  cy: number;
  isLatest: boolean;
  onClick?: () => void;
}

export default function MapNode({
  sessionNumber,
  status,
  cx,
  cy,
  isLatest,
  onClick,
}: MapNodeProps) {
  const radius = 30;

  /* ─── Candy Crush color configs ─── */
  const configs = {
    present: {
      outer: "#FFD700",
      fill: "#FF8C00",
      gradLight: "#FFBF47",
      gradDark: "#E07000",
      stroke: "#CC6600",
      shadow: "#B85C00",
    },
    absent: {
      outer: "#FF6B9D",
      fill: "#E0405A",
      gradLight: "#FF7B8A",
      gradDark: "#C02040",
      stroke: "#A01030",
      shadow: "#8B0020",
    },
    locked: {
      outer: "#8B7AA0",
      fill: "#6B5B7B",
      gradLight: "#9B8AAB",
      gradDark: "#5A4A6A",
      stroke: "#4A3A5A",
      shadow: "#3A2A4A",
    },
  };

  const c = configs[status];
  const gradId = `node-grad-${sessionNumber}`;
  const glowId = `node-glow-${sessionNumber}`;

  return (
    <g
      className={isLatest && status !== "locked" ? "animate-bounce-node" : ""}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <defs>
        {/* Radial gradient for glossy candy button */}
        <radialGradient id={gradId} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor={c.gradLight} />
          <stop offset="70%" stopColor={c.fill} />
          <stop offset="100%" stopColor={c.gradDark} />
        </radialGradient>
        {/* Glow filter */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Invisible hit area for better tap targets (44pt minimum) */}
      <circle cx={cx} cy={cy} r={44} fill="transparent" />

      {/* "You Are Here" marker for latest node */}
      {isLatest && status !== "locked" && (
        <g>
          {/* Outer glow ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius + 16}
            fill="none"
            stroke="#FFD700"
            strokeWidth={3}
            opacity={0.6}
            className="animate-pulse-glow"
          />
          {/* Flag pole */}
          <line
            x1={cx}
            y1={cy - radius - 20}
            x2={cx}
            y2={cy - radius - 52}
            stroke="#FFD700"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {/* Flag */}
          <polygon
            points={`${cx},${cy - radius - 52} ${cx + 20},${cy - radius - 44} ${cx},${cy - radius - 36}`}
            fill="#FFD700"
            opacity={0.9}
          />
          {/* "HERE" label */}
          <text
            x={cx}
            y={cy - radius - 58}
            textAnchor="middle"
            fill="#FFD700"
            fontSize={9}
            fontWeight={800}
            fontFamily="Inter, system-ui, sans-serif"
          >
            YOU ARE HERE
          </text>
        </g>
      )}

      {/* Shadow underneath */}
      <ellipse
        cx={cx}
        cy={cy + radius + 4}
        rx={radius * 0.7}
        ry={4}
        fill={c.shadow}
        opacity={0.3}
      />

      {/* Outer ring (thick candy border) */}
      <circle
        cx={cx}
        cy={cy}
        r={radius + 4}
        fill={c.outer}
        stroke={c.stroke}
        strokeWidth={2}
      />

      {/* Main glossy circle */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill={`url(#${gradId})`}
        stroke={c.stroke}
        strokeWidth={2.5}
        filter={isLatest && status !== "locked" ? `url(#${glowId})` : undefined}
      />

      {/* Shine highlight (top-left reflection) */}
      <ellipse
        cx={cx - 8}
        cy={cy - 10}
        rx={12}
        ry={8}
        fill="white"
        opacity={0.35}
        transform={`rotate(-20 ${cx - 8} ${cy - 10})`}
      />

      {/* Small dot highlight */}
      <circle cx={cx - 12} cy={cy - 14} r={3} fill="white" opacity={0.5} />

      {/* ─── Content inside the node ─── */}
      {status === "present" && (
        <>
          {/* Session number */}
          <text
            x={cx}
            y={cy + 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={18}
            fontWeight={800}
            fontFamily="Inter, system-ui, sans-serif"
            style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
          >
            {sessionNumber}
          </text>

          {/* Stars above the node (1-3 stars for completed) */}
          {!isLatest && (
            <g>
              <polygon
                points={starPoints(cx, cy - radius - 16, 7)}
                fill="#FFD700"
                stroke="#CC8800"
                strokeWidth={1}
              />
              <polygon
                points={starPoints(cx - 14, cy - radius - 12, 5.5)}
                fill="#FFD700"
                stroke="#CC8800"
                strokeWidth={0.8}
              />
              <polygon
                points={starPoints(cx + 14, cy - radius - 12, 5.5)}
                fill="#FFD700"
                stroke="#CC8800"
                strokeWidth={0.8}
              />
            </g>
          )}
        </>
      )}

      {status === "absent" && (
        <>
          <text
            x={cx}
            y={cy - 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="white"
            fontSize={18}
            fontWeight={800}
            fontFamily="Inter, system-ui, sans-serif"
            style={{ textShadow: "0 2px 4px rgba(0,0,0,0.3)" }}
          >
            {sessionNumber}
          </text>
          <g opacity={0.9}>
            <line
              x1={cx - 5}
              y1={cy + 10}
              x2={cx + 5}
              y2={cy + 18}
              stroke="white"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <line
              x1={cx + 5}
              y1={cy + 10}
              x2={cx - 5}
              y2={cy + 18}
              stroke="white"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          </g>
        </>
      )}

      {status === "locked" && (
        <>
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgba(255,255,255,0.5)"
            fontSize={16}
            fontWeight={700}
            fontFamily="Inter, system-ui, sans-serif"
          >
            {sessionNumber}
          </text>
          <g opacity={0.6}>
            <rect
              x={cx - 6}
              y={cy + 8}
              width={12}
              height={10}
              rx={2}
              fill="rgba(255,255,255,0.6)"
            />
            <path
              d={`M${cx - 4} ${cy + 8} V${cy + 4} A4 4 0 0 1 ${cx + 4} ${cy + 4} V${cy + 8}`}
              fill="none"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        </>
      )}
    </g>
  );
}

/* ─── Helper: generate 5-pointed star SVG points ─── */
function starPoints(cx: number, cy: number, r: number): string {
  // Round to 2 decimals so Node V8 and browser V8 produce the same string.
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const inner = r * 0.45;
  const points: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = (Math.PI / 2) + (i * 2 * Math.PI) / 5;
    const innerAngle = outerAngle + Math.PI / 5;
    points.push(`${r2(cx + r * Math.cos(outerAngle))},${r2(cy - r * Math.sin(outerAngle))}`);
    points.push(`${r2(cx + inner * Math.cos(innerAngle))},${r2(cy - inner * Math.sin(innerAngle))}`);
  }
  return points.join(" ");
}
