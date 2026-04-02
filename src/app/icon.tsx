import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #1A1A1A, #111)",
          borderRadius: 8,
        }}
      >
        <span style={{ fontSize: 24, lineHeight: 1 }}>🍬</span>
      </div>
    ),
    { ...size }
  );
}
