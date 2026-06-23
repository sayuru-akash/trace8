import type { Metadata } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "@/styles/globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Trace8 — Playwright Testing Studio",
    template: "%s · Trace8",
  },
  description:
    "Run Playwright tests as usual. Stop digging through terminal output. Every run syncs into a clean dashboard where failures, traces, screenshots, and flaky tests are easy to understand.",
  keywords: [
    "playwright",
    "testing",
    "e2e",
    "test results",
    "flaky tests",
    "ci",
    "dashboard",
  ],
  authors: [{ name: "Codezela Technologies" }],
  metadataBase: new URL(
    process.env.APP_URL || "http://localhost:3000"
  ),
  openGraph: {
    title: "Trace8 — Playwright Testing Studio",
    description:
      "Run Playwright tests as usual. Stop digging through terminal output. Every run syncs into a clean dashboard where failures, traces, screenshots, and flaky tests are easy to understand.",
    type: "website",
    siteName: "Trace8",
  },
  twitter: {
    card: "summary_large_image",
    title: "Trace8 — Playwright Testing Studio",
    description:
      "Run Playwright tests as usual. Stop digging through terminal output. Every run syncs into a clean dashboard where failures, traces, screenshots, and flaky tests are easy to understand.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className="dark"
      suppressHydrationWarning
    >
      <body
        className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
