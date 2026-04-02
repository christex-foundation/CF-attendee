import { ImageResponse } from "next/og";

export const alt = "QuestLog - Gamified Attendance Tracking";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Colorful glow blobs */}
        <div style={{ position: "absolute", top: -60, left: 80, width: 340, height: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(74,222,128,0.18) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", top: 60, right: 60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(167,139,250,0.16) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: -40, left: "40%", width: 350, height: 350, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,162,101,0.14) 0%, transparent 70%)", display: "flex" }} />
        <div style={{ position: "absolute", bottom: 40, left: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,140,0,0.12) 0%, transparent 70%)", display: "flex" }} />

        {/* Scattered candy emojis */}
        <div style={{ position: "absolute", top: 50, left: 90, fontSize: 42, display: "flex", transform: "rotate(-15deg)", opacity: 0.7 }}>🍭</div>
        <div style={{ position: "absolute", top: 80, right: 120, fontSize: 36, display: "flex", transform: "rotate(12deg)", opacity: 0.6 }}>🍬</div>
        <div style={{ position: "absolute", bottom: 90, left: 140, fontSize: 38, display: "flex", transform: "rotate(20deg)", opacity: 0.6 }}>🏆</div>
        <div style={{ position: "absolute", bottom: 70, right: 100, fontSize: 34, display: "flex", transform: "rotate(-10deg)", opacity: 0.5 }}>🔥</div>
        <div style={{ position: "absolute", top: 200, left: 50, fontSize: 30, display: "flex", transform: "rotate(8deg)", opacity: 0.4 }}>⭐</div>
        <div style={{ position: "absolute", top: 160, right: 60, fontSize: 32, display: "flex", transform: "rotate(-20deg)", opacity: 0.45 }}>🎯</div>
        <div style={{ position: "absolute", bottom: 180, right: 200, fontSize: 28, display: "flex", transform: "rotate(15deg)", opacity: 0.4 }}>🍫</div>

        {/* Main content card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "48px 72px",
            borderRadius: 32,
            background: "linear-gradient(145deg, rgba(26,26,26,0.95) 0%, rgba(17,17,17,0.95) 100%)",
            border: "1.5px solid rgba(196,162,101,0.25)",
            boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
          }}
        >
          {/* Emoji row */}
          <div style={{ display: "flex", gap: 12, marginBottom: 28, fontSize: 48 }}>
            <span style={{ display: "flex" }}>🍬</span>
            <span style={{ display: "flex" }}>🗺️</span>
            <span style={{ display: "flex" }}>🍬</span>
          </div>

          {/* Title */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 12 }}>
            <span style={{ fontSize: 72, fontWeight: 900, color: "#C4A265", letterSpacing: "-0.02em" }}>Quest</span>
            <span style={{ fontSize: 72, fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.02em" }}>Log</span>
          </div>

          {/* Tagline */}
          <div style={{ fontSize: 26, color: "#999", fontWeight: 500, marginBottom: 36, display: "flex" }}>
            Level up your class. Track the adventure.
          </div>

          {/* Feature pills */}
          <div style={{ display: "flex", gap: 14 }}>
            {[
              { label: "Leaderboards", color: "#4ADE80" },
              { label: "Challenges", color: "#A78BFA" },
              { label: "Badges", color: "#FBBF24" },
              { label: "Streaks", color: "#FF8C00" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: `${item.color}18`,
                  border: `1.5px solid ${item.color}40`,
                  fontSize: 18,
                  color: item.color,
                  fontWeight: 700,
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom gradient bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 5, background: "linear-gradient(90deg, #4ADE80, #C4A265, #A78BFA, #FF8C00, #4ADE80)", display: "flex" }} />
      </div>
    ),
    { ...size }
  );
}
