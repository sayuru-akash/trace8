"use client";

import * as React from "react";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animate?: boolean;
  className?: string;
}

const sizes = { sm: 24, md: 32, lg: 48, xl: 80 };

export function Logo({ size = "md", animate = false, className }: LogoProps) {
  const px = sizes[size];
  return (
    <svg
      width={px}
      height={px}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="oklch(0.82 0.21 128)" />
          <stop offset="100%" stopColor="oklch(0.72 0.18 160)" />
        </linearGradient>
      </defs>
      {/* Outer signal circle */}
      <circle
        cx="40"
        cy="40"
        r="36"
        stroke="url(#logo-grad)"
        strokeWidth="3"
        fill="none"
        opacity="0.3"
      />
      {/* Inner signal circle */}
      <circle
        cx="40"
        cy="40"
        r="24"
        stroke="url(#logo-grad)"
        strokeWidth="3"
        fill="none"
        opacity="0.6"
      />
      {/* Top arc of 8 */}
      <circle
        cx="40"
        cy="32"
        r="12"
        stroke="url(#logo-grad)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      >
        {animate && (
          <animate
            attributeName="opacity"
            values="1;0.5;1"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </circle>
      {/* Bottom arc of 8 */}
      <circle
        cx="40"
        cy="48"
        r="12"
        stroke="url(#logo-grad)"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
      >
        {animate && (
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="2s"
            repeatCount="indefinite"
          />
        )}
      </circle>
    </svg>
  );
}
