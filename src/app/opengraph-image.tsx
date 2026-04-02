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
          background: "linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 50%, #0A0A0A 100%)",
          fontFamily: "Inter, system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background decorative elements */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(196,162,101,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(196,162,101,0.1) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Shield icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 100,
            height: 100,
            borderRadius: 24,
            background: "linear-gradient(135deg, #C4A265 0%, #8B7355 100%)",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              fontSize: 56,
              display: "flex",
            }}
          >
            &#x1F3C6;
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#C4A265",
              letterSpacing: "-0.01em",
            }}
          >
            Quest
          </span>
          <span
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.01em",
            }}
          >
            Log
          </span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "#8B7355",
            fontWeight: 500,
            marginBottom: 48,
            display: "flex",
          }}
        >
          Gamified Attendance Tracking System
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
          }}
        >
          {["Leaderboards", "Challenges", "Badges", "Streaks"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 24px",
                borderRadius: 999,
                background: "rgba(196,162,101,0.1)",
                border: "1px solid rgba(196,162,101,0.2)",
                fontSize: 18,
                color: "#C4A265",
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, transparent, #C4A265, transparent)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
