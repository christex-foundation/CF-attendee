import { ImageResponse } from "next/og";

export const alt = "QuestLog — Level up your class";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const leaderboard = [
    { rank: 1, name: "Ada L.", pts: 2840, emoji: "👑", color: "#FBBF24" },
    { rank: 2, name: "Kai M.",  pts: 2615, emoji: "🥈", color: "#C0C0C0" },
    { rank: 3, name: "Zara P.", pts: 2390, emoji: "🥉", color: "#CD7F32" },
    { rank: 4, name: "Theo R.", pts: 2155, emoji: "🔥", color: "#A78BFA" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0A0A0A",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(196,162,101,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(196,162,101,0.06) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            display: "flex",
          }}
        />

        {/* Glow blobs */}
        <div style={{ position: "absolute", top: -120, left: -80, width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,162,101,0.28) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -160, right: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.22) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", top: 200, right: 380, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.14) 0%, transparent 70%)", display: "flex" }} />

        {/* LEFT — hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "70px 0 70px 80px",
            width: 640,
            zIndex: 1,
          }}
        >
          {/* Live pill */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 18px",
              borderRadius: 999,
              background: "rgba(74,222,128,0.12)",
              border: "1.5px solid rgba(74,222,128,0.45)",
              alignSelf: "flex-start",
              marginBottom: 28,
            }}
          >
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ADE80", display: "flex", boxShadow: "0 0 12px #4ADE80" }} />
            <span style={{ fontSize: 18, color: "#4ADE80", fontWeight: 700, letterSpacing: "0.04em", display: "flex" }}>
              LIVE LEADERBOARD
            </span>
          </div>

          {/* Title */}
          <div style={{ display: "flex", alignItems: "baseline", marginBottom: 14 }}>
            <span style={{ fontSize: 110, fontWeight: 900, color: "#C4A265", letterSpacing: "-0.04em", lineHeight: 0.9 }}>Quest</span>
            <span style={{ fontSize: 110, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.04em", lineHeight: 0.9 }}>Log</span>
          </div>

          {/* Tagline */}
          <div style={{ fontSize: 30, color: "#D4D4D4", fontWeight: 600, marginBottom: 8, display: "flex", lineHeight: 1.2 }}>
            Level up your class.
          </div>
          <div style={{ fontSize: 30, color: "#888", fontWeight: 500, marginBottom: 38, display: "flex", lineHeight: 1.2 }}>
            Track the adventure.
          </div>

          {/* Stat row */}
          <div style={{ display: "flex", gap: 18 }}>
            {[
              { num: "120+", label: "Quests", color: "#A78BFA" },
              { num: "48", label: "Badges", color: "#FBBF24" },
              { num: "🔥 21", label: "Streak", color: "#FF8C00" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  padding: "14px 22px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${s.color}55`,
                }}
              >
                <span style={{ fontSize: 28, fontWeight: 900, color: s.color, display: "flex", lineHeight: 1 }}>{s.num}</span>
                <span style={{ fontSize: 14, color: "#888", fontWeight: 600, marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase", display: "flex" }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — leaderboard mock card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "70px 80px 70px 0",
            flex: 1,
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              padding: 28,
              borderRadius: 28,
              background: "linear-gradient(165deg, rgba(28,28,28,0.98) 0%, rgba(15,15,15,0.98) 100%)",
              border: "1.5px solid rgba(196,162,101,0.35)",
              boxShadow: "0 50px 120px rgba(0,0,0,0.6), 0 0 60px rgba(196,162,101,0.15)",
              transform: "rotate(-2deg)",
            }}
          >
            {/* Card header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28, display: "flex" }}>🏆</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: "#FFF", display: "flex" }}>Top Adventurers</span>
              </div>
              <span style={{ fontSize: 14, color: "#666", fontWeight: 600, display: "flex" }}>Week 6</span>
            </div>

            {/* Rows */}
            {leaderboard.map((row) => (
              <div
                key={row.rank}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 16px",
                  marginBottom: 8,
                  borderRadius: 14,
                  background: row.rank === 1 ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.025)",
                  border: row.rank === 1 ? "1.5px solid rgba(251,191,36,0.4)" : "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: `${row.color}25`,
                    border: `1.5px solid ${row.color}60`,
                    fontSize: 18,
                    fontWeight: 900,
                    color: row.color,
                  }}
                >
                  {row.rank}
                </div>
                <span style={{ fontSize: 26, display: "flex" }}>{row.emoji}</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: "#FFF", flex: 1, display: "flex" }}>{row.name}</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: row.color, display: "flex" }}>{row.pts.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gradient bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 6, background: "linear-gradient(90deg, #4ADE80, #FBBF24, #C4A265, #A78BFA, #FF8C00, #4ADE80)", display: "flex" }} />
      </div>
    ),
    { ...size }
  );
}
