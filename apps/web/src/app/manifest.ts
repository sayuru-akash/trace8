import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trace8 — Playwright Testing Studio",
    short_name: "Trace8",
    description:
      "Run Playwright tests as usual. Stop digging through terminal output. Every run syncs into a clean dashboard where failures, traces, screenshots, and flaky tests are easy to understand.",
    start_url: "/",
    display: "standalone",
    background_color: "#111114",
    theme_color: "#A3E635",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
