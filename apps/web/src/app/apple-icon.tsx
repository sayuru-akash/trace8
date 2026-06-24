import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111114",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="36" stroke="#A3E635" strokeWidth="3" fill="none" opacity="0.2" />
          <circle cx="40" cy="40" r="26" stroke="#A3E635" strokeWidth="3" fill="none" opacity="0.4" />
          <circle cx="40" cy="32" r="13" stroke="#A3E635" strokeWidth="4" fill="none" strokeLinecap="round" />
          <circle cx="40" cy="48" r="13" stroke="#86d431" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
