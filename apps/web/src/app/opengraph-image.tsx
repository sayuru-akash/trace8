import { ImageResponse } from "next/og";

export const alt = "Trace8 — Playwright Testing Studio";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OgImage() {
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
          backgroundColor: "#111114",
          backgroundImage:
            "radial-gradient(circle at 30% 40%, rgba(163, 230, 53, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(163, 230, 53, 0.05) 0%, transparent 50%)",
        }}
      >
        {/* Logo */}
        <svg width="100" height="100" viewBox="0 0 80 80" fill="none" style={{ marginBottom: 32 }}>
          <circle cx="40" cy="40" r="36" stroke="#A3E635" strokeWidth="3" fill="none" opacity="0.2" />
          <circle cx="40" cy="40" r="26" stroke="#A3E635" strokeWidth="3" fill="none" opacity="0.5" />
          <circle cx="40" cy="32" r="13" stroke="#A3E635" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="40" cy="48" r="13" stroke="#86d431" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
        {/* Title */}
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#f5f5f5",
            fontFamily: "sans-serif",
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}
        >
          Trace8
        </div>
        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "#A3E635",
            fontFamily: "sans-serif",
            fontWeight: 500,
            marginBottom: 16,
          }}
        >
          Playwright Testing Studio
        </div>
        {/* Description */}
        <div
          style={{
            fontSize: 20,
            color: "#8b8b94",
            fontFamily: "sans-serif",
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Run tests. See everything. Fix faster.
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
