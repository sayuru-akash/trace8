import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: "6px",
        }}
      >
        {/* Signal circle — chartreuse */}
        <svg width="24" height="24" viewBox="0 0 80 80" fill="none">
          {/* Outer ring */}
          <circle cx="40" cy="40" r="34" stroke="#A3E635" strokeWidth="3" fill="none" opacity="0.25" />
          {/* Inner ring */}
          <circle cx="40" cy="40" r="22" stroke="#A3E635" strokeWidth="3" fill="none" opacity="0.5" />
          {/* Top arc of 8 */}
          <circle cx="40" cy="32" r="11" stroke="#A3E635" strokeWidth="4" fill="none" strokeLinecap="round" />
          {/* Bottom arc of 8 */}
          <circle cx="40" cy="48" r="11" stroke="#86d431" strokeWidth="4" fill="none" strokeLinecap="round" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
